import type { FlowtextLayoutResult } from 'flowtext';
import { computeScale, type Renderer, type ViewportSize } from './types';

export class CanvasRenderer implements Renderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private container: HTMLElement | null = null;

  mount(container: HTMLElement): void {
    this.container = container;
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

    // Scale to fit container width, maintain aspect ratio
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

    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(0, 0, node.width, node.height);

    // ID label
    ctx.fillStyle = '#d97706';
    ctx.font = '8px system-ui, sans-serif';
    ctx.fillText(node.id, 3, 9);

    // Text lines
    if (node.lines) {
      ctx.fillStyle = '#2c2c2c';
      for (const line of node.lines) {
        const fontSize = line.height > 0 ? line.height : 14;
        ctx.font = `${fontSize}px sans-serif`;
        ctx.fillText(line.text, line.x, line.y + line.height * 0.85);
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
    this.container = null;
  }
}
