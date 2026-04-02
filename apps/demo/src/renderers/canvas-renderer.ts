import type { FlowtextLayoutResult } from 'flowtext';
import type { Renderer, ViewportSize } from './types';
import { COLORS, LABEL_FONT_SIZE, LABEL_OFFSET_X, LABEL_OFFSET_Y, baselineY } from './render-constants';

export class CanvasRenderer implements Renderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  mount(container: HTMLElement): void {
    this.canvas = document.createElement('canvas');
    this.canvas.style.display = 'block';
    this.canvas.style.width = '100%';
    this.canvas.style.height = 'auto';
    this.ctx = this.canvas.getContext('2d');
    container.appendChild(this.canvas);
  }

  render(result: FlowtextLayoutResult, viewport: ViewportSize): void {
    const { canvas, ctx } = this;
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio ?? 1;
    const rw = result.width || 1;
    const rh = result.height || 1;

    const containerW = viewport.width || 300;
    const scale = Math.min(containerW / rw, 1);
    const displayW = rw * scale;
    const displayH = rh * scale;

    canvas.style.width = `${displayW}px`;
    canvas.style.height = `${displayH}px`;
    canvas.width = displayW * dpr;
    canvas.height = displayH * dpr;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr * scale, dpr * scale);

    this.renderNode(ctx, result);
  }

  private renderNode(ctx: CanvasRenderingContext2D, node: FlowtextLayoutResult): void {
    ctx.save();
    ctx.translate(node.x, node.y);

    // Border -- same color as SVG
    ctx.strokeStyle = COLORS.stroke;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(0, 0, node.width, node.height);

    // ID label -- same position/size as SVG
    ctx.fillStyle = COLORS.label;
    ctx.font = `${LABEL_FONT_SIZE}px system-ui, sans-serif`;
    ctx.fillText(node.id, LABEL_OFFSET_X, LABEL_OFFSET_Y);

    // Text lines -- same baseline as SVG
    if (node.lines) {
      ctx.fillStyle = COLORS.text;
      for (const line of node.lines) {
        const fontSize = line.height > 0 ? line.height : 14;
        ctx.font = `${fontSize}px sans-serif`;
        ctx.fillText(line.text, line.x, baselineY(line.y, line.height));
      }
    }

    if (node.children) {
      for (const child of node.children) {
        this.renderNode(ctx, child);
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
