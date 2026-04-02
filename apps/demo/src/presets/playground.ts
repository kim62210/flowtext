import type { Preset } from './index';

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
