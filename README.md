# Flowtext

**A small DOM-free layout core for box layout and paragraph measurement.**

Flowtext combines **Yoga** for box layout and **Pretext** for paragraph measurement and line layout. It is designed for renderers that cannot rely on browser DOM layout, such as Canvas, WebGL, SVG, server-driven image generation, and other programmatic UI surfaces.

The initial runtime plan is based on the official `yoga-layout` package plus `@chenglou/pretext`, with an explicit async bootstrap boundary for Yoga initialization and a documented measurement profile for predictable output.

## Status

Flowtext is currently **experimental** and **pre-1.0**.

- breaking changes are expected
- APIs, result shapes, and internal package boundaries may still change
- production-readiness is not claimed yet
- release planning is driven by test coverage, documentation quality, and stable behavior under a documented measurement profile

## Problem

Non-DOM renderers still need two things:

- reliable box layout
- reliable paragraph measurement

Yoga already solves box layout well. Pretext already solves paragraph measurement and line layout well. Flowtext focuses on the integration layer between them so applications do not have to rebuild the same width-constraint, measure-callback, and result-merging logic repeatedly.

## Scope

The first release line focuses on one narrow problem:

> given a tree of containers and text, return predictable layout output without using DOM measurement APIs.

### In scope for the first release line

- renderer-neutral layout tree input
- Yoga-backed structural layout
- Pretext-backed paragraph measurement and line extraction
- explicit validation and public error codes
- a thin demo that visualizes engine output without turning Flowtext into a renderer framework
- official `yoga-layout` initialization and lifecycle rules documented as part of the public runtime contract

### Out of scope for the first release line

- rich text editing
- cursor, selection, or composition management
- full typography or shaping guarantees across every runtime
- renderer-specific adapters as first-class core features
- browser-independent pixel identity guarantees
- universal server-side parity across all hosts

## Installation

```sh
pnpm add flowtext yoga-layout @chenglou/pretext
```

At the current stage, Flowtext is intended for projects that can satisfy the runtime assumptions documented in `docs/architecture/measurement-profile.md`.

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

For a more complete walkthrough, see `docs/api.md` and `docs/examples-smoke.md`.

## Demo

The repository includes a thin browser demo under `apps/demo/`.

- `apps/demo/src/main.ts` renders Flowtext output as SVG
- `apps/demo/src/browser.ts` mounts that SVG into the demo page
- `apps/demo/index.html` is a minimal browser entry for manual inspection

## Design Principles

1. **Small core first**
   Keep the public surface narrow and maintainable.
2. **Renderer agnostic**
   Flowtext computes layout. Rendering stays outside the core package.
3. **No DOM measurement dependency**
   Flowtext avoids browser layout probes such as `getBoundingClientRect()`.
4. **Honest limits**
   The project documents runtime, font, and locale constraints instead of hiding them.
5. **Open-source maintainability**
   Documentation, tests, and release policy matter as much as features.

## Measurement Profile

Flowtext promises predictable output only within a documented measurement profile. That profile includes the runtime, font configuration, locale, engine version, and output rounding policy. See `docs/architecture/measurement-profile.md`.

## Runtime Notes

- the initial runtime target will use the official `yoga-layout` package rather than an unofficial Yoga fork
- Yoga initialization should be treated as an async runtime concern
- Yoga node and config disposal must be handled explicitly
- Pretext requires font and line-height inputs that match the actual rendering environment

## Governance

- Contribution guide: `CONTRIBUTING.md`
- Code of conduct: `CODE_OF_CONDUCT.md`
- Security policy: `SECURITY.md`
- Changelog: `CHANGELOG.md`

## Release Philosophy

Flowtext will only consider a `1.0.0` release when all of the following are true:

- core APIs are documented and intentionally scoped
- the measurement profile and known limitations are explicit
- tests, build, and type checks pass consistently
- the public error model is stable enough to support semver commitments

## Roadmap Shape

The project roadmap is milestone-based rather than promise-heavy:

1. OSS foundation and contracts
2. package scaffold and public types
3. Yoga-backed structural layout
4. Pretext measurement bridge
5. unified public layout results
6. validation and demo
7. release-quality docs and verification

## Development Notes

- All code, comments, docs, and examples are kept in English.
- Work is committed in small feature- or module-sized units.
- `README.md` and `CHANGELOG.md` are reviewed at least every 10 commits during active development, and updated whenever public-facing behavior has changed.

Implementation details and approved planning artifacts live in `docs/specs` and `docs/plans`.
