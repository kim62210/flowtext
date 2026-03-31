import { describe, expect, it } from 'vitest';

import type { TextMeasurementAdapter } from './text-measure';
import type { FlowtextNode } from './types';
import { FLOWTEXT_SCHEMA_VERSION } from './types';
import { layoutTree } from './layout-tree';

describe('layoutTree', () => {
  it('returns a unified result tree for mixed view and text nodes', async () => {
    const adapter: TextMeasurementAdapter = {
      prepare(request) {
        return {
          request,
          cacheKey: `${request.font}:${request.text}`,
        };
      },
      layout(prepared) {
        return {
          width: prepared.request.width,
          height: 48,
          lineCount: 2,
          lines: [
            { text: 'Flowtext wraps', width: 120, start: 0, end: 14 },
            { text: 'paragraphs.', width: 90, start: 15, end: 26 },
          ],
        };
      },
    };

    const root: FlowtextNode = {
      id: 'root',
      type: 'view',
      style: {
        width: 240,
        flexDirection: 'column',
      },
      children: [
        {
          id: 'title',
          type: 'text',
          text: 'Flowtext wraps paragraphs.',
          style: {
            fontFamily: 'Inter',
            fontSize: 16,
            lineHeight: 24,
          },
        },
      ],
    };

    const result = await layoutTree(root, { width: 240 }, { textAdapter: adapter });

    expect(result.schemaVersion).toBe(FLOWTEXT_SCHEMA_VERSION);
    expect(result.width).toBe(240);
    expect(result.children).toHaveLength(1);
    expect(result.children?.[0]).toMatchObject({
      id: 'title',
      type: 'text',
      height: 48,
      width: 240,
      lines: [
        { text: 'Flowtext wraps', width: 120 },
        { text: 'paragraphs.', width: 90 },
      ],
    });
  });
});
