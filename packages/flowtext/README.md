# Flowtext

Flowtext is a DOM-free layout core for box layout and paragraph measurement.

It combines the official `yoga-layout` package for structural layout with `@chenglou/pretext` for paragraph measurement and line extraction, then returns a unified layout result that custom renderers can consume.

## Installation

When the package is publicly published, install it with:

```sh
pnpm add flowtext yoga-layout @chenglou/pretext
```

## Minimal Usage

```ts
import { layoutTree } from 'flowtext';

const result = await layoutTree(
  {
    id: 'root',
    type: 'view',
    style: {
      width: 320,
      flexDirection: 'column',
    },
    children: [
      {
        id: 'title',
        type: 'text',
        text: 'Flowtext turns Yoga and Pretext into one layout tree.',
        style: {
          fontFamily: 'Inter',
          fontSize: 16,
          lineHeight: 24,
        },
      },
    ],
  },
  { width: 320 },
);

console.log(result.children?.[0]?.lines);
```

## Status

Flowtext is still experimental and pre-1.0 in scope discipline, even though the package metadata is prepared for public distribution. Read the repository-level README for detailed scope, limitations, and governance files.
