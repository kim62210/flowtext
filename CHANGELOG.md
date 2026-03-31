# Changelog

All notable changes to Flowtext will be documented in this file.

The format is intentionally lightweight while the project is pre-1.0. Entries are grouped by development milestone, and the maintainer refreshes this file together with `README.md` at least every 10 commits during active development.

## [Unreleased]

### Added
- initial OSS governance files: `README.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, and `SECURITY.md`
- architecture contracts for the measurement profile, style subset, and public error model
- the pnpm TypeScript workspace, package scaffold, and public Flowtext type contracts
- the first Yoga-backed structural layout path for view trees
- the first Pretext-backed text measurement adapter contract
- a public `layoutTree()` entry point that returns unified box and text layout results
- runtime validation and public error handling for invalid nodes, unsupported styles, and measurement failures
- a thin SVG demo renderer and browser demo entry under `apps/demo/`
- public API documentation and minimal usage guides
- package-level release metadata, publish hooks, and package README/LICENSE/CHANGELOG files
- a release-facing `check` script that runs tests, typecheck, and build together

### Planned
- release metadata hardening and 1.0.0 readiness review

### Notes
- `README.md` and `CHANGELOG.md` are reviewed at least every 10 commits during active development.
- `Unreleased` is the working section for user-facing changes between tagged releases.
