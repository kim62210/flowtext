export type Locale = 'en' | 'ko';

const messages: Record<string, Record<Locale, string>> = {
  // Hero
  'hero.eyebrow': {
    en: 'Demos',
    ko: 'Demos',
  },
  'hero.tagline': {
    en: 'DOM-free layout for Canvas, WebGL, SVG, and server-side rendering. One layout tree, every renderer.',
    ko: 'Canvas, WebGL, SVG, 서버사이드 렌더링을 위한 DOM-free 레이아웃 엔진. 하나의 레이아웃 트리, 모든 렌더러.',
  },

  // Demo 1: Text Reflow
  'reflow.title': {
    en: 'Text Reflow',
    ko: 'Text Reflow',
  },
  'reflow.problem': {
    en: 'The Problem',
    ko: '문제',
  },
  'reflow.problem.desc': {
    en: 'DOM-based layout requires the browser to measure text. Outside the browser -- in Canvas, WebGL, or on the server -- there is no DOM. You cannot call getBoundingClientRect().',
    ko: 'DOM 기반 레이아웃은 브라우저가 텍스트를 측정해야 합니다. Canvas, WebGL, 서버 환경에서는 DOM이 없습니다. getBoundingClientRect()를 호출할 수 없습니다.',
  },
  'reflow.solution': {
    en: 'What Flowtext Does',
    ko: 'Flowtext의 해결',
  },
  'reflow.solution.desc': {
    en: 'Flowtext combines Yoga (flexbox) with Pretext (text measurement) to compute layout entirely in JavaScript. Drag the slider -- the same layout result renders to SVG, Canvas, and ASCII simultaneously.',
    ko: 'Flowtext는 Yoga(flexbox)와 Pretext(텍스트 측정)를 결합하여 순수 JavaScript로 레이아웃을 계산합니다. 슬라이더를 드래그하면 동일한 레이아웃 결과가 SVG, Canvas, ASCII에 동시에 렌더링됩니다.',
  },
  'reflow.slider.label': {
    en: 'Container width:',
    ko: 'Container width:',
  },

  // Demo 2: Flex Reorder
  'reorder.title': {
    en: 'Flex Reorder',
    ko: 'Flex Reorder',
  },
  'reorder.problem': {
    en: 'The Problem',
    ko: '문제',
  },
  'reorder.problem.desc': {
    en: 'Building interactive layouts in Canvas or WebGL requires re-running the layout algorithm on every change. Most engines make this prohibitively slow.',
    ko: 'Canvas나 WebGL에서 인터랙티브 레이아웃을 구현하려면 변경마다 레이아웃 알고리즘을 다시 실행해야 합니다. 대부분의 엔진은 이 과정이 너무 느립니다.',
  },
  'reorder.solution': {
    en: 'What Flowtext Does',
    ko: 'Flowtext의 해결',
  },
  'reorder.solution.desc': {
    en: 'Flowtext recomputes layout fast enough for real-time interaction. Drag any element to reorder it -- all three renderers update instantly.',
    ko: 'Flowtext는 실시간 인터랙션이 가능할 만큼 빠르게 레이아웃을 재계산합니다. 요소를 드래그하여 순서를 바꾸면 세 렌더러가 즉시 업데이트됩니다.',
  },
  'reorder.hint': {
    en: 'drag here',
    ko: '드래그',
  },

  // Demo 3: OG Image
  'og.title': {
    en: 'OG Image',
    ko: 'OG Image',
  },
  'og.problem': {
    en: 'The Problem',
    ko: '문제',
  },
  'og.problem.desc': {
    en: 'Generating social media cards on the server typically requires a headless browser just to lay out text. That is slow, resource-heavy, and fragile.',
    ko: '서버에서 소셜 미디어 카드를 생성하려면 보통 텍스트 배치만을 위해 헤드리스 브라우저가 필요합니다. 느리고, 리소스를 많이 쓰고, 불안정합니다.',
  },
  'og.solution': {
    en: 'What Flowtext Does',
    ko: 'Flowtext의 해결',
  },
  'og.solution.desc': {
    en: 'Flowtext computes a 1200 x 630 card layout in pure JS -- no browser needed. Type a title below to see the layout update in real time.',
    ko: 'Flowtext는 순수 JS로 1200 x 630 카드 레이아웃을 계산합니다 -- 브라우저가 필요 없습니다. 아래에 제목을 입력하면 실시간으로 레이아웃이 변경됩니다.',
  },
  'og.input.placeholder': {
    en: 'Type a title...',
    ko: '제목을 입력하세요...',
  },
};

let currentLocale: Locale = 'en';

export function t(key: string): string {
  return messages[key]?.[currentLocale] ?? key;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale) {
  currentLocale = locale;
  applyAll();
}

function applyAll() {
  const els = document.querySelectorAll<HTMLElement>('[data-i18n]');
  for (const el of els) {
    const key = el.dataset.i18n!;
    el.textContent = t(key);
  }
  const placeholders = document.querySelectorAll<HTMLInputElement>('[data-i18n-placeholder]');
  for (const el of placeholders) {
    el.placeholder = t(el.dataset.i18nPlaceholder!);
  }
}
