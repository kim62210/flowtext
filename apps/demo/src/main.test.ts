import { describe, expect, it } from 'vitest';

import type { TextMeasurementAdapter } from '../../../packages/flowtext/src/text-measure';
import type { FlowtextNode } from '../../../packages/flowtext/src';
import { createPlaygroundState, patchPlaygroundState } from './playground';
import { renderDemoSvg, renderPlaygroundSnapshot } from './main';
import { basicTree } from './examples/basic-tree';

function createAdapter(): TextMeasurementAdapter {
  return {
    prepare(request) {
      return {
        request,
        cacheKey: `${request.width}:${request.text}`,
      };
    },
    layout(prepared) {
      const words = prepared.request.text.split(' ');
      const maxCharactersPerLine = Math.max(12, Math.floor(prepared.request.width / 8));
      const lines: string[] = [];
      let currentLine = '';

      for (const word of words) {
        const candidate = currentLine ? `${currentLine} ${word}` : word;

        if (candidate.length > maxCharactersPerLine && currentLine) {
          lines.push(currentLine);
          currentLine = word;
          continue;
        }

        currentLine = candidate;
      }

      if (currentLine) {
        lines.push(currentLine);
      }

      return {
        width: prepared.request.width,
        height: lines.length * prepared.request.lineHeight,
        lineCount: lines.length,
        lines: lines.map((line, index) => ({
          text: line,
          width: Math.min(prepared.request.width, line.length * 7),
          start: index,
          end: index + line.length,
        })),
      };
    },
  };
}

function readMetric(snapshot: Awaited<ReturnType<typeof renderPlaygroundSnapshot>>, label: string): string {
  const metric = snapshot.summary.find((entry) => entry.label === label);

  if (!metric) {
    throw new Error(`Missing summary metric: ${label}`);
  }

  return metric.value;
}

describe('renderPlaygroundSnapshot', () => {
  it('keeps the legacy debug renderer available for raw layout trees', async () => {
    const tree: FlowtextNode = basicTree;
    const svg = await renderDemoSvg(tree, { width: 320, height: 240 }, {
      textAdapter: createAdapter(),
    });

    expect(svg).toContain('<svg');
    expect(svg).toContain('data-node-id="root"');
    expect(svg).toContain('Flowtext turns Yoga and Pretext into');
    expect(svg).toContain('one layout tree.');
  });

  it('renders an SVG preview with visible invariants and summary data', async () => {
    const snapshot = await renderPlaygroundSnapshot(createPlaygroundState('chat-thread'), {
      textAdapter: createAdapter(),
    });

    expect(snapshot.svg).toContain('<svg');
    expect(snapshot.svg).toContain('data-region="protected-title"');
    expect(snapshot.svg).toContain('data-region="constraint-object"');
    expect(snapshot.svg).toContain('data-region="anchored-actions"');
    expect(snapshot.svg).toContain('Conversation rail');
    expect(snapshot.invariants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'title-block', status: 'stable' }),
        expect.objectContaining({ id: 'action-area', status: 'stable' }),
        expect.objectContaining({ id: 'text-wrap', status: 'stable' }),
      ]),
    );
    expect(readMetric(snapshot, 'Dock side')).toMatch(/left|right/);
    expect(readMetric(snapshot, 'Body lines')).toMatch(/lines/);
  });

  it('recomputes body wrapping when the sandbox gets tighter', async () => {
    const adapter = createAdapter();
    const wide = await renderPlaygroundSnapshot(createPlaygroundState('chat-thread'), {
      textAdapter: adapter,
    });
    const tight = await renderPlaygroundSnapshot(
      patchPlaygroundState(createPlaygroundState('chat-thread'), {
        sceneWidth: 560,
        constraintWidth: 220,
        constraintX: 280,
      }),
      { textAdapter: adapter },
    );

    expect(tight.bodyLineCount).toBeGreaterThan(wide.bodyLineCount);
    expect(readMetric(tight, 'Body width')).not.toBe(readMetric(wide, 'Body width'));
    expect(tight.invariants.every((entry) => entry.status === 'stable')).toBe(true);
  });

  it('supports stronger debug overlays when requested', async () => {
    const snapshot = await renderPlaygroundSnapshot(
      createPlaygroundState('chat-thread'),
      { textAdapter: createAdapter() },
      {
        showProtectedFrames: true,
        showConstraintBounds: true,
        showLineBoxes: true,
      },
    );

    expect(snapshot.svg).toContain('data-overlay="protected-frame"');
    expect(snapshot.svg).toContain('data-overlay="constraint-bounds"');
    expect(snapshot.svg).toContain('data-overlay="line-box"');
  });
});
