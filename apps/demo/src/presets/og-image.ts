import type { Preset } from './index';

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
