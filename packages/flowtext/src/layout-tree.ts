import { Direction, loadYoga, type MeasureMode, type Node as YogaNode } from 'yoga-layout/load';

import { normalizeNodeTree } from './normalize';
import {
  createPretextMeasurementAdapter,
  createTextMeasureRequest,
  type TextMeasureResult,
  type TextMeasurementAdapter,
} from './text-measure';
import {
  FLOWTEXT_SCHEMA_VERSION,
  type FlowtextLayoutLine,
  type FlowtextLayoutResult,
  type FlowtextNode,
  type LayoutConstraints,
} from './types';
import { applyStyle } from './yoga-tree';

export type LayoutTreeOptions = {
  textAdapter?: TextMeasurementAdapter;
};

const yogaPromise = loadYoga();

export async function layoutTree(
  root: FlowtextNode,
  constraints: LayoutConstraints,
  options: LayoutTreeOptions = {},
): Promise<FlowtextLayoutResult> {
  const normalizedRoot = normalizeNodeTree(root);
  const Yoga = await yogaPromise;
  const measurements = new Map<string, TextMeasureResult>();
  const textAdapter = options.textAdapter ?? createPretextMeasurementAdapter();
  const yogaRoot = createLayoutYogaTree(Yoga, normalizedRoot, textAdapter, measurements);

  try {
    yogaRoot.calculateLayout(constraints.width, constraints.height, Direction.LTR);

    return readLayoutResult(normalizedRoot, yogaRoot, measurements);
  } finally {
    yogaRoot.freeRecursive();
  }
}

function createLayoutYogaTree(
  Yoga: Awaited<typeof yogaPromise>,
  node: FlowtextNode,
  textAdapter: TextMeasurementAdapter,
  measurements: Map<string, TextMeasureResult>,
): YogaNode {
  const yogaNode = Yoga.Node.create();

  applyStyle(yogaNode, node.style);

  if (node.type === 'text') {
    yogaNode.setMeasureFunc((width, widthMode) => {
      const measured = measureTextNode(node, width, widthMode, textAdapter);
      measurements.set(node.id, measured);

      return {
        width: measured.width,
        height: measured.height,
      };
    });

    return yogaNode;
  }

  node.children?.forEach((child, index) => {
    const childNode = createLayoutYogaTree(Yoga, child, textAdapter, measurements);
    yogaNode.insertChild(childNode, index);
  });

  return yogaNode;
}

function measureTextNode(
  node: FlowtextNode,
  width: number,
  widthMode: MeasureMode,
  textAdapter: TextMeasurementAdapter,
): TextMeasureResult {
  const fontSize = node.style?.fontSize ?? 16;
  const lineHeight = node.style?.lineHeight ?? fontSize;
  const measuredWidth = widthMode === 0 || Number.isNaN(width) ? 0 : width;

  const prepared = textAdapter.prepare(
    createTextMeasureRequest({
      text: node.text ?? '',
      fontFamily: node.style?.fontFamily ?? 'sans-serif',
      fontSize,
      lineHeight,
      width: measuredWidth,
      locale: node.textOptions?.locale,
      fontWeight: node.style?.fontWeight,
      whiteSpace: node.style?.whiteSpace,
    }),
  );
  const measured = textAdapter.layout(prepared);

  if (measured instanceof Promise) {
    throw new Error('Text measurement must be synchronous during Yoga layout.');
  }

  return measured;
}

function readLayoutResult(
  source: FlowtextNode,
  yogaNode: YogaNode,
  measurements: Map<string, TextMeasureResult>,
): FlowtextLayoutResult {
  const measurement = measurements.get(source.id);

  return {
    schemaVersion: FLOWTEXT_SCHEMA_VERSION,
    id: source.id,
    type: source.type,
    x: yogaNode.getComputedLeft(),
    y: yogaNode.getComputedTop(),
    width: yogaNode.getComputedWidth(),
    height: yogaNode.getComputedHeight(),
    lines: measurement ? toLayoutLines(measurement, source.style?.lineHeight ?? source.style?.fontSize ?? 16) : undefined,
    children: source.children?.map((child, index) => {
      const childNode = yogaNode.getChild(index);

      return readLayoutResult(child, childNode, measurements);
    }),
  };
}

function toLayoutLines(measurement: TextMeasureResult, lineHeight: number): FlowtextLayoutLine[] {
  return measurement.lines.map((line, index) => ({
    text: line.text,
    x: 0,
    y: index * lineHeight,
    width: line.width,
    height: lineHeight,
  }));
}
