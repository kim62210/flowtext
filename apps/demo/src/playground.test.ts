import { describe, expect, it } from 'vitest';

import { createPlaygroundState, patchPlaygroundState, derivePlaygroundGeometry, getPlaygroundPreset } from './playground';

describe('playground state model', () => {
  it('resets to curated preset defaults when the preset changes', () => {
    const initial = createPlaygroundState('balanced');
    const updated = patchPlaygroundState(initial, { presetId: 'stress' });

    expect(updated).toMatchObject({
      presetId: 'stress',
      sceneWidth: 560,
      constraintWidth: 220,
    });
    expect(updated.constraintX).not.toBe(initial.constraintX);
  });

  it('clamps the movable constraint inside the safe body zone', () => {
    const updated = patchPlaygroundState(createPlaygroundState('balanced'), {
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
      patchPlaygroundState(createPlaygroundState('balanced'), {
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
