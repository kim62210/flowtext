# Flowtext Layout Core Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an MVP DOM-free layout core that combines Yoga box layout with Pretext paragraph measurement and returns predictable layout results within a documented measurement profile.

**Architecture:** A small core library accepts a renderer-neutral node tree, delegates box layout to Yoga, delegates paragraph measurement and line layout to Pretext, and returns a result tree consumable by downstream renderers. A thin demo proves the integration without polluting the core API.

**Tech Stack:** TypeScript, a JavaScript or WASM Yoga binding, `@chenglou/pretext`, Vitest, Playwright, minimal browser demo

---

## Execution Rules

- All code, comments, docs, examples, and test descriptions must be written in English.
- Keep one responsibility per commit.
- Use commit messages in the form `feat|fix|bug|refactor|docs: <summary>`.
- Add a 3-5 line body for non-trivial commits describing the functional change.
- Keep the core engine renderer-agnostic.
- Treat unsupported styles and invalid nodes as explicit errors.

## Chunk 0: OSS foundation and design lock

### Task 0: Lock public project rules and MVP contracts

**Files:**
- Create: `CONTRIBUTING.md`
- Create: `CODE_OF_CONDUCT.md`
- Create: `docs/architecture/measurement-profile.md`
- Create: `docs/architecture/style-subset.md`
- Create: `docs/architecture/error-model.md`
- Modify: `README.md`

- [ ] **Step 1: Write the failing documentation checklist**

List the missing OSS governance and API-contract artifacts required before implementation starts.

- [ ] **Step 2: Review the checklist and confirm gaps**

Expected: the project is missing governance docs, contract definitions, and a README that reflects the approved product scope.

- [ ] **Step 3: Write minimal implementation**

Document English-only contribution rules, modular commit rules, the measurement profile, the supported style subset, the public error model, and the approved README intro.

- [ ] **Step 4: Re-read the docs to verify consistency**

- [ ] **Step 5: Commit**

## Chunk 1: Workspace and package scaffold

### Task 1: Establish the monorepo and core package boundaries

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `packages/flowtext/package.json`
- Create: `packages/flowtext/src/index.ts`
- Create: `packages/flowtext/src/types.ts`
- Test: `packages/flowtext/src/types.test.ts`

- [ ] **Step 1: Write the failing test**

Define tests for valid input and output node shapes, explicit style subset handling, and root constraint handling.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/flowtext/src/types.test.ts`
Expected: FAIL because the package contracts do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Add `FlowtextNode`, `LayoutConstraints`, `FlowtextLayoutResult`, public error codes, and the schema version field.

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

## Chunk 2: Yoga-backed structural layout

### Task 2: Build node normalization and Yoga tree creation

**Files:**
- Create: `packages/flowtext/src/normalize.ts`
- Create: `packages/flowtext/src/yoga-tree.ts`
- Test: `packages/flowtext/src/yoga-tree.test.ts`

- [ ] **Step 1: Write the failing test**

Cover nested view nodes and structural layout constraints. Keep `inline` either unsupported or normalized according to the locked MVP decision.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/flowtext/src/yoga-tree.test.ts`
Expected: FAIL because Yoga integration is not implemented.

- [ ] **Step 3: Write minimal implementation**

Normalize input nodes and create Yoga nodes for non-text structure.

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

## Chunk 3: Pretext measurement bridge

### Task 3: Connect text nodes to Pretext measurement

**Files:**
- Create: `packages/flowtext/src/text-measure.ts`
- Modify: `packages/flowtext/src/yoga-tree.ts`
- Test: `packages/flowtext/src/text-measure.test.ts`

- [ ] **Step 1: Write the failing test**

Cover a width-constrained text node that wraps to multiple lines under a fixed font profile.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/flowtext/src/text-measure.test.ts`
Expected: FAIL because the text measurement callback is missing.

- [ ] **Step 3: Write minimal implementation**

Use Pretext to measure text and return width, height, and line data for Yoga integration. Keep a clean adapter boundary and explicit invalidation inputs.

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

## Chunk 4: Unified layout result assembly

### Task 4: Produce public layout results

**Files:**
- Create: `packages/flowtext/src/layout-tree.ts`
- Modify: `packages/flowtext/src/index.ts`
- Test: `packages/flowtext/src/layout-tree.test.ts`

- [ ] **Step 1: Write the failing test**

Verify that a mixed view and text tree produces stable result frames and lines within a documented measurement profile.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/flowtext/src/layout-tree.test.ts`
Expected: FAIL because final assembly is missing.

- [ ] **Step 3: Write minimal implementation**

Assemble Yoga results and text line data into the public result tree, including overflow, baseline, and limitations fields where supported by the locked contract.

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

## Chunk 5: Validation and public errors

### Task 5: Add explicit validation and unsupported-feature errors

**Files:**
- Create: `packages/flowtext/src/validate.ts`
- Test: `packages/flowtext/src/validate.test.ts`

- [ ] **Step 1: Write the failing test**

Cover invalid node structures, unsupported styles, and measurement failures.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/flowtext/src/validate.test.ts`
Expected: FAIL because validation is missing.

- [ ] **Step 3: Write minimal implementation**

Throw explicit, typed errors for invalid inputs, unsupported features, and measurement failures.

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

## Chunk 6: Thin browser demo

### Task 6: Build a minimal browser demo

**Files:**
- Create: `apps/demo/src/main.ts`
- Create: `apps/demo/src/examples/basic-tree.ts`
- Test: `apps/demo/src/main.test.ts`

- [ ] **Step 1: Write the failing test**

Verify the demo renders a sample tree using engine output.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test apps/demo/src/main.test.ts`
Expected: FAIL because the demo is not implemented.

- [ ] **Step 3: Write minimal implementation**

Render a simple visualization of node frames and wrapped text using engine output without introducing renderer-specific behavior into the core package.

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

## Chunk 7: Documentation and examples

### Task 7: Document the public API and sample usage

**Files:**
- Modify: `README.md`
- Create: `docs/api.md`
- Create: `docs/examples-smoke.md`

- [ ] **Step 1: Write the usage example first**

Document one minimal input tree and the resulting output shape.

- [ ] **Step 2: Run a smoke check on the example**

Run: `pnpm test` or the nearest docs validation step available.
Expected: PASS with the documented example matching the real API.

- [ ] **Step 3: Write minimal documentation**

Document purpose, constraints, supported styles, measurement profile limits, commit policy, and example integration flow.

- [ ] **Step 4: Re-run checks**

- [ ] **Step 5: Commit**
