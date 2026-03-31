export type PlaygroundPresetId = 'balanced' | 'stress' | 'wide';

export type PlaygroundState = {
  presetId: PlaygroundPresetId;
  sceneWidth: number;
  constraintWidth: number;
  constraintX: number;
  constraintY: number;
};

export type PlaygroundFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PlaygroundGeometry = {
  sceneWidth: number;
  sceneHeight: number;
  framePadding: number;
  gap: number;
  minContentWidth: number;
  titleFrame: PlaygroundFrame;
  summaryFrame: PlaygroundFrame;
  bodyFrame: PlaygroundFrame;
  contentFrame: PlaygroundFrame;
  constraintFrame: PlaygroundFrame;
  actionsFrame: PlaygroundFrame;
  dockSide: 'left' | 'right';
};

export type PlaygroundInvariant = {
  id: 'title-block' | 'action-area' | 'text-wrap';
  label: string;
  detail: string;
  status: 'stable';
};

export type PlaygroundMetric = {
  label: string;
  value: string;
};

export type PlaygroundPreset = {
  id: PlaygroundPresetId;
  label: string;
  description: string;
  title: string;
  body: string;
  summaryPills: string[];
  defaults: Omit<PlaygroundState, 'presetId'>;
};

const SCENE_HEIGHT = 520;
const FRAME_PADDING = 24;
const GAP = 18;
const HEADER_HEIGHT = 100;
const SUMMARY_HEIGHT = 44;
const FOOTER_HEIGHT = 76;
const CONSTRAINT_HEIGHT = 132;
const MIN_CONTENT_WIDTH = 180;
const MIN_SCENE_WIDTH = 540;
const MAX_SCENE_WIDTH = 820;
const MIN_CONSTRAINT_WIDTH = 120;

export const PLAYGROUND_PRESETS: PlaygroundPreset[] = [
  {
    id: 'balanced',
    label: 'Balanced',
    description: 'A roomy setup that keeps the dock off to the side and the footer pinned.',
    title: 'Flowtext keeps the title block protected while the body rewraps around current constraints.',
    body: 'Move the constraint object or squeeze the page width to see how the body column keeps its safe frame, the title stays reserved, and the action area remains anchored to the lower edge. This is a debugging playground for layout resilience, not a production renderer.',
    summaryPills: ['Protected title', 'Anchored actions', 'Measured wrap'],
    defaults: {
      sceneWidth: 720,
      constraintWidth: 180,
      constraintX: 420,
      constraintY: 188,
    },
  },
  {
    id: 'stress',
    label: 'Stress',
    description: 'A tighter sandbox that pushes the body column toward its minimum safe width.',
    title: 'Stress the body width without letting the title or footer drift.',
    body: 'The stress preset narrows the content frame and increases wrap pressure. Flowtext still computes the text inside the declared frame while the preview makes the stable regions visible. The point is to show the safe area, not to pretend that the demo is a full renderer.',
    summaryPills: ['Narrow body', 'Stable anchors', 'Explicit bounds'],
    defaults: {
      sceneWidth: 560,
      constraintWidth: 220,
      constraintX: 250,
      constraintY: 204,
    },
  },
  {
    id: 'wide',
    label: 'Wide',
    description: 'A wider canvas that shows how the same layout rules scale without rewriting the tree.',
    title: 'Widen the sandbox and the body opens up while the protected regions stay fixed.',
    body: 'The wide preset gives the text more room, shortens the wrapped body copy, and still keeps the title block isolated from the dock and the footer actions. The layout summary makes those invariants obvious instead of hiding them behind a pretty screenshot.',
    summaryPills: ['Wide body', 'Lower wrap count', 'Same stable zones'],
    defaults: {
      sceneWidth: 800,
      constraintWidth: 160,
      constraintX: 564,
      constraintY: 176,
    },
  },
];

export function getPlaygroundPreset(presetId: PlaygroundPresetId): PlaygroundPreset {
  const preset = PLAYGROUND_PRESETS.find((entry) => entry.id === presetId);

  if (!preset) {
    throw new Error(`Unknown playground preset: ${presetId}`);
  }

  return preset;
}

export function createPlaygroundState(presetId: PlaygroundPresetId = 'balanced'): PlaygroundState {
  const preset = getPlaygroundPreset(presetId);

  return {
    presetId,
    ...preset.defaults,
  };
}

export function patchPlaygroundState(
  current: PlaygroundState,
  patch: Partial<PlaygroundState>,
): PlaygroundState {
  const next = patch.presetId ? createPlaygroundState(patch.presetId) : current;

  return clampPlaygroundState({
    ...next,
    ...patch,
  });
}

export function clampPlaygroundState(state: PlaygroundState): PlaygroundState {
  const sceneWidth = clamp(state.sceneWidth, MIN_SCENE_WIDTH, MAX_SCENE_WIDTH);
  const titleFrame: PlaygroundFrame = {
    x: FRAME_PADDING,
    y: FRAME_PADDING,
    width: sceneWidth - FRAME_PADDING * 2,
    height: HEADER_HEIGHT,
  };
  const summaryFrame: PlaygroundFrame = {
    x: FRAME_PADDING,
    y: titleFrame.y + titleFrame.height + 12,
    width: titleFrame.width,
    height: SUMMARY_HEIGHT,
  };
  const actionsFrame: PlaygroundFrame = {
    width: 220,
    height: FOOTER_HEIGHT,
    x: sceneWidth - FRAME_PADDING - 220,
    y: SCENE_HEIGHT - FRAME_PADDING - FOOTER_HEIGHT,
  };
  const bodyFrame: PlaygroundFrame = {
    x: FRAME_PADDING,
    y: summaryFrame.y + summaryFrame.height + 20,
    width: titleFrame.width,
    height: actionsFrame.y - 18 - (summaryFrame.y + summaryFrame.height + 20),
  };
  const maxConstraintWidth = Math.max(
    MIN_CONSTRAINT_WIDTH,
    bodyFrame.width - MIN_CONTENT_WIDTH - GAP,
  );
  const constraintWidth = clamp(state.constraintWidth, MIN_CONSTRAINT_WIDTH, maxConstraintWidth);
  const dockSide = state.constraintX + constraintWidth / 2 < sceneWidth / 2 ? 'left' : 'right';
  const minX = dockSide === 'left'
    ? bodyFrame.x
    : bodyFrame.x + MIN_CONTENT_WIDTH + GAP;
  const maxX = dockSide === 'left'
    ? bodyFrame.x + bodyFrame.width - constraintWidth - MIN_CONTENT_WIDTH - GAP
    : bodyFrame.x + bodyFrame.width - constraintWidth;
  const constraintX = clamp(state.constraintX, minX, Math.max(minX, maxX));
  const constraintY = clamp(
    state.constraintY,
    bodyFrame.y,
    bodyFrame.y + bodyFrame.height - CONSTRAINT_HEIGHT,
  );

  return {
    ...state,
    sceneWidth,
    constraintWidth,
    constraintX,
    constraintY,
  };
}

export function derivePlaygroundGeometry(state: PlaygroundState): PlaygroundGeometry {
  const clamped = clampPlaygroundState(state);
  const titleFrame: PlaygroundFrame = {
    x: FRAME_PADDING,
    y: FRAME_PADDING,
    width: clamped.sceneWidth - FRAME_PADDING * 2,
    height: HEADER_HEIGHT,
  };
  const summaryFrame: PlaygroundFrame = {
    x: FRAME_PADDING,
    y: titleFrame.y + titleFrame.height + 12,
    width: titleFrame.width,
    height: SUMMARY_HEIGHT,
  };
  const actionsFrame: PlaygroundFrame = {
    width: 220,
    height: FOOTER_HEIGHT,
    x: clamped.sceneWidth - FRAME_PADDING - 220,
    y: SCENE_HEIGHT - FRAME_PADDING - FOOTER_HEIGHT,
  };
  const bodyFrame: PlaygroundFrame = {
    x: FRAME_PADDING,
    y: summaryFrame.y + summaryFrame.height + 20,
    width: titleFrame.width,
    height: actionsFrame.y - 18 - (summaryFrame.y + summaryFrame.height + 20),
  };
  const constraintFrame: PlaygroundFrame = {
    x: clamped.constraintX,
    y: clamped.constraintY,
    width: clamped.constraintWidth,
    height: CONSTRAINT_HEIGHT,
  };
  const dockSide = constraintFrame.x + constraintFrame.width / 2 < clamped.sceneWidth / 2 ? 'left' : 'right';
  const contentFrame = dockSide === 'left'
    ? {
        x: constraintFrame.x + constraintFrame.width + GAP,
        y: bodyFrame.y,
        width: bodyFrame.x + bodyFrame.width - (constraintFrame.x + constraintFrame.width + GAP),
        height: bodyFrame.height,
      }
    : {
        x: bodyFrame.x,
        y: bodyFrame.y,
        width: constraintFrame.x - GAP - bodyFrame.x,
        height: bodyFrame.height,
      };

  return {
    sceneWidth: clamped.sceneWidth,
    sceneHeight: SCENE_HEIGHT,
    framePadding: FRAME_PADDING,
    gap: GAP,
    minContentWidth: MIN_CONTENT_WIDTH,
    titleFrame,
    summaryFrame,
    bodyFrame,
    contentFrame,
    constraintFrame,
    actionsFrame,
    dockSide,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
