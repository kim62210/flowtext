# Flowtext Release Checklist

Use this checklist before creating any public release tag.

## Core Verification

- [ ] `pnpm test` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` passes
- [ ] `pnpm check` passes
- [ ] TypeScript LSP diagnostics report zero errors

## Package Verification

- [ ] `packages/flowtext/package.json` metadata is accurate
- [ ] `packages/flowtext/README.md` matches the published surface
- [ ] `packages/flowtext/CHANGELOG.md` is updated
- [ ] `npm pack --dry-run` succeeds from `packages/flowtext`

## Public Contract Review

- [ ] `README.md` matches the current implementation
- [ ] `docs/api.md` matches current exports
- [ ] `docs/architecture/style-subset.md` matches implemented style support
- [ ] Public errors remain limited to `INVALID_NODE`, `UNSUPPORTED_STYLE`, and `MEASURE_FAILED`

## Demo Review

- [ ] `apps/demo/src/main.test.ts` passes
- [ ] `apps/demo/index.html` still reflects the current demo entry path
- [ ] Demo wording does not imply more runtime support than the implementation provides

## Release Positioning

- [ ] Release notes describe the package as experimental if it is still pre-1.0 in practice
- [ ] Known runtime and measurement limitations are documented clearly
- [ ] Changelog entries are user-facing and not internal-only development notes
