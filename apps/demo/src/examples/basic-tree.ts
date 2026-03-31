import type { FlowtextNode } from '../../../../packages/flowtext/src';

export const basicTree: FlowtextNode = {
  id: 'root',
  type: 'view',
  style: {
    width: 320,
    height: 240,
    padding: 16,
    flexDirection: 'column',
  },
  children: [
    {
      id: 'title',
      type: 'text',
      text: 'Flowtext turns Yoga and Pretext into one layout tree.',
      style: {
        fontFamily: 'Inter',
        fontSize: 16,
        lineHeight: 24,
      },
    },
  ],
};
