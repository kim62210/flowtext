# Demo Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Flowtext의 핵심 가치를 인터랙티브하게 보여주는 하이브리드 데모(플레이그라운드 + 쇼케이스)를 구축한다.

**Architecture:** Vanilla TS + Vite 기반 2-column SPA. 좌측 JSON 에디터/프로퍼티 패널, 우측 SVG/Canvas/ASCII 3개 렌더러 동시 표시. EventTarget 기반 상태 관리로 단일 `FlowtextNode`를 편집하면 `layoutTree()` 호출 후 3개 렌더러가 동시 업데이트.

**Tech Stack:** TypeScript, Vite, CodeMirror 6, Flowtext (yoga-layout + @chenglou/pretext)

**Spec:** `docs/superpowers/specs/2026-04-02-demo-redesign-design.md`

---

## Chunk 1: Foundation (프로젝트 구조 + 상태 관리 + 기본 렌더링)

### Task 1: 데모 프로젝트 의존성 설정

**Files:**
- Modify: `apps/demo/package.json` (없으면 생성)
- Modify: `apps/demo/index.html`
- Create: `apps/demo/vite.config.ts`
- Modify: `package.json:6-12` (루트 스크립트 추가)

- [ ] **Step 1: apps/demo/package.json 생성**

```json
{
  "name": "@flowtext/demo",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "vite": "^6.3.0"
  },
  "dependencies": {
    "flowtext": "workspace:*",
    "codemirror": "^6.0.1",
    "@codemirror/lang-json": "^6.0.1",
    "@codemirror/view": "^6.36.0",
    "@codemirror/state": "^6.5.0"
  }
}
```

Note: `pnpm-workspace.yaml`에 `apps/*`가 이미 등록되어 있으므로 workspace 멤버 등록은 불필요.

- [ ] **Step 2: vite.config.ts 생성**

```typescript
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  resolve: {
    alias: {
      flowtext: resolve(__dirname, '../../packages/flowtext/src'),
    },
  },
  build: {
    outDir: 'dist',
  },
});
```

`flowtext` alias로 `import { layoutTree } from 'flowtext'` 형태의 깔끔한 import 사용. 상대경로 4단계 import 제거.

- [ ] **Step 3: 루트 package.json에 데모 스크립트 추가**

`package.json`의 scripts에 추가:
```json
"demo:dev": "pnpm --filter @flowtext/demo dev",
"demo:build": "pnpm --filter @flowtext/demo build"
```

- [ ] **Step 4: pnpm install 실행**

Run: `cd apps/demo && pnpm install`
Expected: node_modules 생성, lockfile 업데이트

- [ ] **Step 5: 개발 서버 구동 확인**

Run: `cd apps/demo && pnpm dev`
Expected: Vite dev server 시작, localhost URL 출력

- [ ] **Step 6: Commit**

---

### Task 2: Renderer 인터페이스 + SVG Renderer

**Files:**
- Create: `apps/demo/src/renderers/types.ts`
- Create: `apps/demo/src/renderers/svg-renderer.ts`

- [ ] **Step 1: Renderer 인터페이스 정의**

```typescript
// renderers/types.ts
import type { FlowtextLayoutResult } from 'flowtext';

export interface ViewportSize {
  width: number;
  height: number;
}

export interface Renderer {
  render(result: FlowtextLayoutResult, viewport: ViewportSize): void;
  mount(container: HTMLElement): void;
  dispose(): void;
}

export function computeScale(result: FlowtextLayoutResult, viewport: ViewportSize): number {
  const scaleX = viewport.width / result.width;
  const scaleY = viewport.height / result.height;
  return Math.min(scaleX, scaleY, 1); // 1 이하만 축소, 확대는 안 함
}

/**
 * rAF 래핑은 렌더러 내부가 아닌 호출부(state -> renderer 연결)에서 담당.
 * state의 result-change 이벤트 핸들러에서 requestAnimationFrame으로 감싸서
 * 3개 렌더러의 render()를 한 프레임에 배치한다.
 */
```

- [ ] **Step 2: SVG Renderer 구현**

기존 `apps/demo/src/main.ts`의 `renderNode`를 확장하여 `Renderer` 인터페이스를 구현하는 클래스로 작성.

핵심 로직:
- `mount()`: SVG 컨테이너 요소 생성 + container에 append
- `render()`: `computeScale()`로 축소 비율 계산, `<svg>` viewBox 설정, 노드별 `<rect>` + `<text>` 생성
- `dispose()`: SVG 요소 제거
- 색상: indigo 계열 (#818cf8 border, #faf5ff bg)
- 노드 ID 라벨 표시 (8px, 상단 좌측)

- [ ] **Step 3: SVG Renderer 단독 테스트**

임시 `main.ts`에서 SVG Renderer를 마운트하고 하드코딩된 `FlowtextLayoutResult`로 렌더링 확인.

Run: `pnpm demo:dev` -> 브라우저에서 SVG 렌더링 확인
Expected: indigo 색상의 rect + text가 보임

- [ ] **Step 4: Commit**

---

### Task 3: Canvas Renderer

**Files:**
- Create: `apps/demo/src/renderers/canvas-renderer.ts`

- [ ] **Step 1: Canvas Renderer 구현**

핵심 로직:
- `mount()`: `<canvas>` 요소 생성, devicePixelRatio 대응 (CSS 크기 != canvas 해상도)
- `render()`: `computeScale()`로 축소 비율 계산, `ctx.scale()` 적용, `strokeRect` + `fillText`
- `dispose()`: canvas 요소 제거
- 색상: amber 계열 (#d97706 border, #fef3c7 bg)
- 재귀적으로 children 렌더링
- 텍스트 lines 렌더링: `fillText`로 각 라인의 x, y 위치에 텍스트 출력

- [ ] **Step 2: Canvas Renderer 단독 테스트**

SVG Renderer와 동일한 `FlowtextLayoutResult`로 나란히 렌더링 확인.

Run: `pnpm demo:dev` -> 브라우저에서 SVG + Canvas 나란히 확인
Expected: amber 색상 canvas가 SVG와 동일한 레이아웃 표시

- [ ] **Step 3: Commit**

---

### Task 4: ASCII Renderer

**Files:**
- Create: `apps/demo/src/renderers/ascii-renderer.ts`

- [ ] **Step 1: ASCII Renderer 구현**

핵심 로직:
- `mount()`: `<pre>` 요소 생성, 다크 배경(#0f172a) + 그린 텍스트(#4ade80) 스타일
- `render()`: 2D 문자 그리드 생성 (result.width / charWidth x result.height / charHeight 크기)
  - view 노드: `+--+`, `|  |` box-drawing 문자로 테두리
  - text 노드: 텍스트 라인을 해당 위치에 삽입
  - 중첩 깊이 3단계 제한 (그 이상은 `...`으로 표시)
- `dispose()`: pre 요소 제거
- 문자 크기 기준: charWidth = 7px, charHeight = 14px (monospace 기준)
- `computeScale()`에 따라 그리드 크기 조정

- [ ] **Step 2: ASCII Renderer 단독 테스트**

Run: `pnpm demo:dev` -> 브라우저에서 SVG + Canvas + ASCII 나란히 확인
Expected: box-drawing 문자로 동일 레이아웃 표시

- [ ] **Step 3: Commit**

---

### Task 5: State Manager

**Files:**
- Create: `apps/demo/src/state.ts`

- [ ] **Step 1: DemoState 클래스 구현**

```typescript
import { layoutTree, type FlowtextNode, type FlowtextLayoutResult, type LayoutConstraints } from 'flowtext';

export class DemoState extends EventTarget {
  private node: FlowtextNode;
  private constraints: LayoutConstraints;
  private result: FlowtextLayoutResult | null = null;
  private nodeIndex = new Map<string, FlowtextNode>();
  private selectedNodeId: string | null = null;
  private layoutTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(node: FlowtextNode, constraints: LayoutConstraints) { ... }

  getNode(): FlowtextNode { ... }
  setNode(node: FlowtextNode): void { ... }  // 인덱스 재구축 + node-change 이벤트
  updateStyle(nodeId: string, key: string, value: string | number | undefined): void { ... } // O(1) 인덱스 접근, FlowtextStyle 값 타입에 맞춤
  updateText(nodeId: string, text: string): void { ... }
  getResult(): FlowtextLayoutResult | null { ... }
  getSelectedNodeId(): string | null { ... }
  setSelectedNodeId(id: string): void { ... } // selection-change 이벤트

  private buildIndex(node: FlowtextNode): void { ... } // 재귀적 Map 구축
  private scheduleLayout(): void {
    // debounce 30ms. setTimeout 콜백 안에서 async IIFE 사용:
    // clearTimeout(this.layoutTimer);
    // this.layoutTimer = setTimeout(() => {
    //   layoutTree(this.node, this.constraints)
    //     .then(result => { this.result = result; this.dispatchEvent(new CustomEvent('result-change')); })
    //     .catch(error => { this.dispatchEvent(new CustomEvent('layout-error', { detail: error })); });
    // }, 30);
    // -- Promise.then/catch로 에러 핸들링, await 불필요
  }
  setConstraints(constraints: LayoutConstraints): void { ... }
}
```

- [ ] **Step 2: State 변경 -> 렌더러 연결 테스트**

main.ts에서 DemoState 생성 + 3개 렌더러 마운트 + `result-change` 이벤트로 렌더러 업데이트 연결.
`setTimeout`으로 2초 후 `updateStyle('root', 'padding', 32)` 호출하여 3개 렌더러 동시 업데이트 확인.

Run: `pnpm demo:dev`
Expected: 2초 후 padding이 변경되며 3개 렌더러 동시 업데이트

- [ ] **Step 3: Commit**

---

### Task 6: Presets

**Files:**
- Create: `apps/demo/src/presets/index.ts`
- Create: `apps/demo/src/presets/playground.ts`
- Create: `apps/demo/src/presets/text-reflow.ts`
- Create: `apps/demo/src/presets/og-image.ts`

- [ ] **Step 1: Preset 인터페이스 + 레지스트리**

```typescript
// presets/index.ts
import type { FlowtextNode, LayoutConstraints } from 'flowtext';

export interface Preset {
  id: string;
  label: string;
  description: string;
  node: FlowtextNode;
  constraints: LayoutConstraints;
  initialSelectedNodeId: string;
}

export { playgroundPreset } from './playground';
export { textReflowPreset } from './text-reflow';
export { ogImagePreset } from './og-image';

export const presets: Preset[] = [playgroundPreset, textReflowPreset, ogImagePreset];
```

- [ ] **Step 2: Playground 프리셋**

```typescript
// presets/playground.ts
export const playgroundPreset: Preset = {
  id: 'playground',
  label: 'Playground',
  description: 'Flex layout with nested containers',
  node: {
    id: 'root',
    type: 'view',
    style: { width: 400, height: 300, padding: 16, flexDirection: 'column' },
    children: [
      {
        id: 'header',
        type: 'view',
        style: { height: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 8 },
        children: [
          { id: 'logo', type: 'text', text: 'Flowtext', style: { fontFamily: 'sans-serif', fontSize: 14, lineHeight: 20 } },
          { id: 'nav', type: 'text', text: 'Docs | GitHub', style: { fontFamily: 'sans-serif', fontSize: 12, lineHeight: 16 } },
        ],
      },
      {
        id: 'body',
        type: 'view',
        style: { flexGrow: 1, padding: 12 },
        children: [
          { id: 'content', type: 'text', text: 'Flowtext computes layout without the DOM. Change any property to see all three renderers update simultaneously.', style: { fontFamily: 'sans-serif', fontSize: 14, lineHeight: 20 } },
        ],
      },
    ],
  },
  constraints: { width: 400, height: 300 },
  initialSelectedNodeId: 'root',
};
```

- [ ] **Step 3: Text Reflow 프리셋**

```typescript
// presets/text-reflow.ts
export const textReflowPreset: Preset = {
  id: 'text-reflow',
  label: 'Text Reflow',
  description: 'Resize the container to see text reflow in real time',
  node: {
    id: 'container',
    type: 'view',
    style: { width: 400, height: 400, padding: 20, flexDirection: 'column' },
    children: [
      {
        id: 'paragraph',
        type: 'text',
        text: 'Flowtext computes layout without the DOM. It combines Yoga for structural flexbox layout with Pretext for paragraph measurement and line extraction. This means you can render text-heavy interfaces in Canvas, WebGL, SVG, or server-side image generation -- all without relying on browser measurement APIs. Try dragging the width slider to see how this paragraph reflows.',
        style: { fontFamily: 'sans-serif', fontSize: 16, lineHeight: 24 },
      },
    ],
  },
  constraints: { width: 400, height: 400 },
  initialSelectedNodeId: 'container',
};
```

- [ ] **Step 4: OG Image 프리셋**

```typescript
// presets/og-image.ts
export const ogImagePreset: Preset = {
  id: 'og-image',
  label: 'OG Image',
  description: 'Server-side social media image layout (1200x630)',
  node: {
    id: 'card',
    type: 'view',
    style: { width: 1200, height: 630, padding: 60, flexDirection: 'column', justifyContent: 'space-between' },
    children: [
      {
        id: 'top-bar',
        type: 'view',
        style: { flexDirection: 'row', alignItems: 'center' },
        children: [
          { id: 'brand', type: 'text', text: 'flowtext.dev', style: { fontFamily: 'sans-serif', fontSize: 24, lineHeight: 32 } },
        ],
      },
      {
        id: 'title',
        type: 'text',
        text: 'DOM-Free Layout for Canvas, WebGL, and Server-Side Rendering',
        style: { fontFamily: 'sans-serif', fontSize: 56, lineHeight: 68, fontWeight: 700 },
      },
      {
        id: 'footer',
        type: 'view',
        style: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        children: [
          { id: 'author', type: 'text', text: 'by @kim62210', style: { fontFamily: 'sans-serif', fontSize: 20, lineHeight: 28 } },
          { id: 'date', type: 'text', text: 'April 2026', style: { fontFamily: 'sans-serif', fontSize: 20, lineHeight: 28 } },
        ],
      },
    ],
  },
  constraints: { width: 1200, height: 630 },
  initialSelectedNodeId: 'title',
};
```

- [ ] **Step 5: Commit**

---

## Chunk 2: UI Shell (레이아웃 + 헤더 + 탭)

### Task 7: HTML Shell + CSS + 2-Column Layout

**Files:**
- Modify: `apps/demo/index.html`
- Create: `apps/demo/src/styles.css`

- [ ] **Step 1: index.html을 풀스크린 데모 레이아웃으로 교체**

기존 `<script type="module" src="./src/browser.ts">`를 `<script type="module" src="./src/main.ts">`로 변경.
styles.css import: `<link rel="stylesheet" href="./src/styles.css">`

구조:
```html
<body>
  <header id="demo-header">
    <span class="logo">~ flowtext</span>
    <nav id="preset-tabs"></nav>
    <div class="header-right">
      <span class="version">v0.1.0</span>
      <a href="https://github.com/kim62210/flowtext" class="github-link">GitHub</a>
    </div>
  </header>
  <main id="demo-main">
    <aside id="editor-panel">
      <div id="editor-tabs"></div>
      <div id="editor-content"></div>
    </aside>
    <section id="renderer-panel">
      <div id="renderer-labels"></div>
      <div id="renderers"></div>
    </section>
  </main>
  <div id="loading-overlay">Loading layout engine...</div>
</body>
```

- [ ] **Step 2: styles.css 작성 -- CSS 변수(디자인 토큰) 우선 정의**

`:root`에 디자인 토큰 정의 (이후 모든 컴포넌트/렌더러에서 `var()` 참조):
```css
:root {
  --color-header-bg: #0f172a;
  --color-content-bg: #f8fafc;
  --color-editor-bg: #1e1e2e;
  --color-primary: #6366f1;
  --color-svg-accent: #818cf8;
  --color-canvas-accent: #d97706;
  --color-ascii-accent: #10b981;
  --color-border: #e2e8f0;
  --color-text-primary: #0f172a;
  --color-text-secondary: #64748b;
  --font-ui: 'Inter', system-ui, sans-serif;
  --font-code: 'JetBrains Mono', 'Fira Code', monospace;
  --spacing-unit: 8px;
}
```

핵심 스타일:
- 풀 viewport (100dvh, 100vw), overflow hidden
- 다크 헤더 (var(--color-header-bg)), 라이트 컨텐츠 (var(--color-content-bg))
- 2-column: editor-panel 380px 고정, renderer-panel flex: 1
- 렌더러 3열 grid (1fr 1fr 1fr), gap 12px
- loading-overlay: 중앙 정렬, 반투명 배경, "Loading layout engine..." 텍스트
- error-overlay: 빨간 테두리, 반투명 배경
- 반응형은 Task 14에서 별도 추가

- [ ] **Step 3: 정적 레이아웃 확인**

Run: `pnpm demo:dev`
Expected: 다크 헤더 + 좌우 2-column 레이아웃 빈 shell 표시

- [ ] **Step 4: Commit**

---

### Task 8: 탭 UI 컴포넌트

**Files:**
- Create: `apps/demo/src/ui/tabs.ts`

- [ ] **Step 1: 범용 탭 컴포넌트 구현**

```typescript
interface TabConfig {
  id: string;
  label: string;
}

export function createTabs(
  container: HTMLElement,
  tabs: TabConfig[],
  onSelect: (id: string) => void,
  initialId?: string,
): { setActive(id: string): void } { ... }
```

- 클릭 시 active 클래스 토글 + onSelect 콜백
- 프리셋 탭 (헤더), 에디터 탭 (JSON/Properties) 양쪽에서 재사용

- [ ] **Step 2: 프리셋 탭을 헤더에 마운트**

main.ts에서 `createTabs`를 `#preset-tabs`에 마운트. 프리셋 전환 시 `DemoState.setNode()` 호출.

- [ ] **Step 3: 에디터 탭을 좌측 패널에 마운트**

`#editor-tabs`에 JSON / Properties 탭 마운트. 탭 전환 시 에디터 content 영역 전환.

- [ ] **Step 4: Commit**

---

### Task 9: Main 앱 초기화 + 전체 연결 + 레거시 정리

**Files:**
- Modify: `apps/demo/src/main.ts` (전체 교체)
- Delete: `apps/demo/src/browser.ts` (index.html이 Task 7에서 main.ts로 전환되었으므로 안전)
- Delete: `apps/demo/src/examples/basic-tree.ts` (프리셋으로 대체됨)

- [ ] **Step 1: main.ts 앱 초기화 로직 작성**

```typescript
// 초기화 시퀀스:
// 1. loading overlay 표시
// 2. DemoState 생성 (playground 프리셋)
// 3. 3개 렌더러 마운트 + result-change 구독
// 4. 프리셋 탭 마운트 + 전환 연결
// 5. 에디터 탭 마운트
// 6. 첫 layoutTree() 호출 (Yoga WASM 초기화)
// 7. loading overlay 제거
// 8. 에러 시 에러 overlay 표시
```

- [ ] **Step 2: 프리셋 전환 -> 렌더러 업데이트 E2E 확인**

Run: `pnpm demo:dev`
Expected: Playground 프리셋으로 3개 렌더러 동시 표시. 프리셋 탭 클릭 시 전환.

- [ ] **Step 3: Commit**

---

## Chunk 3: JSON Editor (CodeMirror 6 통합)

### Task 10: CodeMirror 6 JSON 에디터

**Files:**
- Create: `apps/demo/src/editor/json-editor.ts`

- [ ] **Step 1: CodeMirror 6 에디터 래퍼 구현**

```typescript
export async function createJsonEditor(
  container: HTMLElement,
  initialValue: string,
  onChange: (value: string) => void,
): Promise<{ setValue(json: string): void; dispose(): void }> { ... }
```

핵심:
- `codemirror`, `@codemirror/lang-json` 동적 import
- JSON 구문 강조, 라인 넘버
- Catppuccin Mocha 테마 (직접 CSS 또는 `@codemirror/theme-one-dark` 커스텀)
- `onChange` 콜백: JSON.parse 성공 시만 호출, 실패 시 lint 에러 표시
- `setValue()`: 외부 상태 변경 시 에디터 동기화 (dispatch 중 onChange 발화 방지)

- [ ] **Step 2: DemoState와 양방향 연결**

main.ts에서:
- 에디터 onChange -> `state.setNode(JSON.parse(value))` (try/catch로 parse 에러 무시)
- state의 `node-change` -> `editor.setValue(JSON.stringify(state.getNode(), null, 2))`
- 무한 루프 방지: 업데이트 출처 추적 플래그

- [ ] **Step 3: JSON 편집 -> 3개 렌더러 동시 업데이트 E2E 확인**

Run: `pnpm demo:dev`
Expected: JSON에서 padding 값 변경 시 3개 렌더러 실시간 업데이트

- [ ] **Step 4: Commit**

---

## Chunk 4: Property Panel

### Task 11: 슬라이더 UI 컴포넌트

**Files:**
- Create: `apps/demo/src/ui/slider.ts`

- [ ] **Step 1: 범위 슬라이더 + 숫자 입력 컴포넌트**

```typescript
export function createSlider(
  container: HTMLElement,
  config: { label: string; min: number; max: number; step: number; value: number },
  onChange: (value: number) => void,
): { setValue(v: number): void; dispose(): void } { ... }
```

- `<input type="range">` + `<input type="number">` 연동
- 양쪽 입력이 서로 동기화
- CSS: 슬라이더 트랙 + 썸 커스텀 (indigo accent)

- [ ] **Step 2: Commit**

---

### Task 12: Property Panel

**Files:**
- Create: `apps/demo/src/editor/property-panel.ts`

- [ ] **Step 1: 노드 트리 + 프로퍼티 편집 패널 구현**

```typescript
export function createPropertyPanel(
  container: HTMLElement,
  state: DemoState,
): { dispose(): void } { ... }
```

구성:
1. **노드 트리 뷰** (상단): 트리 구조를 들여쓰기로 표시, 클릭으로 노드 선택
2. **프로퍼티 에디터** (하단): 선택 노드의 스타일을 타입별로 렌더링
   - 숫자: createSlider() 사용 (width 0-2000, padding 0-100, fontSize 8-72 등)
   - Enum: `<select>` 또는 세그먼트 버튼 (flexDirection, justifyContent 등)
   - 텍스트: `<input type="text">` (fontFamily, text)

- [ ] **Step 2: DemoState와 양방향 연결**

- 프로퍼티 변경 -> `state.updateStyle(nodeId, key, value)` 또는 `state.updateText(nodeId, text)`
- `state.node-change` -> 패널 UI 갱신
- `state.selection-change` -> 선택 노드의 프로퍼티 표시

- [ ] **Step 3: JSON 에디터와 동기화 확인**

Run: `pnpm demo:dev`
Expected: 슬라이더로 padding 변경 -> JSON 에디터 값 동기화 -> 3개 렌더러 업데이트

- [ ] **Step 4: Commit**

---

## Chunk 5: Error Handling + Polish

### Task 13: 에러 처리

**Files:**
- Modify: `apps/demo/src/state.ts`
- Modify: `apps/demo/src/main.ts`
- Modify: `apps/demo/src/styles.css`

- [ ] **Step 0: flowtext 라이브러리에 FlowtextError re-export 추가**

`packages/flowtext/src/index.ts`에 추가:
```typescript
export { FlowtextError } from './validate';
```
이후 데모에서 `import { FlowtextError } from 'flowtext'`로 사용 가능. 라이브러리 public API 확장이므로 별도 커밋.

- [ ] **Step 1: layoutTree 에러 -> 오버레이 표시**

state.ts의 `scheduleLayout()` .catch에서:
- 성공: `result-change` 이벤트 발행
- 실패: `layout-error` 이벤트 발행 (에러 코드 + 메시지 + 수정 힌트)
- 렌더러 영역에 에러 오버레이 표시, 마지막 성공 결과는 반투명 유지

에러 힌트 매핑 로직:
```typescript
function formatErrorHint(error: unknown): string {
  if (error instanceof FlowtextError) {
    switch (error.code) {
      case 'UNSUPPORTED_STYLE':
        return `${error.message}\nSupported: flexDirection, justifyContent, alignItems, width, height, padding, margin, fontSize, lineHeight, ...`;
      case 'INVALID_NODE':
        return `${error.message}\nSupported node types: "view", "text". Each node must have "id" and "type".`;
      case 'MEASURE_FAILED':
        return `${error.message}\nCheck that text nodes have valid fontSize and fontFamily.`;
    }
  }
  return String(error);
}
```

- [ ] **Step 2: JSON parse 에러 배지**

json-editor.ts에서 parse 실패 시 에디터 상단에 "Invalid JSON" 배지 표시.

- [ ] **Step 3: 첫 로드 실패 핸들링**

main.ts 초기화에서 catch:
- Yoga WASM 실패: 에러 메시지 + 새로고침 버튼
- CodeMirror 실패: `<textarea>` fallback

- [ ] **Step 4: Commit**

---

### Task 14: 반응형 대응

**Files:**
- Modify: `apps/demo/src/styles.css`
- Modify: `apps/demo/src/ui/layout.ts` (필요 시 생성)

- [ ] **Step 1: Tablet 브레이크포인트 (768-1023px)**

CSS media query:
- 2-column -> 세로 스택 (editor 상단 50%, renderers 하단 50%)
- 렌더러 3열 유지

- [ ] **Step 2: Mobile 브레이크포인트 (< 768px)**

CSS media query:
- main을 단일 컬럼, 각 패널 100% 너비
- `.mobile-hidden` 클래스로 비활성 패널 숨김

JS (`ui/layout.ts` 생성):
```typescript
export function setupMobileLayout(
  editorPanel: HTMLElement,
  rendererContainers: HTMLElement[], // [svg, canvas, ascii]
): { dispose(): void } { ... }
```
- `matchMedia('(max-width: 767px)')` 리스너로 모바일 감지
- 모바일일 때: 하단에 4개 탭 (Editor / SVG / Canvas / ASCII) 생성 -- `createTabs()` 재사용
- 탭 클릭 시 해당 패널만 표시, 나머지 `.mobile-hidden`
- 데스크탑 복귀 시: 모든 패널 표시, 모바일 탭 제거

- [ ] **Step 3: Commit**

---

### Task 15: 기존 테스트 정리 + 빌드 확인

**Files:**
- Modify: `apps/demo/src/main.test.ts` (기존 테스트 업데이트 또는 제거)
- Modify: `apps/demo/src/browser.test.ts` (제거)

- [ ] **Step 1: 기존 데모 테스트 삭제**

`apps/demo/src/main.test.ts`와 `apps/demo/src/browser.test.ts`를 삭제한다.
이유: 기존 테스트는 `renderDemoSvg()` 함수와 `browser.ts` 진입점 기준이며, 두 파일 모두 Task 9에서 삭제/교체되었다. 새 데모는 인터랙티브 SPA이므로 단위 테스트보다 E2E 수동 검증이 적합하다.

- [ ] **Step 2: 전체 빌드 확인**

Run: `pnpm check`
Expected: 테스트 통과, 타입 체크 통과, 빌드 성공

- [ ] **Step 3: Vite build -> 정적 파일 확인**

Run: `pnpm demo:build && ls apps/demo/dist/`
Expected: index.html + assets/ 생성

- [ ] **Step 4: 성능 검증 (수동)**

Run: `pnpm demo:dev` -> 브라우저 DevTools Performance 탭
- 프로퍼티 슬라이더 조작 시 프레임 타이밍 확인
- 목표: 슬라이더 조작 -> 렌더러 업데이트 < 50ms (Yoga WASM 초기화 이후)
- 프리셋 전환 시 전체 렌더링 < 100ms

- [ ] **Step 5: `vite preview`로 정적 빌드 서빙 확인**

Run: `pnpm demo:build && pnpm --filter @flowtext/demo preview`
Expected: 프로덕션 빌드가 로컬 서버에서 정상 동작 (GitHub Pages 배포 가능성 검증)

- [ ] **Step 6: Commit**

---

## Chunk 6: Deployment + README

### Task 16: GitHub Pages 배포 설정

**Files:**
- Create: `.github/workflows/demo.yml` (선택적 -- 수동 배포도 가능)

- [ ] **Step 1: GitHub Actions workflow 작성 (선택)**

push to main -> pnpm demo:build -> deploy to gh-pages branch.
또는 수동: `pnpm demo:build` -> `gh-pages -d apps/demo/dist`.

- [ ] **Step 2: Commit**

---

### Task 17: README 업데이트

**Files:**
- Modify: `README.md`

- [ ] **Step 1: README에 데모 섹션 업데이트**

기존 Demo 섹션을 확장:
- 라이브 데모 링크 (GitHub Pages URL)
- 데모 스크린샷 또는 설명
- `pnpm demo:dev`로 로컬 실행 안내

- [ ] **Step 2: Commit**
