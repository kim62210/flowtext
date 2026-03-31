import { describe, expect, it } from 'vitest';

import type { TextMeasurementAdapter } from './text-measure';
import type { FlowtextNode } from './types';
import { layoutTree } from './layout-tree';
import { FlowtextError } from './validate';

describe('Flowtext validation and public errors', () => {
  it('raises INVALID_NODE when a public node is missing an id', async () => {
    const invalidNode = {
      type: 'view',
    } as unknown as FlowtextNode;

    await expect(layoutTree(invalidNode, { width: 100 })).rejects.toMatchObject({
      code: 'INVALID_NODE',
    });
  });

  it('raises UNSUPPORTED_STYLE for unsupported public styles', async () => {
    const invalidNode = {
      id: 'root',
      type: 'view',
      style: {
        width: 100,
      },
      children: [
        {
          id: 'child',
          type: 'view',
          style: {
            positionType: 'absolute',
          },
        },
      ],
    } as unknown as FlowtextNode;

    await expect(layoutTree(invalidNode, { width: 100 })).rejects.toMatchObject({
      code: 'UNSUPPORTED_STYLE',
    });
  });

  it('raises MEASURE_FAILED when the adapter throws during text measurement', async () => {
    const adapter: TextMeasurementAdapter = {
      prepare() {
        throw new FlowtextError('MEASURE_FAILED', 'Unable to prepare text.');
      },
      layout() {
        throw new Error('unreachable');
      },
    };

    const node: FlowtextNode = {
      id: 'root',
      type: 'text',
      text: 'Flowtext',
      style: {
        fontFamily: 'Inter',
        fontSize: 16,
        lineHeight: 24,
      },
    };

    await expect(layoutTree(node, { width: 120 }, { textAdapter: adapter })).rejects.toMatchObject({
      code: 'MEASURE_FAILED',
    });
  });
});
