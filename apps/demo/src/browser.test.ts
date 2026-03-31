import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const renderDemoSvg = vi.fn();

vi.mock('./main', () => ({
  renderDemoSvg,
}));

vi.mock('./examples/basic-tree', () => ({
  basicTree: { id: 'root', type: 'view' },
}));

describe('browser demo entry', () => {
  beforeEach(() => {
    vi.resetModules();
    renderDemoSvg.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mounts the rendered SVG into the app container', async () => {
    const app = { innerHTML: '' };

    vi.stubGlobal('document', {
      querySelector: vi.fn(() => app),
    });

    renderDemoSvg.mockResolvedValue('<svg>demo</svg>');

    await import('./browser');

    expect(renderDemoSvg).toHaveBeenCalledWith(
      { id: 'root', type: 'view' },
      { width: 320, height: 240 },
    );
    expect(app.innerHTML).toBe('<svg>demo</svg>');
  });

  it('throws when the app container is missing', async () => {
    vi.stubGlobal('document', {
      querySelector: vi.fn(() => null),
    });

    renderDemoSvg.mockResolvedValue('<svg>demo</svg>');

    await expect(import('./browser')).rejects.toThrow('Missing #app container for the Flowtext demo.');
  });
});
