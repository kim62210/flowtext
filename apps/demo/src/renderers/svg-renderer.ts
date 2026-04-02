import type { FlowtextLayoutResult, FlowtextLayoutLine } from 'flowtext';
import { computeScale } from './types';
import type { Renderer, ViewportSize } from './types';

const SVG_NS = 'http://www.w3.org/2000/svg';

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

function renderNode(result: FlowtextLayoutResult): SVGElement {
  const g = createEl('g') as SVGGElement;
  g.setAttribute('transform', `translate(${result.x}, ${result.y})`);

  // bounding rect
  const rect = createEl('rect') as SVGRectElement;
  rect.setAttribute('x', '0');
  rect.setAttribute('y', '0');
  rect.setAttribute('width', String(result.width));
  rect.setAttribute('height', String(result.height));
  rect.setAttribute('fill', 'none');
  rect.setAttribute('stroke', 'var(--color-svg-accent, #818cf8)');
  rect.setAttribute('stroke-width', '1');
  g.appendChild(rect);

  // node ID label
  const label = createEl('text') as SVGTextElement;
  label.setAttribute('x', '2');
  label.setAttribute('y', '10');
  label.setAttribute('font-size', '8');
  label.setAttribute('fill', '#818cf8');
  label.textContent = escapeXml(result.id);
  g.appendChild(label);

  // text lines
  if (result.lines && result.lines.length > 0) {
    for (const line of result.lines) {
      const lineEl = renderLine(line);
      g.appendChild(lineEl);
    }
  }

  // children
  if (result.children && result.children.length > 0) {
    for (const child of result.children) {
      g.appendChild(renderNode(child));
    }
  }

  return g;
}

function renderLine(line: FlowtextLayoutLine): SVGElement {
  const textEl = createEl('text') as SVGTextElement;
  textEl.setAttribute('x', String(line.x));
  textEl.setAttribute('y', String(line.y + line.height));
  textEl.setAttribute('fill', '#0f172a');

  // font-size: line.height가 양수이면 그 값을 그대로 사용, 아니면 14px 폴백
  const fontSize = line.height > 0 ? line.height : 14;
  textEl.setAttribute('font-size', String(fontSize));

  textEl.textContent = escapeXml(line.text);
  return textEl;
}

export class SvgRenderer implements Renderer {
  private svg: SVGSVGElement | null = null;
  private container: HTMLElement | null = null;

  mount(container: HTMLElement): void {
    this.container = container;
    const svg = document.createElementNS(SVG_NS, 'svg') as SVGSVGElement;
    svg.setAttribute('xmlns', SVG_NS);
    container.appendChild(svg);
    this.svg = svg;
  }

  render(result: FlowtextLayoutResult, viewport: ViewportSize): void {
    if (!this.svg) return;

    // clear
    while (this.svg.firstChild) {
      this.svg.removeChild(this.svg.firstChild);
    }

    const scale = computeScale(result, viewport);

    this.svg.setAttribute('width', String(viewport.width));
    this.svg.setAttribute('height', String(viewport.height));
    this.svg.setAttribute('viewBox', `0 0 ${result.width} ${result.height}`);

    const rootG = createEl('g') as SVGGElement;

    if (scale < 1) {
      rootG.setAttribute('transform', `scale(${scale})`);
    }

    rootG.appendChild(renderNode(result));
    this.svg.appendChild(rootG);
  }

  dispose(): void {
    if (this.svg && this.container) {
      this.container.removeChild(this.svg);
    }
    this.svg = null;
    this.container = null;
  }
}
