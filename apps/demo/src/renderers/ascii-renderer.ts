import type { FlowtextLayoutResult } from 'flowtext';
import type { Renderer, ViewportSize } from './types';

const CHAR_W = 7;
const CHAR_H = 14;
const MAX_DEPTH = 3;

export class AsciiRenderer implements Renderer {
  private pre: HTMLPreElement | null = null;

  mount(container: HTMLElement): void {
    this.pre = document.createElement('pre');
    container.appendChild(this.pre);
  }

  render(result: FlowtextLayoutResult, _viewport: ViewportSize): void {
    if (!this.pre) return;

    const cols = Math.max(20, Math.ceil(result.width / CHAR_W));
    const rows = Math.max(6, Math.ceil(result.height / CHAR_H));

    const grid: string[][] = Array.from({ length: rows }, () => Array(cols).fill(' '));

    renderNode(grid, result, 0, 0, 0);

    this.pre.textContent = grid.map(row => row.join('')).join('\n');
  }

  dispose(): void {
    this.pre?.remove();
    this.pre = null;
  }
}

function putChar(grid: string[][], r: number, c: number, ch: string) {
  if (r >= 0 && r < grid.length && c >= 0 && c < (grid[0]?.length ?? 0)) grid[r][c] = ch;
}

function putStr(grid: string[][], r: number, c: number, text: string, maxLen: number) {
  for (let i = 0; i < Math.min(text.length, maxLen); i++) putChar(grid, r, c + i, text[i]);
}

function renderNode(grid: string[][], node: FlowtextLayoutResult, offX: number, offY: number, depth: number) {
  const c = Math.round((offX + node.x) / CHAR_W);
  const r = Math.round((offY + node.y) / CHAR_H);
  const w = Math.max(2, Math.round(node.width / CHAR_W));
  const h = Math.max(2, Math.round(node.height / CHAR_H));

  if (depth > MAX_DEPTH) {
    putStr(grid, r + Math.floor(h / 2), c + Math.floor((w - 3) / 2), '...', w);
    return;
  }

  // Box
  putChar(grid, r, c, '+');
  putChar(grid, r, c + w - 1, '+');
  putChar(grid, r + h - 1, c, '+');
  putChar(grid, r + h - 1, c + w - 1, '+');
  for (let i = c + 1; i < c + w - 1; i++) { putChar(grid, r, i, '-'); putChar(grid, r + h - 1, i, '-'); }
  for (let i = r + 1; i < r + h - 1; i++) { putChar(grid, i, c, '|'); putChar(grid, i, c + w - 1, '|'); }

  // ID
  putStr(grid, r, c + 1, node.id, w - 2);

  // Text lines
  if (node.lines) {
    for (const line of node.lines) {
      const lr = Math.round((offY + node.y + line.y) / CHAR_H);
      const lc = Math.round((offX + node.x + line.x) / CHAR_W);
      putStr(grid, lr, lc, line.text, w - 2);
    }
  }

  // Children
  if (node.children) {
    for (const child of node.children) {
      renderNode(grid, child, offX + node.x, offY + node.y, depth + 1);
    }
  }
}
