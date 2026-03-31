# Flowtext Design

## Summary

Flowtext is a small DOM-free layout core for non-DOM renderers. It combines `facebook/yoga` for box layout and `@chenglou/pretext` for paragraph measurement and line layout, then returns a unified layout result that downstream renderers can draw.

The first audience is developers building custom renderers such as Canvas, WebGL, SVG, server-driven image generation, or editor surfaces that cannot rely on browser DOM layout.

## Product Definition

- **Product type:** headless layout core with a thin demo for validation
- **Primary users:** application developers building custom renderers
- **Core value:** compute box layout and paragraph layout through one reusable integration layer
- **MVP output:** a layout result tree containing box geometry and text line geometry
- **Positioning:** a layout core, not a UI framework, renderer, or universal document engine

## Open Source Project Rules

- All code, comments, docs, examples, and public-facing notes must be written in English.
- The project must stay reusable and renderer-agnostic.
- Commits should be modular and grouped by feature or module.
- Commit messages should follow `feat|fix|bug|refactor|docs: <summary>`.
- Each non-trivial commit should include a 3-5 line explanation body describing the functional change.

## Why This Exists

Today, developers building non-DOM renderers usually have to assemble the same glue code repeatedly:

- build a Yoga tree for box layout
- attach text measurement through Yoga leaf measurement callbacks
- translate width constraints into paragraph layout calls
- merge box geometry with line-level text geometry
- manage invalidation and re-measurement rules manually

Flowtext turns that glue into a small reusable core.

## Determinism Contract

Flowtext should promise **predictable results only within a fixed measurement profile**, not universal cross-platform pixel identity. The measurement profile includes:

- host runtime
- font configuration
- locale
- engine version
- output rounding policy

For MVP, Flowtext should document this explicitly instead of claiming identical output in every host.

## Approaches Considered

### 1. Pure headless core
- Strong engine identity
- Easier to keep renderer-agnostic
- Harder to demonstrate immediate value without a demo

### 2. Core plus renderer adapters
- Easier early adoption for application developers
- Risks mixing core responsibilities with renderer-specific behavior too early

### 3. Demo-first product
- Easier to communicate visually
- Risks under-designing the core contract

## Recommended Approach

Start with a **pure headless core** and ship a thin demo alongside it. The demo proves the concept, but the product identity stays centered on the layout core.

## Architecture

### 1. Input Layer

Accept a renderer-neutral tree with four initial node primitives:

- `View`
- `Text`
- `Inline`
- `Block`

Each node contains:

- supported style properties from a strict v1 subset
- text content when relevant
- child nodes
- optional text measurement options

The public input should stay JSON/JS-object friendly instead of requiring React or DOM nodes.

### MVP Style Subset

The first version should support only an explicit subset:

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
- `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`
- `margin`
- `marginTop`, `marginRight`, `marginBottom`, `marginLeft`
- `gap` or a documented gap emulation strategy if the selected Yoga binding does not support it cleanly
- `fontSize`
- `lineHeight`
- `fontFamily`
- `fontWeight`
- `whiteSpace` with MVP support limited to `normal` and optional `pre-wrap`
- `overflowWrap` with MVP support limited to `break-word`

Any style outside this subset should produce an explicit unsupported-style error.

### 2. Box Layout Layer

Use Yoga for container and block layout:

- flex direction
- alignment
- width and height constraints
- padding and spacing
- parent and child frame computation

Text nodes should be exposed to Yoga as measurable leaf nodes. Yoga remains the source of truth for final box geometry.

### 3. Text Layout Layer

Use Pretext for:

- paragraph measurement
- line breaking
- wrapped line layout
- total block height calculation

Yoga asks for measured size under a width constraint, and the text layer returns dimensions plus line data. The text layer must also own invalidation rules for content, font, locale, and wrapping-related changes.

### Text Measurement Adapter Boundary

Flowtext should expose text measurement through an explicit adapter contract rather than hiding it behind global state. The adapter is responsible for:

- preparing text measurement inputs
- mapping Yoga width modes to concrete text layout constraints
- caching prepared text where safe
- invalidating cached results when text-affecting inputs change
- returning line geometry and measurement metadata

For MVP, this adapter may stay synchronous if the runtime assumes preloaded fonts. If asynchronous font loading becomes required, that should be treated as a separate design step instead of being silently absorbed into the first public API.

### 4. Output Layer

Return a layout tree containing:

- `x`, `y`, `width`, `height`
- node type and identity
- text line boxes where applicable
- overflow metadata
- baseline-related metadata when available
- limitation flags when a result depends on runtime or font caveats

This output is consumed by downstream renderers such as Canvas, SVG, WebGL, or other custom environments.

## Data Flow

1. User provides a node tree and root constraints.
2. Flowtext normalizes nodes into internal layout nodes.
3. Yoga computes structural layout.
4. Text nodes invoke Pretext measurement during Yoga's measurement phase.
5. Flowtext assembles the final layout tree.
6. A renderer or application consumes the result.

## Public API Direction

```ts
type FlowtextNode = {
  id: string;
  type: 'view' | 'text' | 'inline' | 'block';
  style?: FlowtextStyle;
  text?: string;
  children?: FlowtextNode[];
  textOptions?: TextMeasureOptions;
};

type FlowtextStyle = {
  display?: 'flex' | 'none';
  flexDirection?: 'row' | 'column';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
  alignItems?: 'stretch' | 'flex-start' | 'center' | 'flex-end' | 'baseline';
  alignSelf?: 'auto' | 'stretch' | 'flex-start' | 'center' | 'flex-end' | 'baseline';
  flexGrow?: number;
  flexShrink?: number;
  width?: number;
  height?: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  padding?: number;
  margin?: number;
  fontSize?: number;
  lineHeight?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  whiteSpace?: 'normal' | 'pre-wrap';
  overflowWrap?: 'break-word';
};

type TextMeasureOptions = {
  locale?: string;
  fontProfile?: string;
};

type LayoutConstraints = {
  width?: number;
  height?: number;
};

type FlowtextLayoutResult = {
  schemaVersion: 1;
  id: string;
  type: FlowtextNode['type'];
  x: number;
  y: number;
  width: number;
  height: number;
  overflow?: {
    x: boolean;
    y: boolean;
  };
  baseline?: number;
  limitations?: string[];
  lines?: Array<{
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
};

type FlowtextErrorCode =
  | 'INVALID_NODE'
  | 'UNSUPPORTED_STYLE'
  | 'MEASURE_FAILED';

declare function layoutTree(
  root: FlowtextNode,
  constraints: LayoutConstraints,
): FlowtextLayoutResult;
```

The first version should prefer a small API with explicit constraints over a broad styling surface.

### Primitive Semantics

- `view`: a Yoga-managed container or block box
- `text`: a measurable text leaf
- `block`: an explicit block-level grouping node that normalizes to a Yoga container
- `inline`: postponed for strict MVP unless its semantics are reduced to text-run grouping without standalone layout behavior

## Boundaries

### In scope for MVP
- vertical and horizontal flex layout through Yoga
- paragraph text wrapping under width constraints
- predictable JSON output within a documented measurement profile
- one thin browser demo
- explicit validation for unsupported styles and invalid nodes
- a synchronous measurement path with preloaded fonts

### Out of scope for MVP
- rich text editing behavior
- selection and cursor management
- asynchronous font loading contracts
- full font engine abstraction
- browser DOM renderer
- pagination and multi-page layout
- bidirectional text and advanced shaping guarantees beyond what upstream tools naturally support
- plugin ecosystems and renderer adapters as first-class core features

## Error Handling

- Reject invalid node shapes early with explicit validation errors.
- Distinguish structural errors from text-measurement errors.
- Surface unsupported style features explicitly instead of silently ignoring them.
- Publish stable error codes for public API consumers.

## Testing Strategy

- Contract tests for `layoutTree()` inputs and outputs
- Golden tests for representative layout trees
- Edge-case tests for wrapping, nested flex containers, and zero-width constraints
- Demo smoke tests to ensure the demo reflects engine output
- Rounding-normalized snapshots so floating-point differences do not create noisy failures
- Fixed-font fixtures for reproducible measurement tests

## Risks

### Technical
- Text metrics can vary by font environment.
- Yoga and Pretext may expose mismatched assumptions around measurement timing.
- Baseline and inline layout semantics may need extra glue logic.
- Yoga dirty and invalidation handling must stay correct whenever text-affecting inputs change.

### Product
- If the API grows too quickly, the engine loses clarity.
- If the project becomes renderer-specific too early, it stops being broadly reusable.

## MVP Success Criteria

- A developer can describe a small view and text tree and get stable layout results.
- The measurement profile and supported style subset are clearly documented.
- The same layout result can be rendered consistently by a thin demo.
- The engine contract is small, documented, and easy to test.

## OSS Project Infrastructure

The repository should include these non-code artifacts before public rollout:

- `LICENSE`
- `README.md`
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- runtime support policy
- semantic versioning policy
- changelog and release notes policy

`CONTRIBUTING.md` should explicitly state that source code, comments, docs, examples, and review artifacts stay in English.

## Remaining Decisions Before Implementation

- Confirm whether `inline` stays in MVP or moves to v2.
- Confirm the exact supported style subset after checking the selected Yoga binding capabilities.
- Confirm whether the first public API is strictly synchronous.
- Confirm how the measurement profile is named and documented for OSS users.
