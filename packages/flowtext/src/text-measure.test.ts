import { describe, expect, it } from 'vitest';

import {
  createTextMeasureRequest,
  measurePreparedText,
  type PreparedTextMeasurement,
  type TextMeasurementAdapter,
} from './text-measure';

describe('text measurement bridge', () => {
  it('builds an explicit measurement request from node inputs', () => {
    const request = createTextMeasureRequest({
      text: 'Flowtext wraps paragraphs.',
      fontFamily: 'Inter',
      fontSize: 16,
      lineHeight: 24,
      locale: 'en-US',
      width: 180,
    });

    expect(request.font).toBe('16px Inter');
    expect(request.width).toBe(180);
    expect(request.lineHeight).toBe(24);
    expect(request.locale).toBe('en-US');
  });

  it('delegates paragraph measurement through an adapter boundary', async () => {
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

    const prepared: PreparedTextMeasurement = adapter.prepare(
      createTextMeasureRequest({
        text: 'Flowtext wraps paragraphs.',
        fontFamily: 'Inter',
        fontSize: 16,
        lineHeight: 24,
        locale: 'en-US',
        width: 180,
      }),
    );

    const measured = await measurePreparedText(adapter, prepared);

    expect(measured.height).toBe(48);
    expect(measured.lineCount).toBe(2);
    expect(measured.lines).toHaveLength(2);
    expect(prepared.cacheKey).toContain('Inter');
  });
});
