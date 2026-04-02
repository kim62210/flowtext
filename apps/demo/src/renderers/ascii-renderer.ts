import type { FlowtextLayoutResult } from 'flowtext';
import type { Renderer, ViewportSize } from './types';

const CHAR_W = 7;
const CHAR_H = 14;
const MAX_DEPTH = 3;

export class AsciiRenderer implements Renderer {
  private pre: HTMLPreElement | null = null;

  mount(container: HTMLElement): void {
    this.pre = document.createElement('pre');
    this.pre.style.overflow = 'hidden';
    this.pre.style.width = '100%';
    this.pre.style.height = '100%';
    container.appendChild(this.pre);
  }

  render(result: FlowtextLayoutResult, _viewport: ViewportSize): void {
    if (!this.pre) return;

    const cols = Math.max(20, Math.ceil(result.width / CHAR_W));
    const rows = Math.max(6, Math.ceil(result.height / CHAR_H));

    const grid: string[][] = Array.from({ length: rows }, () => Array(cols).fill(' '));

    drawNode(grid, result, 0, 0, 0);

    this.pre.textContent = grid.map(row => row.join('')).join('\n');
  }

  dispose(): void {
    this.pre?.remove();
    this.pre = null;
  }
}

function put(grid: string[][], r: number, c: number, ch: string) {
  if (r >= 0 && r < grid.length && c >= 0 && c < (grid[0]?.length ?? 0)) grid[r][c] = ch;
}

function putStr(grid: string[][], r: number, c: number, text: string, maxLen: number) {
  for (let i = 0; i < Math.min(text.length, maxLen); i++) put(grid, r, c + i, text[i]);
}

function drawNode(grid: string[][], node: FlowtextLayoutResult, offX: number, offY: number, depth: number) {
  const absX = offX + node.x;
  const absY = offY + node.y;
  const c0 = Math.round(absX / CHAR_W);
  const r0 = Math.round(absY / CHAR_H);
  const w = Math.max(2, Math.round(node.width / CHAR_W));
  const h = Math.max(2, Math.round(node.height / CHAR_H));

  if (depth > MAX_DEPTH) {
    putStr(grid, r0 + Math.floor(h / 2), c0 + Math.floor((w - 3) / 2), '...', w);
    return;
  }

  // Draw box border
  put(grid, r0, c0, '+');
  put(grid, r0, c0 + w - 1, '+');
  put(grid, r0 + h - 1, c0, '+');
  put(grid, r0 + h - 1, c0 + w - 1, '+');
  for (let i = c0 + 1; i < c0 + w - 1; i++) { put(grid, r0, i, '-'); put(grid, r0 + h - 1, i, '-'); }
  for (let i = r0 + 1; i < r0 + h - 1; i++) { put(grid, i, c0, '|'); put(grid, i, c0 + w - 1, '|'); }

  // ID in top-left corner (after the +)
  putStr(grid, r0, c0 + 1, node.id, w - 2);

  // Text lines -- position matches SVG/Canvas proportionally
  if (node.lines) {
    for (const line of node.lines) {
      // Use the same proportional y as pixel renderers: absY + line.y + line.height * 0.78
      // Convert to grid row: round(pixelY / CHAR_H)
      const linePixelY = absY + line.y + line.height * 0.5;
      const lr = Math.round(linePixelY / CHAR_H);
      const linePixelX = absX + line.x;
      const lc = Math.max(c0 + 1, Math.round(linePixelX / CHAR_W));
      putStr(grid, lr, lc, line.text, w - 2);
    }
  }

  // Children
  if (node.children) {
    for (const child of node.children) {
      drawNode(grid, child, absX, absY, depth + 1);
    }
  }
}
