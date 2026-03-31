# Flowtext API

## Current Public Entry Point

Flowtext currently exposes one primary entry point:

- `layoutTree(root, constraints, options?)`

It also exports:

- `FLOWTEXT_SCHEMA_VERSION`
- public node, style, line, constraint, and result types
- `LayoutTreeOptions`

## Input Model

The input tree is renderer-neutral and based on these node types:

- `view`
- `text`
- `block`
- `inline` (currently rejected until inline semantics are implemented)

Each node can include:

- `id`
- `type`
- `style`
- `text`
- `children`
- `textOptions`

## Constraints

Root constraints currently support:

- `width`
- `height`

## Result Shape

The returned layout tree includes:

- `schemaVersion`
- `id`
- `type`
- `x`, `y`, `width`, `height`
- `lines` for measured text nodes
- `children` for nested results
- optional metadata fields such as `overflow`, `baseline`, and `limitations`

## Validation

Public runtime errors are intentionally typed around three stable codes:

- `INVALID_NODE`
- `UNSUPPORTED_STYLE`
- `MEASURE_FAILED`

See `docs/architecture/error-model.md` for details.

## Runtime Notes

- Flowtext currently targets the official `yoga-layout` package.
- Yoga initialization is treated as an async runtime concern.
- Text measurement accuracy depends on the documented measurement profile.
- The current layout path expects synchronous text measurement during Yoga layout.

## Current Non-Goals

- rich text editing semantics
- cursor and selection management
- framework-specific rendering adapters inside the core package
- universal runtime parity guarantees
