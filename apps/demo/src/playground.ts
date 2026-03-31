export type PlaygroundPresetId = 'chat-thread' | 'inspector-dock' | 'media-caption';

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
    id: 'chat-thread',
    label: 'Chat thread',
    description: 'A conversation card where the message rail can move without pushing the title or action tray off their anchors.',
    title: 'Conversation rail stays flexible while the pinned header and quick actions remain stable.',
    body: 'Drag the conversation rail or tighten the sandbox width to see how a messaging surface can rewrap long copy without losing the reserved title band or the anchored reply controls. The preview is intentionally mechanical: it exposes the safe frame rather than hiding it behind polished chrome.',
    summaryPills: ['Conversation rail', 'Pinned reply tray', 'Wrapped copy'],
    defaults: {
      sceneWidth: 740,
      constraintWidth: 176,
      constraintX: 432,
      constraintY: 184,
    },
  },
  {
    id: 'inspector-dock',
    label: 'Inspector dock',
    description: 'A floating inspector that can swing across the body without breaking the protected document title and action footer.',
    title: 'The inspector dock is movable, but the document shell still protects the title block and publish actions.',
    body: 'This preset mimics a design tool or CMS inspector. Move the dock from side to side and watch the text column adapt without leaking into the lower action tray. The point is to show that the constraint object changes the flow area, not the structural anchors.',
    summaryPills: ['Inspector dock', 'Stable shell', 'Flow-safe body'],
    defaults: {
      sceneWidth: 700,
      constraintWidth: 210,
      constraintX: 214,
      constraintY: 210,
    },
  },
  {
    id: 'media-caption',
    label: 'Media caption',
    description: 'A media card where a movable caption module reflows the narrative copy while the title and CTA footer keep their slots.',
    title: 'Caption modules can shift around the artwork area while the surrounding story layout keeps its reserved bands.',
    body: 'Use this preset to mimic editorial cards or story attachments. As the caption module moves and resizes, the body copy recomputes inside the remaining safe column, but the top title band and lower call-to-action block stay visibly anchored.',
    summaryPills: ['Caption module', 'Editorial shell', 'Anchored CTA'],
    defaults: {
      sceneWidth: 780,
      constraintWidth: 168,
      constraintX: 552,
      constraintY: 174,
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

export function createPlaygroundState(presetId: PlaygroundPresetId = 'chat-thread'): PlaygroundState {
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
