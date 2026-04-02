import type { FlowtextLayoutResult } from 'flowtext';
import { computeScale, type Renderer, type ViewportSize } from './types';

const CHAR_WIDTH = 7;
const CHAR_HEIGHT = 14;
const MAX_DEPTH = 3;

export class AsciiRenderer implements Renderer {
  private pre: HTMLPreElement | null = null;

  mount(container: HTMLElement): void {
    const pre = document.createElement('pre');
    pre.style.background = '#0f172a';
    pre.style.color = '#4ade80';
    pre.style.fontFamily = "'JetBrains Mono', 'Fira Code', monospace";
    pre.style.fontSize = '12px';
    pre.style.lineHeight = '1.3';
    pre.style.padding = '12px';
    pre.style.margin = '0';
    pre.style.overflow = 'auto';
    pre.style.borderRadius = '8px';
    pre.style.height = '100%';
    pre.style.boxSizing = 'border-box';
    container.appendChild(pre);
    this.pre = pre;
  }

  render(result: FlowtextLayoutResult, viewport: ViewportSize): void {
    if (!this.pre) return;

    const scale = computeScale(result, viewport);
    const cols = Math.max(20, Math.floor((viewport.width * scale) / CHAR_WIDTH));
    const rows = Math.max(10, Math.floor((viewport.height * scale) / CHAR_HEIGHT));

    const grid: string[][] = Array.from({ length: rows }, () =>
      Array(cols).fill(' ')
    );

    renderNode(grid, result, cols, rows, scale, 0);

    this.pre.textContent = grid.map((row) => row.join('')).join('\n');
  }

  dispose(): void {
    this.pre?.remove();
    this.pre = null;
  }
}

function writeChar(grid: string[][], row: number, col: number, ch: string): void {
  if (row >= 0 && row < grid.length && col >= 0 && col < (grid[0]?.length ?? 0)) {
    grid[row][col] = ch;
  }
}

function writeString(
  grid: string[][],
  row: number,
  startCol: number,
  text: string,
  maxCols: number
): void {
  const limit = Math.min(text.length, maxCols);
  for (let i = 0; i < limit; i++) {
    writeChar(grid, row, startCol + i, text[i]);
  }
}

function renderNode(
  grid: string[][],
  node: FlowtextLayoutResult,
  cols: number,
  rows: number,
  scale: number,
  depth: number
): void {
  const col = Math.round((node.x * scale) / CHAR_WIDTH);
  const row = Math.round((node.y * scale) / CHAR_HEIGHT);
  const nodeW = Math.round((node.width * scale) / CHAR_WIDTH);
  const nodeH = Math.round((node.height * scale) / CHAR_HEIGHT);

  if (nodeW < 2 || nodeH < 2) return;

  if (depth > MAX_DEPTH) {
    const centerRow = row + Math.floor(nodeH / 2);
    const centerCol = col + Math.floor((nodeW - 3) / 2);
    writeString(grid, centerRow, centerCol, '...', nodeW);
    return;
  }

  if (node.type === 'view') {
    drawBox(grid, row, col, nodeW, nodeH);

    const label = node.id.slice(0, nodeW - 2);
    if (label.length > 0) {
      writeString(grid, row + 1, col + 1, label, nodeW - 2);
    }

    if (node.children) {
      for (const child of node.children) {
        renderNode(grid, child, cols, rows, scale, depth + 1);
      }
    }
    return;
  }

  if (node.type === 'text' && node.lines) {
    const boxInnerW = nodeW - 2;
    node.lines.forEach((line, i) => {
      const lineRow = Math.round((line.y * scale) / CHAR_HEIGHT);
      const lineCol = Math.round((line.x * scale) / CHAR_WIDTH);
      writeString(grid, lineRow, lineCol, line.text, boxInnerW > 0 ? boxInnerW : nodeW);
    });
    return;
  }

  if (node.children) {
    for (const child of node.children) {
      renderNode(grid, child, cols, rows, scale, depth + 1);
    }
  }
}

function drawBox(
  grid: string[][],
  row: number,
  col: number,
  w: number,
  h: number
): void {
  if (w < 2 || h < 2) return;

  writeChar(grid, row, col, '+');
  writeChar(grid, row, col + w - 1, '+');
  writeChar(grid, row + h - 1, col, '+');
  writeChar(grid, row + h - 1, col + w - 1, '+');

  for (let c = col + 1; c < col + w - 1; c++) {
    writeChar(grid, row, c, '-');
    writeChar(grid, row + h - 1, c, '-');
  }

  for (let r = row + 1; r < row + h - 1; r++) {
    writeChar(grid, r, col, '|');
    writeChar(grid, r, col + w - 1, '|');
  }
}
