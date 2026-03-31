import { Align, Direction, Edge, FlexDirection, Justify, loadYoga } from 'yoga-layout/load';
import type { Node as YogaNode } from 'yoga-layout/load';

import { normalizeNodeTree } from './normalize';
import type { FlowtextNode, FlowtextStyle, LayoutConstraints } from './types';

export type StructuralLayoutNode = {
  id: string;
  type: FlowtextNode['type'];
  x: number;
  y: number;
  width: number;
  height: number;
  children: StructuralLayoutNode[];
};

const yogaPromise = loadYoga();

export async function calculateYogaLayout(
  root: FlowtextNode,
  constraints: LayoutConstraints,
): Promise<StructuralLayoutNode> {
  const normalizedRoot = normalizeNodeTree(root);
  const Yoga = await yogaPromise;
  const yogaRoot = createYogaTree(Yoga, normalizedRoot);

  try {
    yogaRoot.calculateLayout(
      constraints.width,
      constraints.height,
      Direction.LTR,
    );

    return readLayoutTree(normalizedRoot, yogaRoot);
  } finally {
    yogaRoot.freeRecursive();
  }
}

function createYogaTree(
  Yoga: Awaited<typeof yogaPromise>,
  node: FlowtextNode,
): YogaNode {
  const yogaNode = Yoga.Node.create();

  applyStyle(yogaNode, node.style);

  node.children?.forEach((child, index) => {
    const childNode = createYogaTree(Yoga, child);
    yogaNode.insertChild(childNode, index);
  });

  return yogaNode;
}

function applyStyle(node: YogaNode, style?: FlowtextStyle): void {
  if (!style) {
    return;
  }

  if (style.width !== undefined) {
    node.setWidth(style.width);
  }

  if (style.height !== undefined) {
    node.setHeight(style.height);
  }

  if (style.minWidth !== undefined) {
    node.setMinWidth(style.minWidth);
  }

  if (style.maxWidth !== undefined) {
    node.setMaxWidth(style.maxWidth);
  }

  if (style.minHeight !== undefined) {
    node.setMinHeight(style.minHeight);
  }

  if (style.maxHeight !== undefined) {
    node.setMaxHeight(style.maxHeight);
  }

  if (style.flexDirection) {
    node.setFlexDirection(toYogaFlexDirection(style.flexDirection));
  }

  if (style.justifyContent) {
    node.setJustifyContent(toYogaJustify(style.justifyContent));
  }

  if (style.alignItems) {
    node.setAlignItems(toYogaAlign(style.alignItems));
  }

  if (style.alignSelf) {
    node.setAlignSelf(toYogaAlign(style.alignSelf));
  }

  if (style.flexGrow !== undefined) {
    node.setFlexGrow(style.flexGrow);
  }

  if (style.flexShrink !== undefined) {
    node.setFlexShrink(style.flexShrink);
  }

  if (style.padding !== undefined) {
    node.setPadding(Edge.All, style.padding);
  }

  if (style.margin !== undefined) {
    node.setMargin(Edge.All, style.margin);
  }
}

function readLayoutTree(source: FlowtextNode, yogaNode: YogaNode): StructuralLayoutNode {
  const children = source.children?.map((child, index) => {
    const childNode = yogaNode.getChild(index);

    return readLayoutTree(child, childNode);
  }) ?? [];

  return {
    id: source.id,
    type: source.type,
    x: yogaNode.getComputedLeft(),
    y: yogaNode.getComputedTop(),
    width: yogaNode.getComputedWidth(),
    height: yogaNode.getComputedHeight(),
    children,
  };
}

function toYogaFlexDirection(value: NonNullable<FlowtextStyle['flexDirection']>): FlexDirection {
  return value === 'row' ? FlexDirection.Row : FlexDirection.Column;
}

function toYogaJustify(value: NonNullable<FlowtextStyle['justifyContent']>): Justify {
  switch (value) {
    case 'center':
      return Justify.Center;
    case 'flex-end':
      return Justify.FlexEnd;
    case 'space-between':
      return Justify.SpaceBetween;
    default:
      return Justify.FlexStart;
  }
}

function toYogaAlign(value: NonNullable<FlowtextStyle['alignItems'] | FlowtextStyle['alignSelf']>): Align {
  switch (value) {
    case 'stretch':
      return Align.Stretch;
    case 'center':
      return Align.Center;
    case 'flex-end':
      return Align.FlexEnd;
    case 'baseline':
      return Align.Baseline;
    case 'auto':
      return Align.Auto;
    default:
      return Align.FlexStart;
  }
}
