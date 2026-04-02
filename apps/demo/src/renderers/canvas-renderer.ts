import type { FlowtextLayoutResult } from 'flowtext';
import { computeScale, type Renderer, type ViewportSize } from './types';

export class CanvasRenderer implements Renderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  mount(container: HTMLElement): void {
    this.canvas = document.createElement('canvas');
    const dpr = window.devicePixelRatio ?? 1;

    const cssWidth = container.clientWidth || 300;
    const cssHeight = container.clientHeight || 150;

    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;
    this.canvas.width = cssWidth * dpr;
    this.canvas.height = cssHeight * dpr;

    this.ctx = this.canvas.getContext('2d');
    if (this.ctx) {
      this.ctx.scale(dpr, dpr);
    }

    container.appendChild(this.canvas);
  }

  render(result: FlowtextLayoutResult, viewport: ViewportSize): void {
    const { canvas, ctx } = this;
    if (!canvas || !ctx) {
      return;
    }

    const dpr = window.devicePixelRatio ?? 1;

    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    canvas.width = viewport.width * dpr;
    canvas.height = viewport.height * dpr;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);

    const scale = computeScale(result, viewport);
    ctx.scale(scale, scale);

    ctx.save();
    ctx.translate(result.x, result.y);
    this.renderNode(ctx, result);
    ctx.restore();
  }

  private renderNode(ctx: CanvasRenderingContext2D, node: FlowtextLayoutResult): void {
    ctx.save();

    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, node.width, node.height);

    ctx.fillStyle = '#d97706';
    ctx.font = '8px monospace';
    ctx.fillText(node.id, 2, 8);

    if (node.lines && node.lines.length > 0) {
      ctx.fillStyle = '#0f172a';
      ctx.font = '14px sans-serif';
      for (const line of node.lines) {
        ctx.fillText(line.text, line.x, line.y + line.height);
      }
    }

    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        ctx.save();
        ctx.translate(child.x, child.y);
        this.renderNode(ctx, child);
        ctx.restore();
      }
    }

    ctx.restore();
  }

  dispose(): void {
    this.canvas?.remove();
    this.canvas = null;
    this.ctx = null;
  }
}
