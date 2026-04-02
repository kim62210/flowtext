import { FlowtextError, type FlowtextLayoutResult } from 'flowtext';
import { DemoState } from './state';
import { SvgRenderer } from './renderers/svg-renderer';
import { CanvasRenderer } from './renderers/canvas-renderer';
import { AsciiRenderer } from './renderers/ascii-renderer';
import type { Renderer, ViewportSize } from './renderers/types';
import { presets } from './presets/index';
import { createTabs } from './ui/tabs';
import { createJsonEditor, type JsonEditorInstance } from './editor/json-editor';
import { createPropertyPanel } from './editor/property-panel';

const loadingOverlay = document.getElementById('loading-overlay')!;
const errorOverlay = document.getElementById('error-overlay')!;
const errorMessage = document.getElementById('error-message')!;

// --- State ---
const initialPreset = presets[0];
const state = new DemoState(initialPreset.node, initialPreset.constraints);
state.setSelectedNodeId(initialPreset.initialSelectedNodeId);

// --- Renderers ---
const svgContainer = document.getElementById('renderer-svg')!;
const canvasContainer = document.getElementById('renderer-canvas')!;
const asciiContainer = document.getElementById('renderer-ascii')!;

const svgRenderer = new SvgRenderer();
const canvasRenderer = new CanvasRenderer();
const asciiRenderer = new AsciiRenderer();

svgRenderer.mount(svgContainer);
canvasRenderer.mount(canvasContainer);
asciiRenderer.mount(asciiContainer);

const renderers: { renderer: Renderer; container: HTMLElement }[] = [
  { renderer: svgRenderer, container: svgContainer },
  { renderer: canvasRenderer, container: canvasContainer },
  { renderer: asciiRenderer, container: asciiContainer },
];

function renderAll(result: FlowtextLayoutResult) {
  requestAnimationFrame(() => {
    for (const { renderer, container } of renderers) {
      const viewport: ViewportSize = {
        width: container.clientWidth,
        height: container.clientHeight,
      };
      renderer.render(result, viewport);
    }
  });
}

state.addEventListener('result-change', (e) => {
  const result = (e as CustomEvent<FlowtextLayoutResult>).detail;
  errorOverlay.hidden = true;
  renderAll(result);
});

state.addEventListener('layout-error', (e) => {
  const error = (e as CustomEvent).detail;
  const message = formatErrorHint(error);
  errorMessage.textContent = message;
  errorOverlay.hidden = false;
});

// Re-render on window resize
let resizeTimer: ReturnType<typeof setTimeout> | null = null;
window.addEventListener('resize', () => {
  if (resizeTimer) clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const result = state.getResult();
    if (result) renderAll(result);
  }, 100);
});

// --- Preset Tabs ---
const presetTabsContainer = document.getElementById('preset-tabs')!;
createTabs(
  presetTabsContainer,
  presets.map((p) => ({ id: p.id, label: p.label })),
  (id) => {
    const preset = presets.find((p) => p.id === id);
    if (!preset) return;
    state.setConstraints(preset.constraints);
    state.setNode(preset.node);
    state.setSelectedNodeId(preset.initialSelectedNodeId);
    // Sync JSON editor
    if (jsonEditor) {
      jsonEditor.setValue(JSON.stringify(preset.node, null, 2));
    }
  },
  initialPreset.id,
);

// --- Editor Tabs ---
const editorTabsContainer = document.getElementById('editor-tabs')!;
const jsonEditorContainer = document.getElementById('json-editor-container')!;
const propertyPanelContainer = document.getElementById('property-panel-container')!;

createTabs(
  editorTabsContainer,
  [
    { id: 'json', label: 'JSON' },
    { id: 'properties', label: 'Properties' },
  ],
  (id) => {
    jsonEditorContainer.hidden = id !== 'json';
    propertyPanelContainer.hidden = id !== 'properties';
  },
  'json',
);

// --- JSON Editor ---
let jsonEditor: JsonEditorInstance | null = null;
let suppressJsonSync = false;

async function initJsonEditor() {
  const initialJson = JSON.stringify(state.getNode(), null, 2);

  jsonEditor = await createJsonEditor(
    jsonEditorContainer,
    initialJson,
    (value) => {
      if (suppressJsonSync) return;
      try {
        const parsed = JSON.parse(value);
        suppressJsonSync = true;
        state.setNode(parsed);
        suppressJsonSync = false;
      } catch {
        // Invalid JSON -- ignore, user is still typing
      }
    },
  );

  // Sync editor when state changes from property panel
  state.addEventListener('node-change', () => {
    if (suppressJsonSync || !jsonEditor) return;
    suppressJsonSync = true;
    jsonEditor.setValue(JSON.stringify(state.getNode(), null, 2));
    suppressJsonSync = false;
  });
}

// --- Property Panel ---
createPropertyPanel(propertyPanelContainer, state);

// --- Initialize ---
async function init() {
  try {
    await initJsonEditor();
    // Wait for the first layout result (triggers Yoga WASM init)
    await new Promise<void>((resolve, reject) => {
      const onResult = () => {
        state.removeEventListener('result-change', onResult);
        state.removeEventListener('layout-error', onError);
        resolve();
      };
      const onError = (e: Event) => {
        state.removeEventListener('result-change', onResult);
        state.removeEventListener('layout-error', onError);
        reject((e as CustomEvent).detail);
      };
      state.addEventListener('result-change', onResult);
      state.addEventListener('layout-error', onError);
    });
    loadingOverlay.hidden = true;
  } catch (error) {
    loadingOverlay.innerHTML = `
      <div class="error-content" style="border-color: var(--color-error);">
        <p>Layout engine failed to load. Please reload.</p>
        <button onclick="location.reload()" style="margin-top:12px;padding:6px 16px;border-radius:6px;border:1px solid var(--color-border);background:#fff;cursor:pointer;">
          Reload
        </button>
      </div>
    `;
    throw error;
  }
}

init();

// --- Error Formatting ---
function formatErrorHint(error: unknown): string {
  if (error instanceof FlowtextError) {
    switch (error.code) {
      case 'UNSUPPORTED_STYLE':
        return `${error.message}\n\nSupported: flexDirection, justifyContent, alignItems, alignSelf, flexGrow, flexShrink, width, height, minWidth, maxWidth, minHeight, maxHeight, padding, margin, fontSize, lineHeight, fontFamily, fontWeight, whiteSpace`;
      case 'INVALID_NODE':
        return `${error.message}\n\nSupported node types: "view", "text". Each node must have "id" and "type".`;
      case 'MEASURE_FAILED':
        return `${error.message}\n\nCheck that text nodes have valid fontSize and fontFamily.`;
    }
  }
  if (error instanceof Error) return error.message;
  return String(error);
}
