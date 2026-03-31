# Supported Style Subset for v1

Flowtext intentionally starts with a narrow public style surface.

## Structural Layout

- `flexDirection`
- `justifyContent`
- `alignItems`
- `alignSelf`
- `flexGrow`
- `flexShrink`
- `width`
- `height`
- `minWidth`
- `maxWidth`
- `minHeight`
- `maxHeight`
- `padding`
- `margin`

## Text Layout Inputs

- `fontSize`
- `lineHeight`
- `fontFamily`
- `fontWeight`
- `whiteSpace` with support limited to `normal` and optional `pre-wrap`

## Not Yet Implemented Even If Documented Earlier

The following items are intentionally deferred until a later release line:

- `display`
- side-specific padding and margin fields
- `gap`
- `overflowWrap`

## Public Contract Rule

Any style outside this subset must be rejected explicitly through a public unsupported-style error.

## Deferred Features

The following are intentionally deferred until there is a stronger core:

- rich text segments
- text alignment variants
- line clamping
- absolute positioning
- grid layout
- renderer-specific styling fields
