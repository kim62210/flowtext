# Flowtext Release Checklist

Use this checklist before creating any public release tag.

## Core Verification

- [x] `pnpm test` passes
- [x] `pnpm typecheck` passes
- [x] `pnpm build` passes
- [x] `pnpm check` passes
- [x] TypeScript LSP diagnostics report zero errors

## Package Verification

- [x] `packages/flowtext/package.json` metadata is accurate
- [x] `packages/flowtext/README.md` matches the published surface
- [x] `packages/flowtext/CHANGELOG.md` is updated
- [x] `npm pack --dry-run` succeeds from `packages/flowtext`

## Public Contract Review

- [x] `README.md` matches the current implementation
- [x] `docs/api.md` matches current exports
- [x] `docs/architecture/style-subset.md` matches implemented style support
- [x] Public errors remain limited to `INVALID_NODE`, `UNSUPPORTED_STYLE`, and `MEASURE_FAILED`

## Demo Review

- [x] `apps/demo/src/main.test.ts` passes
- [x] `apps/demo/index.html` still reflects the current demo entry path
- [x] Demo wording does not imply more runtime support than the implementation provides

## Release Positioning

- [x] Release notes describe the package as experimental if it is still pre-1.0 in practice
- [x] Known runtime and measurement limitations are documented clearly
- [x] Changelog entries are user-facing and not internal-only development notes
