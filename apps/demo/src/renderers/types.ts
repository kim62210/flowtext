import type { FlowtextLayoutResult } from 'flowtext';

export interface ViewportSize {
  width: number;
  height: number;
}

export interface Renderer {
  render(result: FlowtextLayoutResult, viewport: ViewportSize): void;
  mount(container: HTMLElement): void;
  dispose(): void;
}

export function computeScale(result: FlowtextLayoutResult, viewport: ViewportSize): number {
  const scaleX = viewport.width / result.width;
  const scaleY = viewport.height / result.height;
  return Math.min(scaleX, scaleY, 1);
}
