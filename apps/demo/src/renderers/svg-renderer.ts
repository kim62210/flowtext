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
  siblingCount: number;
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

function collectNodeLayouts(
  result: FlowtextLayoutResult,
  offsetX: number,
  offsetY: number,
  parentId: string | null,
  childIndex: number,
  siblingCount: number,
  map: Map<string, NodeLayout>,
) {
  const absX = offsetX + result.x;
  const absY = offsetY + result.y;
  map.set(result.id, { id: result.id, absX, absY, w: result.width, h: result.height, parentId, childIndex, siblingCount });
  if (result.children) {
    for (let i = 0; i < result.children.length; i++) {
      collectNodeLayouts(result.children[i], absX, absY, result.id, i, result.children.length, map);
    }
  }
}

function renderNode(
  result: FlowtextLayoutResult,
  selectedId: string | null,
  dragState: DragState | null,
): SVGElement {
  const g = createEl('g') as SVGGElement;
  g.setAttribute('transform', `translate(${result.x}, ${result.y})`);

  const isSelected = result.id === selectedId;
  const isDragging = dragState?.nodeId === result.id;

  // bounding rect
  const rect = createEl('rect') as SVGRectElement;
  rect.setAttribute('x', '0');
  rect.setAttribute('y', '0');
  rect.setAttribute('width', String(result.width));
  rect.setAttribute('height', String(result.height));
  rect.setAttribute('fill', isSelected ? 'rgba(99,102,241,0.05)' : 'transparent');
  rect.setAttribute('stroke', isSelected ? '#6366f1' : '#818cf8');
  rect.setAttribute('stroke-width', isSelected ? '2' : '1');
  rect.setAttribute('data-node-id', result.id);

  if (isDragging) {
    rect.setAttribute('opacity', '0.3');
    rect.setAttribute('stroke-dasharray', '4 2');
  }

  g.appendChild(rect);

  // node ID label
  const label = createEl('text') as SVGTextElement;
  label.setAttribute('x', '3');
  label.setAttribute('y', '11');
  label.setAttribute('font-size', '9');
  label.setAttribute('font-family', "'Inter', system-ui, sans-serif");
  label.setAttribute('font-weight', '500');
  label.setAttribute('fill', isSelected ? '#6366f1' : '#818cf8');
  label.setAttribute('pointer-events', 'none');
  label.textContent = result.id;
  if (isDragging) label.setAttribute('opacity', '0.3');
  g.appendChild(label);

  // text lines
  if (result.lines && result.lines.length > 0) {
    for (const line of result.lines) {
      const lineEl = renderLine(line);
      if (isDragging) lineEl.setAttribute('opacity', '0.3');
      g.appendChild(lineEl);
    }
  }

  // children
  if (result.children) {
    for (const child of result.children) {
      g.appendChild(renderNode(child, selectedId, dragState));
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

interface DragState {
  nodeId: string;
  mode: 'move' | 'resize-right' | 'resize-bottom' | 'resize-corner';
  startMouseX: number;
  startMouseY: number;
  startW: number;
  startH: number;
}

export class SvgRenderer implements Renderer {
  private svg: SVGSVGElement | null = null;
  private container: HTMLElement | null = null;
  private interaction: SvgInteraction = {};
  private lastResult: FlowtextLayoutResult | null = null;
  private nodeLayouts = new Map<string, NodeLayout>();
  private dragState: DragState | null = null;
  private ghostEl: SVGGElement | null = null;
  private dropIndicator: SVGLineElement | null = null;
  private pendingDropIndex: number | null = null;

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

    // Rebuild node layout map
    this.nodeLayouts.clear();
    collectNodeLayouts(result, 0, 0, null, 0, 1, this.nodeLayouts);

    // Clear all except during active drag (keep ghost/indicator)
    while (this.svg.firstChild) {
      this.svg.removeChild(this.svg.firstChild);
    }

    const scale = computeScale(result, viewport);

    this.svg.setAttribute('width', String(viewport.width));
    this.svg.setAttribute('height', String(viewport.height));
    this.svg.setAttribute('viewBox', `0 0 ${result.width} ${result.height}`);

    const rootG = createEl('g') as SVGGElement;
    rootG.appendChild(
      renderNode(result, this.interaction.selectedNodeId ?? null, this.dragState),
    );
    this.svg.appendChild(rootG);

    // Re-attach ghost and drop indicator if dragging
    if (this.dragState && this.ghostEl) {
      this.svg.appendChild(this.ghostEl);
    }
    if (this.dropIndicator) {
      this.svg.appendChild(this.dropIndicator);
    }
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
    // Find the deepest node containing the point
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

    // Check if near edge
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
    const svg = this.svg;
    if (!svg) return;

    const { x, y } = this.toSvg(e.clientX, e.clientY);
    const hit = this.hitTest(x, y);

    if (!hit) {
      svg.style.cursor = 'default';
      return;
    }

    if (hit.edge === 'corner') svg.style.cursor = 'nwse-resize';
    else if (hit.edge === 'right') svg.style.cursor = 'ew-resize';
    else if (hit.edge === 'bottom') svg.style.cursor = 'ns-resize';
    else svg.style.cursor = 'grab';
  };

  private onMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return;
    const svg = this.svg;
    if (!svg) return;

    const { x, y } = this.toSvg(e.clientX, e.clientY);
    const hit = this.hitTest(x, y);
    if (!hit) return;

    e.preventDefault();

    // Select the node
    this.interaction.onNodeClick?.(hit.nodeId);

    const layout = this.nodeLayouts.get(hit.nodeId);
    if (!layout) return;

    if (hit.edge) {
      // Edge drag = resize
      const mode = hit.edge === 'corner' ? 'resize-corner'
        : hit.edge === 'right' ? 'resize-right'
        : 'resize-bottom';

      this.dragState = {
        nodeId: hit.nodeId,
        mode: mode as DragState['mode'],
        startMouseX: x,
        startMouseY: y,
        startW: layout.w,
        startH: layout.h,
      };
    } else {
      // Body drag = move/reorder
      this.dragState = {
        nodeId: hit.nodeId,
        mode: 'move',
        startMouseX: x,
        startMouseY: y,
        startW: layout.w,
        startH: layout.h,
      };
      svg.style.cursor = 'grabbing';
      this.createGhost(layout);
    }

    document.addEventListener('mousemove', this.onDrag);
    document.addEventListener('mouseup', this.onDragEnd);
    document.body.style.userSelect = 'none';
  };

  private createGhost(layout: NodeLayout) {
    if (!this.svg) return;
    const ghost = createEl('g') as SVGGElement;
    ghost.setAttribute('pointer-events', 'none');

    const rect = createEl('rect') as SVGRectElement;
    rect.setAttribute('width', String(layout.w));
    rect.setAttribute('height', String(layout.h));
    rect.setAttribute('fill', 'rgba(99,102,241,0.12)');
    rect.setAttribute('stroke', '#6366f1');
    rect.setAttribute('stroke-width', '2');
    rect.setAttribute('stroke-dasharray', '6 3');
    rect.setAttribute('rx', '4');
    ghost.appendChild(rect);

    const label = createEl('text') as SVGTextElement;
    label.setAttribute('x', '6');
    label.setAttribute('y', '16');
    label.setAttribute('font-size', '11');
    label.setAttribute('font-weight', '600');
    label.setAttribute('font-family', "'Inter', system-ui, sans-serif");
    label.setAttribute('fill', '#6366f1');
    label.textContent = layout.id;
    ghost.appendChild(label);

    ghost.setAttribute('transform', `translate(${layout.absX}, ${layout.absY})`);
    this.ghostEl = ghost;
    this.svg.appendChild(ghost);
  }

  private onDrag = (e: MouseEvent) => {
    if (!this.dragState || !this.svg) return;
    const { x, y } = this.toSvg(e.clientX, e.clientY);
    const dx = x - this.dragState.startMouseX;
    const dy = y - this.dragState.startMouseY;

    if (this.dragState.mode === 'move') {
      this.handleMoveDrag(x, y, dx, dy);
    } else {
      this.handleResizeDrag(dx, dy);
    }
  };

  private handleMoveDrag(svgX: number, svgY: number, dx: number, dy: number) {
    const layout = this.nodeLayouts.get(this.dragState!.nodeId);
    if (!layout || !this.svg) return;

    // Move ghost
    if (this.ghostEl) {
      this.ghostEl.setAttribute(
        'transform',
        `translate(${layout.absX + dx}, ${layout.absY + dy})`,
      );
    }

    // Find drop target among siblings
    if (layout.parentId === null) return; // can't reorder root
    const parentLayout = this.nodeLayouts.get(layout.parentId);
    if (!parentLayout) return;

    // Find siblings
    const siblings: NodeLayout[] = [];
    for (const nl of this.nodeLayouts.values()) {
      if (nl.parentId === layout.parentId) siblings.push(nl);
    }
    siblings.sort((a, b) => a.childIndex - b.childIndex);

    // Determine insert index based on current mouse position
    let newIndex = siblings.length;
    const isVertical = this.isVerticalParent(layout.parentId);

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

    this.pendingDropIndex = newIndex;
    this.updateDropIndicator(siblings, newIndex, isVertical, parentLayout);
  }

  private isVerticalParent(parentId: string): boolean {
    // Check if parent's children are laid out vertically
    const children: NodeLayout[] = [];
    for (const nl of this.nodeLayouts.values()) {
      if (nl.parentId === parentId) children.push(nl);
    }
    if (children.length < 2) return true;
    children.sort((a, b) => a.childIndex - b.childIndex);
    // If y changes more than x, it's vertical
    const dy = Math.abs(children[1].absY - children[0].absY);
    const dx = Math.abs(children[1].absX - children[0].absX);
    return dy >= dx;
  }

  private updateDropIndicator(
    siblings: NodeLayout[],
    insertIndex: number,
    isVertical: boolean,
    parentLayout: NodeLayout,
  ) {
    if (!this.svg) return;

    // Remove old indicator
    if (this.dropIndicator) {
      this.dropIndicator.remove();
      this.dropIndicator = null;
    }

    const line = createEl('line') as SVGLineElement;
    line.setAttribute('stroke', '#6366f1');
    line.setAttribute('stroke-width', '3');
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('pointer-events', 'none');

    if (isVertical) {
      let lineY: number;
      if (insertIndex === 0 && siblings.length > 0) {
        lineY = siblings[0].absY - 1;
      } else if (insertIndex >= siblings.length) {
        const last = siblings[siblings.length - 1];
        lineY = last.absY + last.h + 1;
      } else {
        const prev = siblings[insertIndex - 1];
        const curr = siblings[insertIndex];
        lineY = (prev.absY + prev.h + curr.absY) / 2;
      }
      line.setAttribute('x1', String(parentLayout.absX + 4));
      line.setAttribute('x2', String(parentLayout.absX + parentLayout.w - 4));
      line.setAttribute('y1', String(lineY));
      line.setAttribute('y2', String(lineY));
    } else {
      let lineX: number;
      if (insertIndex === 0 && siblings.length > 0) {
        lineX = siblings[0].absX - 1;
      } else if (insertIndex >= siblings.length) {
        const last = siblings[siblings.length - 1];
        lineX = last.absX + last.w + 1;
      } else {
        const prev = siblings[insertIndex - 1];
        const curr = siblings[insertIndex];
        lineX = (prev.absX + prev.w + curr.absX) / 2;
      }
      line.setAttribute('x1', String(lineX));
      line.setAttribute('x2', String(lineX));
      line.setAttribute('y1', String(parentLayout.absY + 4));
      line.setAttribute('y2', String(parentLayout.absY + parentLayout.h - 4));
    }

    this.dropIndicator = line;
    this.svg.appendChild(line);
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

    if (this.dragState?.mode === 'move' && this.pendingDropIndex !== null) {
      const layout = this.nodeLayouts.get(this.dragState.nodeId);
      if (layout && this.pendingDropIndex !== layout.childIndex) {
        this.interaction.onNodeReorder?.(this.dragState.nodeId, this.pendingDropIndex);
      }
    }

    // Cleanup
    this.ghostEl?.remove();
    this.ghostEl = null;
    this.dropIndicator?.remove();
    this.dropIndicator = null;
    this.dragState = null;
    this.pendingDropIndex = null;

    if (this.svg) this.svg.style.cursor = 'default';

    // Re-render to clear drag visual state
    if (this.lastResult) {
      const viewport: ViewportSize = {
        width: this.container?.clientWidth ?? 0,
        height: this.container?.clientHeight ?? 0,
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
