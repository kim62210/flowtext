import type { FlowtextLayoutResult, FlowtextLayoutLine } from 'flowtext';
import { computeScale } from './types';
import type { Renderer, ViewportSize } from './types';

const SVG_NS = 'http://www.w3.org/2000/svg';
const EDGE_THRESHOLD = 8;

export interface SvgInteraction {
  onNodeClick?: (nodeId: string) => void;
  onNodeResize?: (nodeId: string, width: number, height: number) => void;
  onNodeReorder?: (nodeId: string, newIndex: number) => void;
  selectedNodeId?: string | null;
}

interface NodeLayout {
  id: string;
  absX: number;
  absY: number;
  w: number;
  h: number;
  parentId: string | null;
  childIndex: number;
}

function createEl(tag: string): SVGElement {
  return document.createElementNS(SVG_NS, tag) as SVGElement;
}

function collectNodeLayouts(
  result: FlowtextLayoutResult,
  offsetX: number,
  offsetY: number,
  parentId: string | null,
  childIndex: number,
  map: Map<string, NodeLayout>,
) {
  const absX = offsetX + result.x;
  const absY = offsetY + result.y;
  map.set(result.id, { id: result.id, absX, absY, w: result.width, h: result.height, parentId, childIndex });
  if (result.children) {
    for (let i = 0; i < result.children.length; i++) {
      collectNodeLayouts(result.children[i], absX, absY, result.id, i, map);
    }
  }
}

function renderNode(
  result: FlowtextLayoutResult,
  selectedId: string | null,
  draggingId: string | null,
): SVGElement {
  const g = createEl('g') as SVGGElement;
  g.setAttribute('transform', `translate(${result.x}, ${result.y})`);

  const isSelected = result.id === selectedId;
  const isDragging = result.id === draggingId;

  const rect = createEl('rect') as SVGRectElement;
  rect.setAttribute('x', '0');
  rect.setAttribute('y', '0');
  rect.setAttribute('width', String(result.width));
  rect.setAttribute('height', String(result.height));
  rect.setAttribute('fill', isSelected ? 'rgba(99,102,241,0.05)' : 'transparent');
  rect.setAttribute('stroke', isDragging ? '#6366f1' : isSelected ? '#6366f1' : '#818cf8');
  rect.setAttribute('stroke-width', isDragging ? '2.5' : isSelected ? '2' : '1');
  rect.setAttribute('data-node-id', result.id);

  if (isDragging) {
    rect.setAttribute('stroke-dasharray', '6 3');
    rect.setAttribute('fill', 'rgba(99,102,241,0.08)');
  }

  g.appendChild(rect);

  // node ID label
  const label = createEl('text') as SVGTextElement;
  label.setAttribute('x', '3');
  label.setAttribute('y', '11');
  label.setAttribute('font-size', '9');
  label.setAttribute('font-family', "'Inter', system-ui, sans-serif");
  label.setAttribute('font-weight', '500');
  label.setAttribute('fill', isSelected || isDragging ? '#6366f1' : '#818cf8');
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
  if (result.children) {
    for (const child of result.children) {
      g.appendChild(renderNode(child, selectedId, draggingId));
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

type DragMode = 'move' | 'resize-right' | 'resize-bottom' | 'resize-corner';

interface DragState {
  nodeId: string;
  mode: DragMode;
  startMouseX: number;
  startMouseY: number;
  startW: number;
  startH: number;
  lastReorderIndex: number;
}

export class SvgRenderer implements Renderer {
  private svg: SVGSVGElement | null = null;
  private container: HTMLElement | null = null;
  private interaction: SvgInteraction = {};
  private lastResult: FlowtextLayoutResult | null = null;
  private nodeLayouts = new Map<string, NodeLayout>();
  private dragState: DragState | null = null;

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

    svg.addEventListener('mousedown', this.onMouseDown);
    svg.addEventListener('mousemove', this.onHoverCursor);
  }

  render(result: FlowtextLayoutResult, viewport: ViewportSize): void {
    if (!this.svg) return;
    this.lastResult = result;

    this.nodeLayouts.clear();
    collectNodeLayouts(result, 0, 0, null, 0, this.nodeLayouts);

    while (this.svg.firstChild) {
      this.svg.removeChild(this.svg.firstChild);
    }

    this.svg.setAttribute('width', String(viewport.width));
    this.svg.setAttribute('height', String(viewport.height));
    this.svg.setAttribute('viewBox', `0 0 ${result.width} ${result.height}`);

    const rootG = createEl('g') as SVGGElement;
    rootG.appendChild(
      renderNode(
        result,
        this.interaction.selectedNodeId ?? null,
        this.dragState?.mode === 'move' ? this.dragState.nodeId : null,
      ),
    );
    this.svg.appendChild(rootG);
  }

  private toSvg(clientX: number, clientY: number): { x: number; y: number } {
    const svg = this.svg!;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const svgPt = pt.matrixTransform(ctm.inverse());
    return { x: svgPt.x, y: svgPt.y };
  }

  private hitTest(svgX: number, svgY: number): { nodeId: string; edge: string | null } | null {
    let best: NodeLayout | null = null;
    for (const layout of this.nodeLayouts.values()) {
      if (
        svgX >= layout.absX &&
        svgX <= layout.absX + layout.w &&
        svgY >= layout.absY &&
        svgY <= layout.absY + layout.h
      ) {
        if (!best || (layout.w * layout.h < best.w * best.h)) {
          best = layout;
        }
      }
    }
    if (!best) return null;

    const rx = svgX - best.absX;
    const ry = svgY - best.absY;
    const nearRight = best.w - rx < EDGE_THRESHOLD;
    const nearBottom = best.h - ry < EDGE_THRESHOLD;

    if (nearRight && nearBottom) return { nodeId: best.id, edge: 'corner' };
    if (nearRight) return { nodeId: best.id, edge: 'right' };
    if (nearBottom) return { nodeId: best.id, edge: 'bottom' };

    return { nodeId: best.id, edge: null };
  }

  private onHoverCursor = (e: MouseEvent) => {
    if (this.dragState) return;
    if (!this.svg) return;

    const { x, y } = this.toSvg(e.clientX, e.clientY);
    const hit = this.hitTest(x, y);

    if (!hit) {
      this.svg.style.cursor = 'default';
      return;
    }

    if (hit.edge === 'corner') this.svg.style.cursor = 'nwse-resize';
    else if (hit.edge === 'right') this.svg.style.cursor = 'ew-resize';
    else if (hit.edge === 'bottom') this.svg.style.cursor = 'ns-resize';
    else this.svg.style.cursor = 'grab';
  };

  private onMouseDown = (e: MouseEvent) => {
    if (e.button !== 0 || !this.svg) return;

    const { x, y } = this.toSvg(e.clientX, e.clientY);
    const hit = this.hitTest(x, y);
    if (!hit) return;

    e.preventDefault();
    this.interaction.onNodeClick?.(hit.nodeId);

    const layout = this.nodeLayouts.get(hit.nodeId);
    if (!layout) return;

    const mode: DragMode = hit.edge === 'corner' ? 'resize-corner'
      : hit.edge === 'right' ? 'resize-right'
      : hit.edge === 'bottom' ? 'resize-bottom'
      : 'move';

    this.dragState = {
      nodeId: hit.nodeId,
      mode,
      startMouseX: x,
      startMouseY: y,
      startW: layout.w,
      startH: layout.h,
      lastReorderIndex: layout.childIndex,
    };

    if (mode === 'move') {
      this.svg.style.cursor = 'grabbing';
    }

    document.addEventListener('mousemove', this.onDrag);
    document.addEventListener('mouseup', this.onDragEnd);
    document.body.style.userSelect = 'none';
  };

  private onDrag = (e: MouseEvent) => {
    if (!this.dragState || !this.svg) return;
    const { x, y } = this.toSvg(e.clientX, e.clientY);
    const dx = x - this.dragState.startMouseX;
    const dy = y - this.dragState.startMouseY;

    if (this.dragState.mode === 'move') {
      this.handleMoveDrag(x, y);
    } else {
      this.handleResizeDrag(dx, dy);
    }
  };

  private handleMoveDrag(svgX: number, svgY: number) {
    const ds = this.dragState!;
    const layout = this.nodeLayouts.get(ds.nodeId);
    if (!layout || layout.parentId === null) return;

    // Find siblings
    const siblings: NodeLayout[] = [];
    for (const nl of this.nodeLayouts.values()) {
      if (nl.parentId === layout.parentId) siblings.push(nl);
    }
    siblings.sort((a, b) => a.childIndex - b.childIndex);
    if (siblings.length < 2) return;

    // Determine layout direction
    const isVertical = this.isVerticalLayout(siblings);

    // Compute target index
    let newIndex = siblings.length;
    for (let i = 0; i < siblings.length; i++) {
      const sib = siblings[i];
      const midPoint = isVertical
        ? sib.absY + sib.h / 2
        : sib.absX + sib.w / 2;
      const mousePos = isVertical ? svgY : svgX;

      if (mousePos < midPoint) {
        newIndex = i;
        break;
      }
    }

    // Only fire reorder if index actually changed
    if (newIndex !== ds.lastReorderIndex) {
      ds.lastReorderIndex = newIndex;
      this.interaction.onNodeReorder?.(ds.nodeId, newIndex);
    }
  }

  private isVerticalLayout(siblings: NodeLayout[]): boolean {
    if (siblings.length < 2) return true;
    const dy = Math.abs(siblings[1].absY - siblings[0].absY);
    const dx = Math.abs(siblings[1].absX - siblings[0].absX);
    return dy >= dx;
  }

  private handleResizeDrag(dx: number, dy: number) {
    const ds = this.dragState!;
    let newW = ds.startW;
    let newH = ds.startH;

    if (ds.mode === 'resize-right' || ds.mode === 'resize-corner') {
      newW = Math.max(20, Math.round(ds.startW + dx));
    }
    if (ds.mode === 'resize-bottom' || ds.mode === 'resize-corner') {
      newH = Math.max(20, Math.round(ds.startH + dy));
    }

    this.interaction.onNodeResize?.(ds.nodeId, newW, newH);
  }

  private onDragEnd = () => {
    document.removeEventListener('mousemove', this.onDrag);
    document.removeEventListener('mouseup', this.onDragEnd);
    document.body.style.userSelect = '';

    this.dragState = null;
    if (this.svg) this.svg.style.cursor = 'default';

    // Re-render to clear drag visual state (dashed border)
    if (this.lastResult && this.container) {
      const viewport: ViewportSize = {
        width: this.container.clientWidth,
        height: this.container.clientHeight,
      };
      this.render(this.lastResult, viewport);
    }
  };

  dispose(): void {
    if (this.svg) {
      this.svg.removeEventListener('mousedown', this.onMouseDown);
      this.svg.removeEventListener('mousemove', this.onHoverCursor);
    }
    if (this.svg && this.container) {
      this.container.removeChild(this.svg);
    }
    this.svg = null;
    this.container = null;
  }
}
