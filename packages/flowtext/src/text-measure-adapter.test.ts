import { describe, expect, it, vi } from 'vitest';

const pretextMocks = vi.hoisted(() => ({
  layoutWithLines: vi.fn(),
  prepareWithSegments: vi.fn(),
  setLocale: vi.fn(),
}));

vi.mock('@chenglou/pretext', () => ({
  layoutWithLines: pretextMocks.layoutWithLines,
  prepareWithSegments: pretextMocks.prepareWithSegments,
  setLocale: pretextMocks.setLocale,
}));

import { createPretextMeasurementAdapter } from './text-measure';

describe('createPretextMeasurementAdapter', () => {
  it('prepares text with locale and white-space settings', () => {
    pretextMocks.prepareWithSegments.mockReturnValue({ prepared: true });
    const adapter = createPretextMeasurementAdapter();

    const prepared = adapter.prepare({
      text: 'Flowtext',
      font: '700 16px Inter',
      lineHeight: 24,
      width: 180,
      locale: 'en-US',
      whiteSpace: 'pre-wrap',
    });

    expect(pretextMocks.setLocale).toHaveBeenCalledWith('en-US');
    expect(pretextMocks.prepareWithSegments).toHaveBeenCalledWith('Flowtext', '700 16px Inter', {
      whiteSpace: 'pre-wrap',
    });
    expect(prepared.cacheKey).toBe('700 16px Inter::Flowtext::en-US::pre-wrap');
  });

  it('maps layout lines into the public measurement result', () => {
    pretextMocks.layoutWithLines.mockReturnValue({
      height: 48,
      lineCount: 2,
      lines: [
        {
          text: 'Flowtext',
          width: 80,
          start: { graphemeIndex: 0 },
          end: { graphemeIndex: 8 },
        },
        {
          text: 'layout',
          width: 120,
          start: { graphemeIndex: 9 },
          end: { graphemeIndex: 15 },
        },
      ],
    });

    const adapter = createPretextMeasurementAdapter();
    const result = adapter.layout({
      request: {
        text: 'Flowtext layout',
        font: '16px Inter',
        lineHeight: 24,
        width: 180,
      },
      cacheKey: 'cache-key',
      prepared: { prepared: true } as never,
    });

    expect(pretextMocks.layoutWithLines).toHaveBeenCalled();
    expect(result).toMatchObject({
      width: 120,
      height: 48,
      lineCount: 2,
      lines: [
        { text: 'Flowtext', width: 80, start: 0, end: 8 },
        { text: 'layout', width: 120, start: 9, end: 15 },
      ],
    });
  });

  it('throws when prepared text payload is missing', () => {
    const adapter = createPretextMeasurementAdapter();

    expect(() =>
      adapter.layout({
        request: {
          text: 'Flowtext',
          font: '16px Inter',
          lineHeight: 24,
          width: 180,
        },
        cacheKey: 'cache-key',
      }),
    ).toThrow('Prepared text payload is missing.');
  });
});
