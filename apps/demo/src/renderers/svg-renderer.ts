import type { FlowtextLayoutResult, FlowtextLayoutLine } from 'flowtext';
import type { Renderer, ViewportSize } from './types';

const SVG_NS = 'http://www.w3.org/2000/svg';
const EDGE_THRESHOLD = 10;

export interface SvgInteraction {
  onNodeClick?: (nodeId: string) => void;
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
  return document.createElementNS(SVG_NS, tag);
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
  rect.setAttribute('fill', isDragging ? 'rgba(99,102,241,0.08)' : isSelected ? 'rgba(99,102,241,0.04)' : 'transparent');
  rect.setAttribute('stroke', isSelected || isDragging ? '#6366f1' : '#bbb');
  rect.setAttribute('stroke-width', isSelected || isDragging ? '1.5' : '0.5');
  if (isDragging) rect.setAttribute('stroke-dasharray', '5 3');
  g.appendChild(rect);

  // ID label
  const label = createEl('text') as SVGTextElement;
  label.setAttribute('x', '3');
  label.setAttribute('y', '10');
  label.setAttribute('font-size', '8');
  label.setAttribute('font-family', "system-ui, sans-serif");
  label.setAttribute('fill', isSelected || isDragging ? '#6366f1' : '#999');
  label.setAttribute('pointer-events', 'none');
  label.textContent = result.id;
  g.appendChild(label);

  if (result.lines) {
    for (const line of result.lines) {
      const t = createEl('text') as SVGTextElement;
      t.setAttribute('x', String(line.x));
      t.setAttribute('y', String(line.y + line.height * 0.85));
      t.setAttribute('font-size', String(line.height > 0 ? line.height : 14));
      t.setAttribute('fill', '#2c2c2c');
      t.setAttribute('pointer-events', 'none');
      t.textContent = line.text;
      g.appendChild(t);
    }
  }

  if (result.children) {
    for (const child of result.children) {
      g.appendChild(renderNode(child, selectedId, draggingId));
    }
  }

  return g;
}

export class SvgRenderer implements Renderer {
  private svg: SVGSVGElement | null = null;
  private container: HTMLElement | null = null;
  interaction: SvgInteraction = {};
  private lastResult: FlowtextLayoutResult | null = null;
  private nodeLayouts = new Map<string, NodeLayout>();
  private draggingNodeId: string | null = null;
  private dragStartMouse = { x: 0, y: 0 };
  private lastReorderIndex = -1;

  setInteraction(interaction: SvgInteraction) {
    this.interaction = interaction;
  }

  mount(container: HTMLElement): void {
    this.container = container;
    const svg = document.createElementNS(SVG_NS, 'svg') as SVGSVGElement;
    svg.style.display = 'block';
    svg.style.width = '100%';
    container.appendChild(svg);
    this.svg = svg;

    svg.addEventListener('mousedown', this.onMouseDown);
    svg.addEventListener('mousemove', this.onHover);
  }

  render(result: FlowtextLayoutResult, _viewport: ViewportSize): void {
    if (!this.svg) return;
    this.lastResult = result;

    this.nodeLayouts.clear();
    collectNodeLayouts(result, 0, 0, null, 0, this.nodeLayouts);

    while (this.svg.firstChild) this.svg.removeChild(this.svg.firstChild);

    // SVG uses viewBox = layout result size, scales naturally via CSS width:100%
    const w = result.width || 1;
    const h = result.height || 1;
    this.svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    this.svg.removeAttribute('width');
    this.svg.removeAttribute('height');

    const rootG = createEl('g') as SVGGElement;
    rootG.appendChild(renderNode(result, this.interaction.selectedNodeId ?? null, this.draggingNodeId));
    this.svg.appendChild(rootG);
  }

  private toSvg(clientX: number, clientY: number) {
    const svg = this.svg!;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  }

  private hitTest(svgX: number, svgY: number): NodeLayout | null {
    let best: NodeLayout | null = null;
    for (const nl of this.nodeLayouts.values()) {
      if (svgX >= nl.absX && svgX <= nl.absX + nl.w && svgY >= nl.absY && svgY <= nl.absY + nl.h) {
        if (!best || nl.w * nl.h < best.w * best.h) best = nl;
      }
    }
    return best;
  }

  private onHover = (e: MouseEvent) => {
    if (this.draggingNodeId || !this.svg) return;
    const { x, y } = this.toSvg(e.clientX, e.clientY);
    const hit = this.hitTest(x, y);
    this.svg.style.cursor = hit ? 'grab' : 'default';
  };

  private onMouseDown = (e: MouseEvent) => {
    if (e.button !== 0 || !this.svg) return;
    const { x, y } = this.toSvg(e.clientX, e.clientY);
    const hit = this.hitTest(x, y);
    if (!hit) return;

    e.preventDefault();
    this.interaction.onNodeClick?.(hit.id);

    // Only allow reorder for non-root nodes with siblings
    if (hit.parentId === null) return;
    const sibCount = [...this.nodeLayouts.values()].filter(n => n.parentId === hit.parentId).length;
    if (sibCount < 2) return;

    this.draggingNodeId = hit.id;
    this.dragStartMouse = { x, y };
    this.lastReorderIndex = hit.childIndex;
    this.svg.style.cursor = 'grabbing';

    document.addEventListener('mousemove', this.onDrag);
    document.addEventListener('mouseup', this.onDragEnd);
    document.body.style.userSelect = 'none';
  };

  private onDrag = (e: MouseEvent) => {
    if (!this.draggingNodeId) return;
    const { x, y } = this.toSvg(e.clientX, e.clientY);
    const layout = this.nodeLayouts.get(this.draggingNodeId);
    if (!layout || !layout.parentId) return;

    const siblings = [...this.nodeLayouts.values()]
      .filter(n => n.parentId === layout.parentId)
      .sort((a, b) => a.childIndex - b.childIndex);

    const isVertical = siblings.length >= 2
      ? Math.abs(siblings[1].absY - siblings[0].absY) >= Math.abs(siblings[1].absX - siblings[0].absX)
      : true;

    let newIndex = siblings.length;
    for (let i = 0; i < siblings.length; i++) {
      const mid = isVertical ? siblings[i].absY + siblings[i].h / 2 : siblings[i].absX + siblings[i].w / 2;
      if ((isVertical ? y : x) < mid) { newIndex = i; break; }
    }

    if (newIndex !== this.lastReorderIndex) {
      this.lastReorderIndex = newIndex;
      this.interaction.onNodeReorder?.(this.draggingNodeId, newIndex);
    }
  };

  private onDragEnd = () => {
    document.removeEventListener('mousemove', this.onDrag);
    document.removeEventListener('mouseup', this.onDragEnd);
    document.body.style.userSelect = '';
    this.draggingNodeId = null;
    if (this.svg) this.svg.style.cursor = 'default';
    // Re-render to clear dashed border
    if (this.lastResult && this.container) {
      this.render(this.lastResult, { width: this.container.clientWidth, height: this.container.clientHeight });
    }
  };

  dispose(): void {
    this.svg?.removeEventListener('mousedown', this.onMouseDown);
    this.svg?.removeEventListener('mousemove', this.onHover);
    this.svg?.remove();
    this.svg = null;
    this.container = null;
  }
}
