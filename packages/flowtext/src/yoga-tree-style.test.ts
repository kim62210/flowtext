import { Align, Edge, FlexDirection, Justify } from 'yoga-layout/load';
import { describe, expect, it, vi } from 'vitest';

import { applyStyle } from './yoga-tree';

function createMockYogaNode() {
  return {
    setWidth: vi.fn(),
    setHeight: vi.fn(),
    setMinWidth: vi.fn(),
    setMaxWidth: vi.fn(),
    setMinHeight: vi.fn(),
    setMaxHeight: vi.fn(),
    setFlexDirection: vi.fn(),
    setJustifyContent: vi.fn(),
    setAlignItems: vi.fn(),
    setAlignSelf: vi.fn(),
    setFlexGrow: vi.fn(),
    setFlexShrink: vi.fn(),
    setPadding: vi.fn(),
    setMargin: vi.fn(),
  };
}

describe('applyStyle', () => {
  it('does nothing when style is missing', () => {
    const node = createMockYogaNode();

    applyStyle(node as unknown as Parameters<typeof applyStyle>[0], undefined);

    expect(node.setWidth).not.toHaveBeenCalled();
    expect(node.setFlexDirection).not.toHaveBeenCalled();
  });

  it('maps style values to Yoga setters and enums', () => {
    const node = createMockYogaNode();

    applyStyle(node as unknown as Parameters<typeof applyStyle>[0], {
      width: 200,
      height: 120,
      minWidth: 100,
      maxWidth: 220,
      minHeight: 80,
      maxHeight: 140,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'stretch',
      alignSelf: 'auto',
      flexGrow: 1,
      flexShrink: 0,
      padding: 12,
      margin: 8,
    });

    expect(node.setWidth).toHaveBeenCalledWith(200);
    expect(node.setHeight).toHaveBeenCalledWith(120);
    expect(node.setMinWidth).toHaveBeenCalledWith(100);
    expect(node.setMaxWidth).toHaveBeenCalledWith(220);
    expect(node.setMinHeight).toHaveBeenCalledWith(80);
    expect(node.setMaxHeight).toHaveBeenCalledWith(140);
    expect(node.setFlexDirection).toHaveBeenCalledWith(FlexDirection.Row);
    expect(node.setJustifyContent).toHaveBeenCalledWith(Justify.SpaceBetween);
    expect(node.setAlignItems).toHaveBeenCalledWith(Align.Stretch);
    expect(node.setAlignSelf).toHaveBeenCalledWith(Align.Auto);
    expect(node.setFlexGrow).toHaveBeenCalledWith(1);
    expect(node.setFlexShrink).toHaveBeenCalledWith(0);
    expect(node.setPadding).toHaveBeenCalledWith(Edge.All, 12);
    expect(node.setMargin).toHaveBeenCalledWith(Edge.All, 8);
  });

  it('covers remaining justify and align branches', () => {
    const node = createMockYogaNode();

    applyStyle(node as unknown as Parameters<typeof applyStyle>[0], {
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'flex-end',
      alignSelf: 'baseline',
    });

    expect(node.setFlexDirection).toHaveBeenCalledWith(FlexDirection.Column);
    expect(node.setJustifyContent).toHaveBeenCalledWith(Justify.Center);
    expect(node.setAlignItems).toHaveBeenCalledWith(Align.FlexEnd);
    expect(node.setAlignSelf).toHaveBeenCalledWith(Align.Baseline);
  });

  it('falls back to flex-start enum branches', () => {
    const node = createMockYogaNode();

    applyStyle(node as unknown as Parameters<typeof applyStyle>[0], {
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      alignSelf: 'flex-start',
    });

    expect(node.setJustifyContent).toHaveBeenCalledWith(Justify.FlexStart);
    expect(node.setAlignItems).toHaveBeenCalledWith(Align.FlexStart);
    expect(node.setAlignSelf).toHaveBeenCalledWith(Align.FlexStart);
  });
});
