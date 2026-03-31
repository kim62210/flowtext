import { describe, expect, it } from 'vitest';

import type { FlowtextNode } from './types';
import { calculateYogaLayout } from './yoga-tree';

describe('calculateYogaLayout', () => {
  it('computes nested structural layout for view nodes', async () => {
    const root: FlowtextNode = {
      id: 'root',
      type: 'view',
      style: {
        width: 300,
        height: 120,
        flexDirection: 'row',
      },
      children: [
        {
          id: 'left',
          type: 'view',
          style: {
            width: 100,
            height: 120,
          },
        },
        {
          id: 'right',
          type: 'view',
          style: {
            flexGrow: 1,
            height: 120,
          },
        },
      ],
    };

    const result = await calculateYogaLayout(root, {
      width: 300,
      height: 120,
    });

    expect(result.width).toBe(300);
    expect(result.children).toHaveLength(2);
    expect(result.children[0]).toMatchObject({
      id: 'left',
      x: 0,
      y: 0,
      width: 100,
      height: 120,
    });
    expect(result.children[1]).toMatchObject({
      id: 'right',
      x: 100,
      y: 0,
      width: 200,
      height: 120,
    });
  });

  it('rejects inline nodes until inline semantics are implemented', async () => {
    const root: FlowtextNode = {
      id: 'inline-root',
      type: 'inline',
    };

    await expect(
      calculateYogaLayout(root, {
        width: 200,
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_NODE',
      message: 'Inline nodes are not supported yet.',
    });
  });
});
