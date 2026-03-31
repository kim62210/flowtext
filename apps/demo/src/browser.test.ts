import { beforeEach, describe, expect, it, vi } from 'vitest';

const renderPlaygroundSnapshot = vi.fn();
const createPlaygroundState = vi.fn();
const patchPlaygroundState = vi.fn();

vi.mock('./main', () => ({
  renderPlaygroundSnapshot,
}));

vi.mock('./playground', () => ({
  PLAYGROUND_PRESETS: [
    { id: 'balanced', label: 'Balanced' },
    { id: 'stress', label: 'Stress' },
  ],
  createPlaygroundState,
  patchPlaygroundState,
}));

type FakeListener = (event?: unknown) => void;

function createFakeNode(initialValue = '') {
  const listeners = new Map<string, FakeListener[]>();

  return {
    value: initialValue,
    innerHTML: '',
    textContent: '',
    addEventListener(type: string, listener: FakeListener) {
      listeners.set(type, [...(listeners.get(type) ?? []), listener]);
    },
    dispatch(type: string, event?: unknown) {
      for (const listener of listeners.get(type) ?? []) {
        listener(event as never);
      }
    },
    getBoundingClientRect() {
      return {
        left: 0,
        top: 0,
        width: 720,
        height: 520,
      };
    },
  };
}

function createHarness() {
  const preview = createFakeNode();
  const invariants = createFakeNode();
  const summary = createFakeNode();
  const status = createFakeNode();
  const preset = createFakeNode('balanced');
  const sceneWidth = createFakeNode('720');
  const constraintWidth = createFakeNode('180');
  const constraintX = createFakeNode('420');
  const constraintY = createFakeNode('190');
  const outputs = {
    '[data-output="scene-width"]': createFakeNode(),
    '[data-output="constraint-width"]': createFakeNode(),
    '[data-output="constraint-x"]': createFakeNode(),
    '[data-output="constraint-y"]': createFakeNode(),
  };

  const nodes = {
    '[data-control="preset"]': preset,
    '[data-control="scene-width"]': sceneWidth,
    '[data-control="constraint-width"]': constraintWidth,
    '[data-control="constraint-x"]': constraintX,
    '[data-control="constraint-y"]': constraintY,
    '[data-panel="preview"]': preview,
    '[data-panel="invariants"]': invariants,
    '[data-panel="summary"]': summary,
    '[data-panel="status"]': status,
    ...outputs,
  };

  const app = {
    innerHTML: '',
    querySelector(selector: string) {
      return nodes[selector as keyof typeof nodes] ?? null;
    },
  };

  const documentLike = {
    querySelector(selector: string) {
      if (selector === '#app') {
        return app;
      }

      return null;
    },
  };

  return {
    app,
    preview,
    invariants,
    summary,
    status,
    preset,
    sceneWidth,
    constraintWidth,
    constraintX,
    constraintY,
    outputs,
    documentLike,
  };
}

describe('mountPlaygroundDemo', () => {
  beforeEach(() => {
    vi.resetModules();
    createPlaygroundState.mockReset();
    patchPlaygroundState.mockReset();
    renderPlaygroundSnapshot.mockReset();
  });

  it('mounts the playground shell and renders the first snapshot', async () => {
    const harness = createHarness();
    const state = {
      presetId: 'balanced',
      sceneWidth: 720,
      constraintWidth: 180,
      constraintX: 420,
      constraintY: 190,
    };

    createPlaygroundState.mockReturnValue(state);
    patchPlaygroundState.mockImplementation((_current, patch) => ({ ...state, ...patch }));
    renderPlaygroundSnapshot.mockResolvedValue({
      svg: '<svg>preview</svg>',
      invariants: [{ id: 'title-block', label: 'Protected title block', detail: 'Still reserved.', status: 'stable' }],
      summary: [{ label: 'Body width', value: '296px' }],
      preset: { label: 'Balanced' },
      geometry: { dockSide: 'right' },
      bodyLineCount: 4,
    });

    const { mountPlaygroundDemo } = await import('./browser');

    await mountPlaygroundDemo(harness.documentLike as never);

    expect(harness.app.innerHTML).toContain('Interactive playground');
    expect(renderPlaygroundSnapshot).toHaveBeenCalledWith(state);
    expect(harness.preview.innerHTML).toContain('<svg>preview</svg>');
    expect(harness.invariants.innerHTML).toContain('Protected title block');
    expect(harness.summary.innerHTML).toContain('Body width');
    expect(harness.outputs['[data-output="scene-width"]'].textContent).toBe('720px');
  });

  it('re-renders when a control changes', async () => {
    const harness = createHarness();
    const initialState = {
      presetId: 'balanced',
      sceneWidth: 720,
      constraintWidth: 180,
      constraintX: 420,
      constraintY: 190,
    };

    createPlaygroundState.mockReturnValue(initialState);
    patchPlaygroundState.mockImplementation((current, patch) => ({ ...current, ...patch }));
    renderPlaygroundSnapshot.mockResolvedValue({
      svg: '<svg>preview</svg>',
      invariants: [],
      summary: [],
      preset: { label: 'Balanced' },
      geometry: { dockSide: 'right' },
      bodyLineCount: 4,
    });

    const { mountPlaygroundDemo } = await import('./browser');

    await mountPlaygroundDemo(harness.documentLike as never);

    harness.sceneWidth.value = '640';
    harness.sceneWidth.dispatch('input');
    await Promise.resolve();

    expect(patchPlaygroundState).toHaveBeenLastCalledWith(initialState, { sceneWidth: 640 });
    expect(renderPlaygroundSnapshot).toHaveBeenLastCalledWith(
      expect.objectContaining({ sceneWidth: 640 }),
    );
  });

  it('updates the constraint position when the preview object is dragged', async () => {
    const harness = createHarness();
    const initialState = {
      presetId: 'balanced',
      sceneWidth: 720,
      constraintWidth: 180,
      constraintX: 420,
      constraintY: 190,
    };

    createPlaygroundState.mockReturnValue(initialState);
    patchPlaygroundState.mockImplementation((current, patch) => ({ ...current, ...patch }));
    renderPlaygroundSnapshot.mockResolvedValue({
      svg: '<svg><g data-region="constraint-object"></g></svg>',
      invariants: [],
      summary: [],
      preset: { label: 'Balanced' },
      geometry: { dockSide: 'right', constraintFrame: { x: 420, y: 190, width: 180 } },
      bodyLineCount: 4,
    });

    const { mountPlaygroundDemo } = await import('./browser');

    await mountPlaygroundDemo(harness.documentLike as never);

    harness.preview.dispatch('pointerdown', {
      target: {
        closest(selector: string) {
          return selector === '[data-region="constraint-object"]' ? {} : null;
        },
      },
      clientX: 430,
      clientY: 210,
      preventDefault() {},
    });
    harness.preview.dispatch('pointermove', {
      clientX: 460,
      clientY: 232,
      preventDefault() {},
    });
    harness.preview.dispatch('pointerup', {
      preventDefault() {},
    });
    await Promise.resolve();

    expect(patchPlaygroundState).toHaveBeenCalledWith(
      initialState,
      expect.objectContaining({
        constraintX: 450,
        constraintY: 212,
      }),
    );
  });

  it('throws when the app container is missing', async () => {
    const { mountPlaygroundDemo } = await import('./browser');

    await expect(
      mountPlaygroundDemo({
        querySelector() {
          return null;
        },
      } as never),
    ).rejects.toThrow('Missing #app container for the Flowtext demo.');
  });
});
