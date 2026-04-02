import type { FlowtextLayoutResult, FlowtextLayoutLine } from 'flowtext';
import { computeScale } from './types';
import type { Renderer, ViewportSize } from './types';

const SVG_NS = 'http://www.w3.org/2000/svg';
const HANDLE_SIZE = 8;

export interface SvgInteraction {
  onNodeClick?: (nodeId: string) => void;
  onNodeResize?: (nodeId: string, width: number, height: number) => void;
  selectedNodeId?: string | null;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function createEl(tag: string): SVGElement {
  return document.createElementNS(SVG_NS, tag) as SVGElement;
}

/** Collect absolute positions for each node */
function collectAbsolutePositions(
  result: FlowtextLayoutResult,
  offsetX: number,
  offsetY: number,
  map: Map<string, { absX: number; absY: number; w: number; h: number }>,
) {
  const absX = offsetX + result.x;
  const absY = offsetY + result.y;
  map.set(result.id, { absX, absY, w: result.width, h: result.height });
  if (result.children) {
    for (const child of result.children) {
      collectAbsolutePositions(child, absX, absY, map);
    }
  }
}

function renderNode(
  result: FlowtextLayoutResult,
  selectedId: string | null,
  onNodeClick?: (nodeId: string) => void,
): SVGElement {
  const g = createEl('g') as SVGGElement;
  g.setAttribute('transform', `translate(${result.x}, ${result.y})`);

  const isSelected = result.id === selectedId;

  // clickable background (transparent fill for hit testing)
  const hitRect = createEl('rect') as SVGRectElement;
  hitRect.setAttribute('x', '0');
  hitRect.setAttribute('y', '0');
  hitRect.setAttribute('width', String(result.width));
  hitRect.setAttribute('height', String(result.height));
  hitRect.setAttribute('fill', isSelected ? 'rgba(99,102,241,0.04)' : 'transparent');
  hitRect.setAttribute('stroke', isSelected ? '#6366f1' : '#818cf8');
  hitRect.setAttribute('stroke-width', isSelected ? '2' : '1');
  hitRect.style.cursor = 'pointer';

  if (onNodeClick) {
    hitRect.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      onNodeClick(result.id);
    });
  }

  g.appendChild(hitRect);

  // node ID label
  const label = createEl('text') as SVGTextElement;
  label.setAttribute('x', '3');
  label.setAttribute('y', '10');
  label.setAttribute('font-size', '8');
  label.setAttribute('font-family', "'Inter', system-ui, sans-serif");
  label.setAttribute('fill', isSelected ? '#6366f1' : '#818cf8');
  label.setAttribute('pointer-events', 'none');
  label.textContent = result.id;
  g.appendChild(label);

  // text lines
  if (result.lines && result.lines.length > 0) {
    for (const line of result.lines) {
      g.appendChild(renderLine(line));
    }
  }

  // children
  if (result.children && result.children.length > 0) {
    for (const child of result.children) {
      g.appendChild(renderNode(child, selectedId, onNodeClick));
    }
  }

  return g;
}

function renderLine(line: FlowtextLayoutLine): SVGElement {
  const textEl = createEl('text') as SVGTextElement;
  textEl.setAttribute('x', String(line.x));
  textEl.setAttribute('y', String(line.y + line.height));
  textEl.setAttribute('fill', '#0f172a');
  textEl.setAttribute('pointer-events', 'none');
  const fontSize = line.height > 0 ? line.height : 14;
  textEl.setAttribute('font-size', String(fontSize));
  textEl.textContent = line.text;
  return textEl;
}

type HandleType = 'right' | 'bottom' | 'corner';

function createResizeHandle(
  x: number,
  y: number,
  type: HandleType,
): SVGRectElement {
  const handle = createEl('rect') as SVGRectElement;
  handle.setAttribute('x', String(x - HANDLE_SIZE / 2));
  handle.setAttribute('y', String(y - HANDLE_SIZE / 2));
  handle.setAttribute('width', String(HANDLE_SIZE));
  handle.setAttribute('height', String(HANDLE_SIZE));
  handle.setAttribute('fill', '#6366f1');
  handle.setAttribute('stroke', '#fff');
  handle.setAttribute('stroke-width', '1');
  handle.setAttribute('rx', '2');

  const cursors: Record<HandleType, string> = {
    right: 'ew-resize',
    bottom: 'ns-resize',
    corner: 'nwse-resize',
  };
  handle.style.cursor = cursors[type];

  return handle;
}

export class SvgRenderer implements Renderer {
  private svg: SVGSVGElement | null = null;
  private container: HTMLElement | null = null;
  private interaction: SvgInteraction = {};
  private lastResult: FlowtextLayoutResult | null = null;
  private lastViewport: ViewportSize | null = null;
  private lastScale = 1;

  setInteraction(interaction: SvgInteraction) {
    this.interaction = interaction;
  }

  mount(container: HTMLElement): void {
    this.container = container;
    const svg = document.createElementNS(SVG_NS, 'svg') as SVGSVGElement;
    svg.setAttribute('xmlns', SVG_NS);
    svg.style.display = 'block';
    container.appendChild(svg);
    this.svg = svg;
  }

  render(result: FlowtextLayoutResult, viewport: ViewportSize): void {
    if (!this.svg) return;

    this.lastResult = result;
    this.lastViewport = viewport;

    // clear
    while (this.svg.firstChild) {
      this.svg.removeChild(this.svg.firstChild);
    }

    const scale = computeScale(result, viewport);
    this.lastScale = scale;

    this.svg.setAttribute('width', String(viewport.width));
    this.svg.setAttribute('height', String(viewport.height));
    this.svg.setAttribute('viewBox', `0 0 ${result.width} ${result.height}`);

    const rootG = createEl('g') as SVGGElement;
    rootG.appendChild(
      renderNode(result, this.interaction.selectedNodeId ?? null, this.interaction.onNodeClick),
    );
    this.svg.appendChild(rootG);

    // Draw resize handles for selected node
    const selectedId = this.interaction.selectedNodeId;
    if (selectedId) {
      const positions = new Map<string, { absX: number; absY: number; w: number; h: number }>();
      collectAbsolutePositions(result, 0, 0, positions);
      const pos = positions.get(selectedId);
      if (pos) {
        this.drawResizeHandles(pos.absX, pos.absY, pos.w, pos.h, selectedId);
      }
    }
  }

  private drawResizeHandles(x: number, y: number, w: number, h: number, nodeId: string) {
    if (!this.svg) return;

    const handleGroup = createEl('g') as SVGGElement;
    handleGroup.setAttribute('data-handles', 'true');

    // Right edge handle
    const rightHandle = createResizeHandle(x + w, y + h / 2, 'right');
    this.setupDrag(rightHandle, nodeId, 'right', x, y, w, h);
    handleGroup.appendChild(rightHandle);

    // Bottom edge handle
    const bottomHandle = createResizeHandle(x + w / 2, y + h, 'bottom');
    this.setupDrag(bottomHandle, nodeId, 'bottom', x, y, w, h);
    handleGroup.appendChild(bottomHandle);

    // Corner handle
    const cornerHandle = createResizeHandle(x + w, y + h, 'corner');
    this.setupDrag(cornerHandle, nodeId, 'corner', x, y, w, h);
    handleGroup.appendChild(cornerHandle);

    this.svg.appendChild(handleGroup);
  }

  private setupDrag(
    handle: SVGRectElement,
    nodeId: string,
    type: HandleType,
    _nodeX: number,
    _nodeY: number,
    startW: number,
    startH: number,
  ) {
    const svg = this.svg;
    if (!svg) return;

    let startMouseX = 0;
    let startMouseY = 0;

    const toSvgCoords = (clientX: number, clientY: number) => {
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return { x: 0, y: 0 };
      const svgPt = pt.matrixTransform(ctm.inverse());
      return { x: svgPt.x, y: svgPt.y };
    };

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const svgStart = toSvgCoords(e.clientX, e.clientY);
      startMouseX = svgStart.x;
      startMouseY = svgStart.y;

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      document.body.style.cursor = handle.style.cursor;
      document.body.style.userSelect = 'none';
    };

    const onMouseMove = (e: MouseEvent) => {
      const svgCurrent = toSvgCoords(e.clientX, e.clientY);
      const dx = svgCurrent.x - startMouseX;
      const dy = svgCurrent.y - startMouseY;

      let newW = startW;
      let newH = startH;

      if (type === 'right' || type === 'corner') {
        newW = Math.max(20, Math.round(startW + dx));
      }
      if (type === 'bottom' || type === 'corner') {
        newH = Math.max(20, Math.round(startH + dy));
      }

      this.interaction.onNodeResize?.(nodeId, newW, newH);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    handle.addEventListener('mousedown', onMouseDown);
  }

  dispose(): void {
    if (this.svg && this.container) {
      this.container.removeChild(this.svg);
    }
    this.svg = null;
    this.container = null;
  }
}
