# Flowtext

[![CI](https://github.com/kim62210/flowtext/actions/workflows/ci.yml/badge.svg)](https://github.com/kim62210/flowtext/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/flowtext.svg)](https://www.npmjs.com/package/flowtext)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

**DOM-free layout engine for Canvas, WebGL, SVG, and server-side rendering.**

Flowtext combines [Yoga](https://yogalayout.dev/) (flexbox) and [Pretext](https://github.com/chenglou/pretext) (text measurement) into a single layout tree. Give it containers and text, get back pixel positions and line breaks -- no browser required.

## Why Flowtext?

DOM-based layout depends on the browser. Outside the browser -- Canvas, WebGL, server-side image generation -- there is no `getBoundingClientRect()`. Yoga solves box layout but is **text-blind**: it cannot measure paragraphs or compute line breaks. Pretext measures text but does not handle structural layout.

Flowtext bridges the gap. One `layoutTree()` call returns positions, sizes, and wrapped text lines for your entire UI tree.

```
Input tree (JSON)  -->  layoutTree()  -->  Positions + line breaks
                         Yoga + Pretext       ready for any renderer
```

## Live Demo

**[flowtext demo](https://kim62210.github.io/flowtext/)** -- interactive showcase with SVG, Canvas, and ASCII rendering side by side.

Run locally:

```sh
pnpm demo:dev
```

## Installation

```sh
pnpm add flowtext
```

## Quick Start

```ts
import { layoutTree } from 'flowtext';

const result = await layoutTree(
  {
    id: 'root',
    type: 'view',
    style: { width: 320, flexDirection: 'column', padding: 16 },
    children: [
      {
        id: 'title',
        type: 'text',
        text: 'Hello from Flowtext',
        style: { fontFamily: 'sans-serif', fontSize: 16, lineHeight: 24 },
      },
    ],
  },
  { width: 320 },
);

// result.children[0].lines => [{ text: 'Hello from Flowtext', x: 0, y: 0, width: ..., height: 24 }]
```

### Render to Canvas

```ts
const ctx = canvas.getContext('2d');

function draw(node) {
  ctx.save();
  ctx.translate(node.x, node.y);
  ctx.strokeRect(0, 0, node.width, node.height);
  if (node.lines) {
    for (const line of node.lines) {
      ctx.fillText(line.text, line.x, line.y + line.height);
    }
  }
  node.children?.forEach(draw);
  ctx.restore();
}

draw(result);
```

### Render to SVG

```ts
function toSvg(node) {
  let svg = `<g transform="translate(${node.x},${node.y})">`;
  svg += `<rect width="${node.width}" height="${node.height}" fill="none" stroke="#ccc"/>`;
  if (node.lines) {
    for (const line of node.lines) {
      svg += `<text x="${line.x}" y="${line.y + line.height}">${line.text}</text>`;
    }
  }
  node.children?.forEach(c => { svg += toSvg(c); });
  return svg + '</g>';
}
```

### Server-side (Node.js)

```ts
import { layoutTree } from 'flowtext';

// No DOM, no browser -- works in Node.js, Deno, Bun, Workers
const result = await layoutTree(ogImageTree, { width: 1200, height: 630 });
// Use result to generate an image with sharp, canvas, or any renderer
```

## API

### `layoutTree(root, constraints, options?)`

| Parameter | Type | Description |
|---|---|---|
| `root` | `FlowtextNode` | Layout tree with `view` and `text` nodes |
| `constraints` | `{ width?, height? }` | Available space |
| `options.textAdapter` | `TextMeasurementAdapter` | Custom text measurer (default: Pretext) |

Returns `Promise<FlowtextLayoutResult>` with `x`, `y`, `width`, `height`, and `lines` for each node.

### Supported Styles

**Layout:** `flexDirection`, `justifyContent`, `alignItems`, `alignSelf`, `flexGrow`, `flexShrink`, `width`, `height`, `minWidth`, `maxWidth`, `minHeight`, `maxHeight`, `padding`, `margin`

**Text:** `fontSize`, `lineHeight`, `fontFamily`, `fontWeight`, `whiteSpace`

Full API reference: [`docs/api.md`](./docs/api.md)

## Status

Flowtext is **experimental** and **pre-1.0**. Breaking changes are expected. See [CHANGELOG.md](./CHANGELOG.md).

## Design Principles

1. **Small core** -- narrow public surface, one function entry point
2. **Renderer agnostic** -- computes layout, never renders
3. **No DOM dependency** -- no `getBoundingClientRect()`, no `document`
4. **Honest limits** -- documents runtime/font/locale constraints explicitly

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). All contributions welcome.

## License

[MIT](./LICENSE)
