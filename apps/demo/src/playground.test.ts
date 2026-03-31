import { describe, expect, it } from 'vitest';

import { createPlaygroundState, patchPlaygroundState, derivePlaygroundGeometry, getPlaygroundPreset } from './playground';

describe('playground state model', () => {
  it('ships realistic scenario presets for the playground', () => {
    expect(createPlaygroundState('chat-thread')).toMatchObject({
      presetId: 'chat-thread',
    });
    expect(createPlaygroundState('inspector-dock')).toMatchObject({
      presetId: 'inspector-dock',
    });
    expect(createPlaygroundState('media-caption')).toMatchObject({
      presetId: 'media-caption',
    });

    expect(getPlaygroundPreset('chat-thread')).toMatchObject({
      label: 'Chat thread',
    });
  });

  it('resets to curated preset defaults when the preset changes', () => {
    const initial = createPlaygroundState('chat-thread');
    const updated = patchPlaygroundState(initial, { presetId: 'inspector-dock' });

    expect(updated).toMatchObject({
      presetId: 'inspector-dock',
      sceneWidth: 700,
      constraintWidth: 210,
    });
    expect(updated.constraintX).not.toBe(initial.constraintX);
  });

  it('clamps the movable constraint inside the safe body zone', () => {
    const updated = patchPlaygroundState(createPlaygroundState('chat-thread'), {
      sceneWidth: 540,
      constraintX: 999,
      constraintY: -200,
      constraintWidth: 320,
    });

    const geometry = derivePlaygroundGeometry(updated);

    expect(geometry.contentFrame.width).toBeGreaterThanOrEqual(geometry.minContentWidth);
    expect(geometry.constraintFrame.x).toBeGreaterThanOrEqual(geometry.bodyFrame.x);
    expect(geometry.constraintFrame.y).toBeGreaterThanOrEqual(geometry.bodyFrame.y);
    expect(geometry.constraintFrame.x + geometry.constraintFrame.width).toBeLessThanOrEqual(
      geometry.bodyFrame.x + geometry.bodyFrame.width,
    );
    expect(geometry.constraintFrame.y + geometry.constraintFrame.height).toBeLessThanOrEqual(
      geometry.bodyFrame.y + geometry.bodyFrame.height,
    );
  });

  it('switches the dock side when the constraint moves left of center', () => {
    const geometry = derivePlaygroundGeometry(
      patchPlaygroundState(createPlaygroundState('chat-thread'), {
        constraintX: 60,
      }),
    );

    expect(geometry.dockSide).toBe('left');
    expect(geometry.contentFrame.x).toBe(geometry.constraintFrame.x + geometry.constraintFrame.width + geometry.gap);
  });

  it('throws for an unknown preset id', () => {
    expect(() => getPlaygroundPreset('missing' as never)).toThrow('Unknown playground preset: missing');
  });
});
