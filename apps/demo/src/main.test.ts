import { describe, expect, it } from 'vitest';

import type { TextMeasurementAdapter } from '../../../packages/flowtext/src/text-measure';
import { basicTree } from './examples/basic-tree';
import { renderDemoSvg } from './main';

describe('renderDemoSvg', () => {
  it('renders a simple SVG visualization from Flowtext output', async () => {
    const adapter: TextMeasurementAdapter = {
      prepare(request) {
        return {
          request,
          cacheKey: request.text,
        };
      },
      layout(prepared) {
        return {
          width: prepared.request.width,
          height: 48,
          lineCount: 2,
          lines: [
            {
              text: 'Flowtext turns Yoga',
              width: 170,
              start: 0,
              end: 20,
            },
            {
              text: 'and Pretext into one layout tree.',
              width: 230,
              start: 21,
              end: 53,
            },
          ],
        };
      },
    };

    const svg = await renderDemoSvg(basicTree, { width: 320, height: 240 }, { textAdapter: adapter });

    expect(svg).toContain('<svg');
    expect(svg).toContain('data-node-id="root"');
    expect(svg).toContain('data-node-id="title"');
    expect(svg).toContain('Flowtext turns Yoga');
    expect(svg).toContain('and Pretext into one layout tree.');
  });
});
