# Flowtext Interactive Demo Redesign

## Overview

Flowtext의 핵심 가치(DOM-free, renderer-agnostic layout engine)를 개발자에게 직관적으로 전달하는 인터랙티브 데모를 구축한다. 현재의 정적 SVG 단일 렌더링을 **라이브 플레이그라운드 + 쇼케이스 프리셋** 하이브리드 데모로 교체한다.

## Problem

현재 데모(`apps/demo/`)의 문제:

- 320x240 고정 크기 SVG 하나만 렌더링
- 텍스트 노드 1개짜리 단순 트리 -- flexbox 레이아웃 능력을 보여주지 못함
- 인터랙션 전혀 없음 (정적 SVG)
- "renderer-agnostic" 핵심 메시지를 전달하지 못함
- 라이브러리를 평가하러 온 개발자가 능력을 판단할 수 없음

## Goals

1. **1초 이내에 핵심 가치 전달**: 같은 레이아웃 트리가 SVG/Canvas/ASCII로 동시 렌더링되는 장면
2. **직접 체험 가능**: JSON 편집 + 프로퍼티 슬라이더로 실시간 레이아웃 변경
3. **실용적 유스케이스 시연**: OG 이미지 생성, 텍스트 리플로우 등 실제 시나리오
4. **프레임워크 무관 철학 강화**: 데모 자체가 Vanilla TS로 구현

## Non-Goals

- React/Vue 등 프레임워크 사용
- 드래그앤드롭 비주얼 빌더
- 서버사이드 렌더링 실제 구현 (시뮬레이션만)
- 모바일 최적화 (기본 반응형만 제공, 데스크탑 우선)
- 커스텀 `TextMeasurementAdapter` 노출 (기본 Pretext 어댑터만 사용)

---

## Architecture

### Tech Stack

| 항목 | 선택 | 이유 |
|---|---|---|
| 언어 | TypeScript (strict) | 라이브러리와 동일 |
| 번들러 | Vite | 기존 모노레포 호환, HMR |
| 코드 에디터 | CodeMirror 6 | Vanilla TS 궁합, 경량, JSON 모드 |
| 상태 관리 | EventTarget + CustomEvent | 프레임워크 없이 pub/sub |
| 스타일 | CSS (단일 파일) | 빌드 도구 불필요 |
| 배포 | GitHub Pages (Vite static build) | 무료, 자동화 간단 |

### Layout

2-column 레이아웃:

```
+--------------------------------------------------+
| Header: Logo | [Playground] [Text Reflow] [OG]   |
+--------------------------------------------------+
| Left Panel (380px)  | Right Panel (flex: 1)       |
| +----------------+  | +--------+--------+-------+ |
| | [JSON] [Props] |  | |  SVG   | Canvas | ASCII | |
| |                |  | |        |        |       | |
| | (CodeMirror 6  |  | |        |        |       | |
| |  or Property   |  | |        |        |       | |
| |  sliders)      |  | |        |        |       | |
| +----------------+  | +--------+--------+-------+ |
+--------------------------------------------------+
```

- 좌측: JSON 에디터 / 프로퍼티 패널 탭 전환
- 우측: SVG, Canvas, ASCII 3개 렌더러 나란히
- 상단: 프리셋 탭 (Playground, Text Reflow, OG Image)

### Data Flow

```
JSON Editor <---> FlowtextNode (in-memory state) <---> Property Panel
                          |
                          | layoutTree(node, constraints)
                          | (debounce 30ms)
                          v
                  FlowtextLayoutResult
                    /     |     \
                   v      v      v
                 SVG   Canvas   ASCII
               renderer renderer renderer
```

1. 사용자가 JSON 편집 또는 프로퍼티 슬라이더 조작
2. `FlowtextNode` 상태 업데이트 + CustomEvent 발행
3. JSON 에디터 <-> 프로퍼티 패널 양방향 동기화
4. `layoutTree()` 비동기 호출 (debounce 30ms)
5. `FlowtextLayoutResult` 반환
6. 3개 렌더러에 동일 결과 전달, 각자 렌더링
7. 총 체감 지연: < 50ms (첫 호출 제외 -- Yoga WASM 초기화는 별도)

**첫 로드 시퀀스:**
1. HTML/CSS 로드 -> 에디터 skeleton + 렌더러 placeholder 표시
2. CodeMirror 6 동적 import (에디터 skeleton -> 실제 에디터 전환)
3. `layoutTree()` 첫 호출 -> Yoga WASM 초기화 (수백ms 소요 가능)
4. 초기화 완료 -> 3개 렌더러 동시 렌더링
5. 이후 편집은 debounce 30ms + layoutTree < 50ms

---

## Components

### 1. State Manager (`state.ts`)

`FlowtextNode`를 단일 상태로 관리하는 EventTarget 기반 모듈.

```typescript
interface DemoState extends EventTarget {
  getNode(): FlowtextNode;
  setNode(node: FlowtextNode): void;        // 전체 교체 (프리셋 전환)
  updateStyle(nodeId: string, key: string, value: string | number | undefined): void;  // 부분 업데이트
  updateText(nodeId: string, text: string): void;  // 텍스트 변경
  getResult(): FlowtextLayoutResult | null;
  getSelectedNodeId(): string | null;
  setSelectedNodeId(id: string): void;
}
```

- 내부에 `Map<string, FlowtextNode>` ID-to-node 인덱스를 유지하여 `updateStyle()` 시 트리 순회 없이 O(1) 접근
- `setNode()` 호출 시 인덱스 재구축
- `node-change` 이벤트: JSON 에디터, 프로퍼티 패널이 구독
- `result-change` 이벤트: 3개 렌더러가 구독
- `selection-change` 이벤트: 프로퍼티 패널이 구독 (선택 노드 변경)
- 상태 변경 시 `layoutTree()` 자동 호출 (debounce)

### 2. JSON Editor (`editor/json-editor.ts`)

CodeMirror 6 기반 JSON 편집기.

- JSON 구문 강조 + 자동 포맷팅
- 유효하지 않은 JSON일 때 에러 인라인 표시 (lint)
- 외부에서 상태 변경 시 에디터 내용 동기화 (무한 루프 방지)
- Catppuccin Mocha 테마

### 3. Property Panel (`editor/property-panel.ts`)

선택된 노드의 스타일을 GUI로 조절.

- **숫자 프로퍼티** (width, height, minWidth, maxWidth, minHeight, maxHeight, padding, margin, fontSize, lineHeight, flexGrow, flexShrink): 범위 슬라이더 + 숫자 입력
- **Enum 프로퍼티** (flexDirection, justifyContent, alignItems, alignSelf, fontWeight, whiteSpace): 세그먼트 버튼 / 드롭다운
- **텍스트 프로퍼티** (fontFamily, text): 텍스트 입력
- 노드 트리를 상단에 표시, 클릭으로 노드 선택 (DemoState의 `selectedNodeId`와 동기화)
- 지원되는 노드 타입은 `view`와 `text`만 -- 에디터 하단에 안내 표시

### 4. Renderers (`renderers/`)

공통 인터페이스:

```typescript
interface Renderer {
  render(result: FlowtextLayoutResult, viewport: ViewportSize): void;
  mount(container: HTMLElement): void;
  dispose(): void;
}

interface ViewportSize {
  width: number;   // 렌더러 컨테이너의 실제 픽셀 너비
  height: number;  // 렌더러 컨테이너의 실제 픽셀 높이
}
```

렌더러는 `result`의 크기가 `viewport`보다 클 경우 균등 축소(scale-to-fit)하여 표시한다. OG Image 프리셋(1200x630)에서 렌더러 컨테이너에 맞게 축소 표시되는 핵심 로직.

#### SVG Renderer
- 기존 `renderDemoSvg` 로직 확장
- 노드별 `<rect>` + 텍스트 `<text>` + 노드 ID 라벨
- 색상: indigo 계열 (border: #818cf8, bg: #faf5ff)

#### Canvas Renderer
- `CanvasRenderingContext2D` 사용
- `strokeRect` + `fillText`로 동일 레이아웃 렌더링
- 색상: amber 계열 (border: #d97706, bg: #fef3c7)
- devicePixelRatio 대응 (HiDPI)

#### ASCII Renderer
- box-drawing 문자로 레이아웃 시각화
- `+--+`, `|  |` 스타일
- `<pre>` 태그, 모노스페이스 폰트
- 다크 배경 + 그린 텍스트 (#4ade80 on #0f172a)

### 5. Presets (`presets/`)

각 프리셋은 `FlowtextNode` + `LayoutConstraints` + 메타 정보를 내보냄.

```typescript
interface Preset {
  id: string;
  label: string;
  description: string;
  node: FlowtextNode;
  constraints: LayoutConstraints;
  initialSelectedNodeId: string;  // 프리셋 전환 시 기본 선택 노드
}
```

#### Playground (기본)
- view(root) > view(header) + view(body) > text(content)
- 중첩 flex 구조로 flexDirection, padding, margin 등 다양한 프로퍼티 시연
- constraints: { width: 400, height: 300 }

#### Text Reflow
- view(container) > text(long paragraph)
- 긴 텍스트로 줄바꿈 시연
- 프로퍼티 패널에서 width 슬라이더가 핵심 인터랙션
- constraints: { width: 400, height: 400 }

#### OG Image
- view(1200x630) > view(top-bar) + text(title) + view(footer) > text(author) + text(date)
- 소셜 미디어 공유 이미지 레이아웃 시뮬레이션
- constraints: { width: 1200, height: 630 } (렌더러에서 축소 표시)

---

## Visual Design

### Color System

| 역할 | 값 |
|---|---|
| Header bg | #0f172a (slate-900) |
| Content bg | #f8fafc (slate-50) |
| Editor bg | #1e1e2e (Catppuccin Base) |
| Primary | #6366f1 (indigo-500) |
| SVG accent | #818cf8 (indigo-400) |
| Canvas accent | #d97706 (amber-600) |
| ASCII accent | #10b981 (emerald-500) |
| Border | #e2e8f0 (slate-200) |
| Text primary | #0f172a (slate-900) |
| Text secondary | #64748b (slate-500) |

### Typography

- UI: Inter / system-ui, 12-15px
- Code: JetBrains Mono / Fira Code / monospace
- 렌더러 라벨: 11px, 각 accent 색상, font-weight 600

### Spacing

- 8px 기본 단위
- 패널 내부 padding: 16px
- 렌더러 간 gap: 12px
- 섹션 간 margin: 24px

---

## Responsive Strategy

| Breakpoint | Layout |
|---|---|
| Desktop (>= 1024px) | 2-column: 에디터 380px 고정 / 렌더러 flex |
| Tablet (768-1023px) | 세로 스택: 에디터 상단 / 렌더러 3열 하단 |
| Mobile (< 768px) | 탭 전환: 에디터 / SVG / Canvas / ASCII 개별 뷰 |

---

## Performance

- `layoutTree()` 호출: debounce 30ms
- 렌더러 업데이트: requestAnimationFrame
- CodeMirror 6: 동적 import (lazy loading)
- Yoga WASM: 첫 렌더 시 1회 초기화, 이후 재사용
- Canvas: devicePixelRatio 대응, offscreen 없이 직접 렌더링

---

## File Structure

```
apps/demo/
  index.html
  src/
    main.ts              -- 앱 초기화, 이벤트 연결
    state.ts             -- FlowtextNode 상태 + layoutTree 호출
    editor/
      json-editor.ts     -- CodeMirror 6 래퍼
      property-panel.ts  -- GUI 프로퍼티 편집
    renderers/
      types.ts           -- Renderer 인터페이스
      svg-renderer.ts
      canvas-renderer.ts
      ascii-renderer.ts
    presets/
      index.ts           -- 프리셋 레지스트리
      playground.ts
      text-reflow.ts
      og-image.ts
    ui/
      tabs.ts            -- 프리셋/에디터 탭
      slider.ts          -- 범위 슬라이더 컴포넌트
      layout.ts          -- 2-column 레이아웃 관리
    styles.css           -- 전체 스타일시트
```

---

## Dependencies (추가)

| 패키지 | 용도 | 크기 (gzipped) |
|---|---|---|
| `@codemirror/lang-json` | JSON 구문 강조 + lint | ~15KB |
| `codemirror` | 에디터 코어 | ~45KB |
| `@codemirror/view` | 에디터 뷰 | 번들 포함 |
| `@codemirror/state` | 에디터 상태 | 번들 포함 |

기존 의존성(yoga-layout, @chenglou/pretext)은 라이브러리 코어에서 가져옴.

---

## Deployment

1. Vite build로 정적 파일 생성 (`apps/demo/dist/`)
2. GitHub Pages에 배포 (GitHub Actions 또는 수동)
3. README.md에 데모 링크 추가
4. `package.json`에 `demo:build`, `demo:dev` 스크립트 추가

---

## Error Handling

### JSON Parse Error
- 유효하지 않은 JSON 입력 시 CodeMirror lint로 인라인 에러 표시
- 렌더러는 마지막 성공 결과를 유지 (깜빡임 방지)
- 에디터 상단에 "Invalid JSON" 배지 표시

### layoutTree() 실패
- `FlowtextError` 발생 시 (INVALID_NODE, UNSUPPORTED_STYLE, MEASURE_FAILED):
  - 렌더러 영역에 에러 메시지를 오버레이로 표시 (에러 코드 + 설명)
  - 마지막 성공 결과는 반투명으로 유지 (맥락 보존)
  - 에러 해소 시 오버레이 자동 제거
- 에러 메시지는 수정 힌트를 포함: 예) "UNSUPPORTED_STYLE: 'gap'은 아직 지원되지 않습니다. 지원 속성 목록: ..."

### 첫 로드 실패
- Yoga WASM 로드 실패: "Layout engine failed to load. Please reload." 메시지 + 새로고침 버튼
- CodeMirror 로드 실패: 기본 `<textarea>` fallback (기능 제한 안내)

---

## Success Criteria

1. 페이지 로드 후 3개 렌더러가 동시에 레이아웃 표시
2. 프로퍼티 슬라이더 조작 시 < 50ms 내 3개 렌더러 동시 업데이트
3. JSON 편집 <-> 프로퍼티 패널 양방향 동기화
4. 3개 프리셋 간 즉시 전환
5. GitHub Pages에 정적 배포 가능
6. 외부 프레임워크 의존성 없음 (CodeMirror 제외)
