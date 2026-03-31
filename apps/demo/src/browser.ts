import {
  PLAYGROUND_PRESETS,
  createPlaygroundState,
  patchPlaygroundState,
  type PlaygroundPresetId,
  type PlaygroundState,
} from './playground';
import { renderPlaygroundSnapshot } from './main';

type DocumentLike = {
  querySelector<T>(selector: string): T | null;
};

type QueryLike = {
  querySelector<T>(selector: string): T | null;
};

type HtmlLike = {
  innerHTML: string;
  addEventListener(type: string, listener: (event: PointerLike) => void): void;
  getBoundingClientRect(): BoundingRectLike;
};

type TextLike = {
  textContent: string;
};

type PointerLike = {
  clientX: number;
  clientY: number;
  target?: {
    closest(selector: string): unknown;
  } | null;
  preventDefault(): void;
};

type BoundingRectLike = {
  left: number;
  top: number;
};

type InputLike = {
  value: string;
  addEventListener(type: string, listener: () => void): void;
};

type PlaygroundElements = {
  preset: InputLike;
  sceneWidth: InputLike;
  constraintWidth: InputLike;
  constraintX: InputLike;
  constraintY: InputLike;
  preview: HtmlLike;
  invariants: HtmlLike;
  summary: HtmlLike;
  status: TextLike;
  sceneWidthOutput: TextLike;
  constraintWidthOutput: TextLike;
  constraintXOutput: TextLike;
  constraintYOutput: TextLike;
};

export async function mountPlaygroundDemo(
  doc: DocumentLike = document as unknown as DocumentLike,
): Promise<void> {
  const app = doc.querySelector<(QueryLike & HtmlLike)>('#app');

  if (!app) {
    throw new Error('Missing #app container for the Flowtext demo.');
  }

  app.innerHTML = renderShell();

  const elements = resolveElements(app);
  let state = createPlaygroundState('balanced');
  let renderToken = 0;
  let dragOrigin: { pointerX: number; pointerY: number; state: PlaygroundState } | null = null;

  const syncOutputs = () => {
    elements.preset.value = state.presetId;
    elements.sceneWidth.value = String(state.sceneWidth);
    elements.constraintWidth.value = String(state.constraintWidth);
    elements.constraintX.value = String(state.constraintX);
    elements.constraintY.value = String(state.constraintY);
    elements.sceneWidthOutput.textContent = `${state.sceneWidth}px`;
    elements.constraintWidthOutput.textContent = `${state.constraintWidth}px`;
    elements.constraintXOutput.textContent = `${state.constraintX}px`;
    elements.constraintYOutput.textContent = `${state.constraintY}px`;
  };

  const refresh = async () => {
    const token = ++renderToken;

    elements.status.textContent = 'Measuring preview…';

    const snapshot = await renderPlaygroundSnapshot(state);

    if (token !== renderToken) {
      return;
    }

    elements.preview.innerHTML = snapshot.svg;
    elements.invariants.innerHTML = renderInvariantList(snapshot.invariants);
    elements.summary.innerHTML = renderSummary(snapshot.summary);
    elements.status.textContent = `${snapshot.preset.label} preset · ${snapshot.geometry.dockSide} dock · ${snapshot.bodyLineCount} body lines`;
  };

  const applyPatch = (patch: Partial<PlaygroundState>) => {
    state = patchPlaygroundState(state, patch);
    syncOutputs();
    void refresh();
  };

  elements.preset.addEventListener('change', () => {
    const presetId = elements.preset.value as PlaygroundPresetId;

    state = createPlaygroundState(presetId);
    syncOutputs();
    void refresh();
  });
  elements.sceneWidth.addEventListener('input', () => {
    applyPatch({ sceneWidth: Number(elements.sceneWidth.value) });
  });
  elements.constraintWidth.addEventListener('input', () => {
    applyPatch({ constraintWidth: Number(elements.constraintWidth.value) });
  });
  elements.constraintX.addEventListener('input', () => {
    applyPatch({ constraintX: Number(elements.constraintX.value) });
  });
  elements.constraintY.addEventListener('input', () => {
    applyPatch({ constraintY: Number(elements.constraintY.value) });
  });
  elements.preview.addEventListener('pointerdown', (event) => {
    if (!event.target?.closest('[data-region="constraint-object"]')) {
      return;
    }

    event.preventDefault();
    dragOrigin = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      state,
    };
  });
  elements.preview.addEventListener('pointermove', (event) => {
    if (!dragOrigin) {
      return;
    }

    event.preventDefault();

    const previewRect = elements.preview.getBoundingClientRect();
    const nextX = dragOrigin.state.constraintX + (event.clientX - dragOrigin.pointerX - previewRect.left + previewRect.left);
    const nextY = dragOrigin.state.constraintY + (event.clientY - dragOrigin.pointerY - previewRect.top + previewRect.top);

    applyPatch({
      constraintX: Math.round(nextX),
      constraintY: Math.round(nextY),
    });
  });
  elements.preview.addEventListener('pointerup', (event) => {
    if (!dragOrigin) {
      return;
    }

    event.preventDefault();
    dragOrigin = null;
  });

  syncOutputs();
  await refresh();
}

function renderShell(): string {
  const presetOptions = PLAYGROUND_PRESETS.map((preset) => (
    `<option value="${preset.id}">${preset.label}</option>`
  )).join('');

  return [
    '<div class="playground">',
    '<section class="playground-hero">',
    '<p class="playground-kicker">Interactive playground</p>',
    '<h1>Flowtext layout resilience sandbox</h1>',
    '<p class="playground-intro">Move the constraint, change the preset, and watch which layout regions stay stable. This is a local debugging playground, not a production showcase.</p>',
    '</section>',
    '<div class="playground-grid">',
    '<aside class="panel" aria-label="Playground controls">',
    '<div class="panel-head"><h2>Controls</h2><p>Width and position changes drive the live preview.</p></div>',
    '<label class="control"><span class="control-row"><span>Preset</span></span><select data-control="preset" class="playground-select">',
    presetOptions,
    '</select></label>',
    renderRangeControl('Scene width', 'scene-width', 540, 820, 10),
    renderRangeControl('Constraint width', 'constraint-width', 120, 280, 10),
    renderRangeControl('Constraint X', 'constraint-x', 24, 680, 4),
    renderRangeControl('Constraint Y', 'constraint-y', 176, 288, 4),
    '</aside>',
    '<section class="panel preview-panel" aria-label="Live preview">',
    '<div class="panel-head"><h2>Live preview</h2><p>The safe frames and anchors stay visible while the text reflows.</p></div>',
    '<p class="panel-status" data-panel="status"></p>',
    '<div class="preview-surface" data-panel="preview"></div>',
    '</section>',
    '<aside class="panel" aria-label="Layout invariants and summary">',
    '<div class="panel-head"><h2>Stable invariants</h2><p>These are the rules the preview keeps exposing.</p></div>',
    '<div class="panel-stack" data-panel="invariants"></div>',
    '<div class="panel-head panel-head-secondary"><h2>Layout summary</h2><p>Raw numbers that explain why the preview changed.</p></div>',
    '<div class="panel-stack" data-panel="summary"></div>',
    '</aside>',
    '</div>',
    '</div>',
  ].join('');
}

function renderRangeControl(label: string, name: string, min: number, max: number, step: number): string {
  return [
    '<label class="control">',
    `<span class="control-row"><span>${label}</span><output data-output="${name}"></output></span>`,
    `<input data-control="${name}" type="range" min="${min}" max="${max}" step="${step}" />`,
    '</label>',
  ].join('');
}

function resolveElements(root: QueryLike): PlaygroundElements {
  return {
    preset: requireElement<InputLike>(root, '[data-control="preset"]'),
    sceneWidth: requireElement<InputLike>(root, '[data-control="scene-width"]'),
    constraintWidth: requireElement<InputLike>(root, '[data-control="constraint-width"]'),
    constraintX: requireElement<InputLike>(root, '[data-control="constraint-x"]'),
    constraintY: requireElement<InputLike>(root, '[data-control="constraint-y"]'),
    preview: requireElement<HtmlLike>(root, '[data-panel="preview"]'),
    invariants: requireElement<HtmlLike>(root, '[data-panel="invariants"]'),
    summary: requireElement<HtmlLike>(root, '[data-panel="summary"]'),
    status: requireElement<TextLike>(root, '[data-panel="status"]'),
    sceneWidthOutput: requireElement<TextLike>(root, '[data-output="scene-width"]'),
    constraintWidthOutput: requireElement<TextLike>(root, '[data-output="constraint-width"]'),
    constraintXOutput: requireElement<TextLike>(root, '[data-output="constraint-x"]'),
    constraintYOutput: requireElement<TextLike>(root, '[data-output="constraint-y"]'),
  };
}

function requireElement<T>(root: QueryLike, selector: string): T {
  const element = root.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Missing required playground element: ${selector}`);
  }

  return element;
}

function renderInvariantList(invariants: Awaited<ReturnType<typeof renderPlaygroundSnapshot>>['invariants']): string {
  return [
    '<ul class="invariant-list">',
    ...invariants.map((invariant) => (
      `<li class="invariant-item"><p class="invariant-label">${escapeHtml(invariant.label)}</p><p class="invariant-detail">${escapeHtml(invariant.detail)}</p></li>`
    )),
    '</ul>',
  ].join('');
}

function renderSummary(summary: Awaited<ReturnType<typeof renderPlaygroundSnapshot>>['summary']): string {
  return [
    '<dl class="summary-list">',
    ...summary.map((metric) => (
      `<div class="summary-row"><dt>${escapeHtml(metric.label)}</dt><dd>${escapeHtml(metric.value)}</dd></div>`
    )),
    '</dl>',
  ].join('');
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

if (typeof document !== 'undefined' && (document as DocumentLike).querySelector('#app')) {
  void mountPlaygroundDemo();
}
