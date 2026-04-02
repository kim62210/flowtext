import type { Preset } from './index';

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
