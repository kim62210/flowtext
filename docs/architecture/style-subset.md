# Supported Style Subset for v1

Flowtext intentionally starts with a narrow public style surface.

## Structural Layout

- `display`
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
- `paddingTop`
- `paddingRight`
- `paddingBottom`
- `paddingLeft`
- `margin`
- `marginTop`
- `marginRight`
- `marginBottom`
- `marginLeft`
- `gap`, or a documented gap emulation strategy if the selected Yoga binding does not support it cleanly

## Text Layout Inputs

- `fontSize`
- `lineHeight`
- `fontFamily`
- `fontWeight`
- `whiteSpace` with support limited to `normal` and optional `pre-wrap`
- `overflowWrap` with support limited to `break-word`

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
