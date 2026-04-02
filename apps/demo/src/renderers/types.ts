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

/**
 * Compute a scale factor to fit the layout result within the viewport.
 * Never enlarges (max 1). Returns 1 if result fits already.
 * Guards against zero/NaN dimensions.
 */
export function computeScale(result: FlowtextLayoutResult, viewport: ViewportSize): number {
  const rw = result.width || 1;
  const rh = result.height || 1;
  const vw = viewport.width || 1;
  const vh = viewport.height || 1;
  const scaleX = vw / rw;
  const scaleY = vh / rh;
  return Math.min(scaleX, scaleY, 1);
}
