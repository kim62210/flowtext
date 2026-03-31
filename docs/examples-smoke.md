# Example Smoke Notes

This document captures the smallest public usage path that should remain understandable and stable as Flowtext evolves.

## Example

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

## Verification Path

The nearest practical verification commands for the current documentation set are:

- `pnpm test`
- `pnpm typecheck`
- `pnpm build`

These commands verify the engine contracts, the layout path, the validation layer, and the demo renderer that documents the public result shape.
