import { layoutTree, type FlowtextNode, type FlowtextLayoutResult } from 'flowtext';
import { SvgRenderer } from './renderers/svg-renderer';
import { CanvasRenderer } from './renderers/canvas-renderer';
import { AsciiRenderer } from './renderers/ascii-renderer';
import type { Renderer, ViewportSize } from './renderers/types';

// ── Helpers ──────────────────────────────────────────────

function mountTriple(svgEl: HTMLElement, canvasEl: HTMLElement, asciiEl: HTMLElement) {
  const svg = new SvgRenderer();
  const canvas = new CanvasRenderer();
  const ascii = new AsciiRenderer();
  svg.mount(svgEl);
  canvas.mount(canvasEl);
  ascii.mount(asciiEl);
  return { svg, canvas, ascii, all: [
    { renderer: svg as Renderer, container: svgEl },
    { renderer: canvas as Renderer, container: canvasEl },
    { renderer: ascii as Renderer, container: asciiEl },
  ]};
}

function renderAll(
  renderers: { renderer: Renderer; container: HTMLElement }[],
  result: FlowtextLayoutResult,
) {
  for (const { renderer, container } of renderers) {
    const vp: ViewportSize = { width: container.clientWidth, height: container.clientHeight };
    renderer.render(result, vp);
  }
}

async function computeAndRender(
  node: FlowtextNode,
  constraints: { width?: number; height?: number },
  renderers: { renderer: Renderer; container: HTMLElement }[],
) {
  const result = await layoutTree(node, constraints);
  renderAll(renderers, result);
  return result;
}

// ── Demo 1: Text Reflow ─────────────────────────────────

function initReflowDemo() {
  const slider = document.getElementById('reflow-width') as HTMLInputElement;
  const valueLabel = document.getElementById('reflow-width-value')!;
  const triple = mountTriple(
    document.getElementById('reflow-svg')!,
    document.getElementById('reflow-canvas')!,
    document.getElementById('reflow-ascii')!,
  );

  const node: FlowtextNode = {
    id: 'container',
    type: 'view',
    style: { width: 360, padding: 20, flexDirection: 'column' },
    children: [
      {
        id: 'paragraph',
        type: 'text',
        text: 'Flowtext computes layout without the DOM. It combines Yoga for structural flexbox layout with Pretext for paragraph measurement and line extraction. Resize the container to watch this text reflow across three different renderers simultaneously.',
        style: { fontFamily: 'sans-serif', fontSize: 15, lineHeight: 22 },
      },
    ],
  };

  let timer: ReturnType<typeof setTimeout> | null = null;

  async function update() {
    const w = Number(slider.value);
    valueLabel.textContent = String(w);
    node.style!.width = w;
    await computeAndRender(node, { width: w }, triple.all);
  }

  slider.addEventListener('input', () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(update, 16);
  });

  return update();
}

// ── Demo 2: Flex Reorder ────────────────────────────────

function initReorderDemo() {
  const triple = mountTriple(
    document.getElementById('reorder-svg')!,
    document.getElementById('reorder-canvas')!,
    document.getElementById('reorder-ascii')!,
  );

  const node: FlowtextNode = {
    id: 'root',
    type: 'view',
    style: { width: 300, padding: 12, flexDirection: 'column' },
    children: [
      { id: 'header', type: 'text', text: 'Header', style: { fontFamily: 'sans-serif', fontSize: 16, lineHeight: 28 } },
      { id: 'navigation', type: 'text', text: 'Navigation', style: { fontFamily: 'sans-serif', fontSize: 14, lineHeight: 24 } },
      { id: 'article', type: 'text', text: 'Article body text that will reflow when siblings are reordered above or below it.', style: { fontFamily: 'sans-serif', fontSize: 13, lineHeight: 20 } },
      { id: 'sidebar', type: 'text', text: 'Sidebar', style: { fontFamily: 'sans-serif', fontSize: 14, lineHeight: 24 } },
      { id: 'footer', type: 'text', text: 'Footer', style: { fontFamily: 'sans-serif', fontSize: 12, lineHeight: 20 } },
    ],
  };

  let lastResult: FlowtextLayoutResult | null = null;

  triple.svg.setInteraction({
    selectedNodeId: null,
    onNodeClick(nodeId) {
      triple.svg.setInteraction({
        ...triple.svg.interaction,
        selectedNodeId: nodeId,
      });
      if (lastResult) renderAll(triple.all, lastResult);
    },
    onNodeReorder(nodeId, newIndex) {
      const children = node.children!;
      const oldIndex = children.findIndex((c) => c.id === nodeId);
      if (oldIndex === -1) return;
      const [child] = children.splice(oldIndex, 1);
      const adjusted = newIndex > oldIndex ? newIndex - 1 : newIndex;
      children.splice(adjusted, 0, child);
      computeAndRender(node, { width: 300 }, triple.all).then((r) => { lastResult = r; });
    },
  });

  return computeAndRender(node, { width: 300 }, triple.all).then((r) => { lastResult = r; });
}

// ── Demo 3: OG Image ────────────────────────────────────

function initOgDemo() {
  const input = document.getElementById('og-title-input') as HTMLInputElement;
  const triple = mountTriple(
    document.getElementById('og-svg')!,
    document.getElementById('og-canvas')!,
    document.getElementById('og-ascii')!,
  );

  const node: FlowtextNode = {
    id: 'card',
    type: 'view',
    style: { width: 1200, height: 630, padding: 60, flexDirection: 'column', justifyContent: 'space-between' },
    children: [
      {
        id: 'brand',
        type: 'text',
        text: 'flowtext.dev',
        style: { fontFamily: 'sans-serif', fontSize: 24, lineHeight: 32 },
      },
      {
        id: 'title',
        type: 'text',
        text: input.value,
        style: { fontFamily: 'sans-serif', fontSize: 56, lineHeight: 68, fontWeight: 700 },
      },
      {
        id: 'meta',
        type: 'view',
        style: { flexDirection: 'row', justifyContent: 'space-between' },
        children: [
          { id: 'author', type: 'text', text: '@kim62210', style: { fontFamily: 'sans-serif', fontSize: 20, lineHeight: 28 } },
          { id: 'date', type: 'text', text: 'April 2026', style: { fontFamily: 'sans-serif', fontSize: 20, lineHeight: 28 } },
        ],
      },
    ],
  };

  let timer: ReturnType<typeof setTimeout> | null = null;

  async function update() {
    const titleNode = node.children![1];
    titleNode.text = input.value || 'Untitled';
    await computeAndRender(node, { width: 1200, height: 630 }, triple.all);
  }

  input.addEventListener('input', () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(update, 80);
  });

  return update();
}

// ── Boot ─────────────────────────────────────────────────

async function boot() {
  await Promise.all([
    initReflowDemo(),
    initReorderDemo(),
    initOgDemo(),
  ]);
}

boot();
