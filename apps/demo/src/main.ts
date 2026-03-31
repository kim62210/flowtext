import {
  layoutTree,
  type FlowtextLayoutResult,
  type FlowtextNode,
  type LayoutConstraints,
  type LayoutTreeOptions,
} from '../../../packages/flowtext/src';
import {
  derivePlaygroundGeometry,
  getPlaygroundPreset,
  type PlaygroundGeometry,
  type PlaygroundInvariant,
  type PlaygroundMetric,
  type PlaygroundState,
} from './playground';

export type PlaygroundSnapshot = {
  svg: string;
  invariants: PlaygroundInvariant[];
  summary: PlaygroundMetric[];
  preset: ReturnType<typeof getPlaygroundPreset>;
  geometry: PlaygroundGeometry;
  titleLineCount: number;
  bodyLineCount: number;
};

export type PlaygroundOverlayOptions = {
  showProtectedFrames?: boolean;
  showConstraintBounds?: boolean;
  showLineBoxes?: boolean;
};

export async function renderDemoSvg(
  tree: FlowtextNode,
  constraints: LayoutConstraints,
  options: LayoutTreeOptions = {},
): Promise<string> {
  const result = await layoutTree(tree, constraints, options);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${result.width}" height="${result.height}" viewBox="0 0 ${result.width} ${result.height}">`,
    renderDebugNode(result),
    '</svg>',
  ].join('');
}

export async function renderPlaygroundSnapshot(
  state: PlaygroundState,
  options: LayoutTreeOptions = {},
  overlays: PlaygroundOverlayOptions = {},
): Promise<PlaygroundSnapshot> {
  const geometry = derivePlaygroundGeometry(state);
  const preset = getPlaygroundPreset(state.presetId);
  const titleLayout = await layoutTextBlock({
    id: 'playground-title',
    text: preset.title,
    width: geometry.titleFrame.width - 28,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: 700,
    options,
  });
  const bodyLayout = await layoutTextBlock({
    id: 'playground-body',
    text: preset.body,
    width: geometry.contentFrame.width,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 400,
    options,
  });
  const titleLineCount = titleLayout.lines?.length ?? 0;
  const bodyLineCount = bodyLayout.lines?.length ?? 0;
  const invariants = createInvariants(geometry, titleLineCount, bodyLineCount);
  const summary = createSummary(geometry, titleLineCount, bodyLineCount);

  return {
    svg: renderPlaygroundSvg({
      geometry,
      preset,
      titleLayout,
      bodyLayout,
      titleLineCount,
      bodyLineCount,
      overlays,
    }),
    invariants,
    summary,
    preset,
    geometry,
    titleLineCount,
    bodyLineCount,
  };
}

type TextBlockInput = {
  id: string;
  text: string;
  width: number;
  fontSize: number;
  lineHeight: number;
  fontWeight: number;
  options: LayoutTreeOptions;
};

async function layoutTextBlock(input: TextBlockInput): Promise<FlowtextLayoutResult> {
  const tree: FlowtextNode = {
    id: `${input.id}-root`,
    type: 'view',
    style: {
      width: input.width,
      flexDirection: 'column',
    },
    children: [
      {
        id: input.id,
        type: 'text',
        text: input.text,
        style: {
          fontFamily: 'Georgia',
          fontSize: input.fontSize,
          lineHeight: input.lineHeight,
          fontWeight: input.fontWeight,
        },
      },
    ],
  };
  const result = await layoutTree(tree, { width: input.width }, input.options);

  return result.children?.[0] ?? result;
}

function createInvariants(
  geometry: PlaygroundGeometry,
  titleLineCount: number,
  bodyLineCount: number,
): PlaygroundInvariant[] {
  return [
    {
      id: 'title-block',
      label: 'Protected title block',
      detail: `Reserved at y=${Math.round(geometry.titleFrame.y)} with ${titleLineCount} wrapped title lines.`,
      status: 'stable',
    },
    {
      id: 'action-area',
      label: 'Anchored action area',
      detail: `Pinned to the lower ${geometry.dockSide === 'left' ? 'right' : 'right'} corner at ${Math.round(geometry.actionsFrame.x)}, ${Math.round(geometry.actionsFrame.y)}.`,
      status: 'stable',
    },
    {
      id: 'text-wrap',
      label: 'Measured text wrapping',
      detail: `${bodyLineCount} body lines stay inside a ${Math.round(geometry.contentFrame.width)}px safe column.`,
      status: 'stable',
    },
  ];
}

function createSummary(
  geometry: PlaygroundGeometry,
  titleLineCount: number,
  bodyLineCount: number,
): PlaygroundMetric[] {
  return [
    {
      label: 'Dock side',
      value: geometry.dockSide,
    },
    {
      label: 'Body width',
      value: `${Math.round(geometry.contentFrame.width)}px`,
    },
    {
      label: 'Body lines',
      value: `${bodyLineCount} lines`,
    },
    {
      label: 'Title lines',
      value: `${titleLineCount} lines`,
    },
    {
      label: 'Constraint',
      value: `${Math.round(geometry.constraintFrame.x)}, ${Math.round(geometry.constraintFrame.y)} · ${Math.round(geometry.constraintFrame.width)}px`,
    },
  ];
}

type RenderPlaygroundSvgInput = {
  geometry: PlaygroundGeometry;
  preset: ReturnType<typeof getPlaygroundPreset>;
  titleLayout: FlowtextLayoutResult;
  bodyLayout: FlowtextLayoutResult;
  titleLineCount: number;
  bodyLineCount: number;
  overlays: PlaygroundOverlayOptions;
};

function renderPlaygroundSvg(input: RenderPlaygroundSvgInput): string {
  const { geometry, preset, titleLayout, bodyLayout, bodyLineCount, overlays } = input;
  const pillWidth = 124;
  const pillGap = 12;
  const pillMarkup = preset.summaryPills.map((pill, index) => {
    const x = geometry.summaryFrame.x + index * (pillWidth + pillGap);

    return [
      `<g transform="translate(${x} ${geometry.summaryFrame.y})">`,
      `<rect width="${pillWidth}" height="32" rx="16" fill="#f4efe6" stroke="#d4c6af" />`,
      `<text x="16" y="21" fill="#5b5345" font-size="13">${escapeXml(pill)}</text>`,
      '</g>',
    ].join('');
  }).join('');

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${geometry.sceneWidth}" height="${geometry.sceneHeight}" viewBox="0 0 ${geometry.sceneWidth} ${geometry.sceneHeight}" role="img" aria-label="Flowtext interactive playground preview">`,
    '<defs>',
    '<pattern id="preview-grid" width="24" height="24" patternUnits="userSpaceOnUse">',
    '<path d="M 24 0 L 0 0 0 24" fill="none" stroke="#efe7d9" stroke-width="1" />',
    '</pattern>',
    '</defs>',
    `<rect x="0" y="0" width="${geometry.sceneWidth}" height="${geometry.sceneHeight}" rx="28" fill="#fcf8f0" />`,
    `<rect x="0" y="0" width="${geometry.sceneWidth}" height="${geometry.sceneHeight}" rx="28" fill="url(#preview-grid)" opacity="0.8" />`,
    `<rect x="${geometry.titleFrame.x}" y="${geometry.titleFrame.y}" width="${geometry.titleFrame.width}" height="${geometry.titleFrame.height}" rx="20" fill="#f1eadf" stroke="#c8b89d" data-region="protected-title" />`,
    overlays.showProtectedFrames
      ? `<rect data-overlay="protected-frame" x="${geometry.titleFrame.x}" y="${geometry.titleFrame.y}" width="${geometry.titleFrame.width}" height="${geometry.titleFrame.height}" rx="20" fill="none" stroke="#8c6f4d" stroke-width="2" stroke-dasharray="10 6" />`
      : '',
    `<text x="${geometry.titleFrame.x + 16}" y="${geometry.titleFrame.y + 22}" fill="#705f4d" font-size="12" letter-spacing="0.16em">PROTECTED TITLE BLOCK</text>`,
    renderTextLines(titleLayout, geometry.titleFrame.x + 14, geometry.titleFrame.y + 38, '#201c17', overlays.showLineBoxes),
    pillMarkup,
    `<rect x="${geometry.bodyFrame.x}" y="${geometry.bodyFrame.y}" width="${geometry.bodyFrame.width}" height="${geometry.bodyFrame.height}" rx="22" fill="none" stroke="#cebda3" stroke-dasharray="8 8" />`,
    `<rect x="${geometry.contentFrame.x}" y="${geometry.contentFrame.y}" width="${geometry.contentFrame.width}" height="${geometry.contentFrame.height}" rx="18" fill="#fffdf8" stroke="#c6d3d7" stroke-dasharray="7 6" data-region="flow-area" />`,
    `<text x="${geometry.contentFrame.x + 14}" y="${geometry.contentFrame.y + 22}" fill="#647278" font-size="12" letter-spacing="0.16em">FLOW AREA · ${Math.round(geometry.contentFrame.width)}PX</text>`,
    renderTextLines(bodyLayout, geometry.contentFrame.x + 14, geometry.contentFrame.y + 40, '#1f2937', overlays.showLineBoxes),
    `<g transform="translate(${geometry.constraintFrame.x} ${geometry.constraintFrame.y})" data-region="constraint-object">`,
    `<rect width="${geometry.constraintFrame.width}" height="${geometry.constraintFrame.height}" rx="22" fill="#dfe8eb" stroke="#7b98a2" />`,
    overlays.showConstraintBounds
      ? `<rect data-overlay="constraint-bounds" width="${geometry.constraintFrame.width}" height="${geometry.constraintFrame.height}" rx="22" fill="none" stroke="#144b61" stroke-width="2" stroke-dasharray="8 5" />`
      : '',
    `<text x="16" y="24" fill="#48606a" font-size="12" letter-spacing="0.16em">MOVABLE CONSTRAINT</text>`,
    `<text x="16" y="58" fill="#13232b" font-size="18">${geometry.dockSide === 'left' ? 'Docked left' : 'Docked right'}</text>`,
    `<text x="16" y="84" fill="#526670" font-size="13">Resize or shift this block to reflow the body column.</text>`,
    `<rect x="${geometry.constraintFrame.width - 12}" y="20" width="4" height="92" rx="2" fill="#7b98a2" opacity="0.45" />`,
    `<rect x="${geometry.constraintFrame.width - 20}" y="20" width="4" height="92" rx="2" fill="#7b98a2" opacity="0.25" />`,
    '</g>',
    `<g transform="translate(${geometry.actionsFrame.x} ${geometry.actionsFrame.y})" data-region="anchored-actions">`,
    `<rect width="${geometry.actionsFrame.width}" height="${geometry.actionsFrame.height}" rx="20" fill="#15252c" />`,
    '<text x="16" y="24" fill="#e4f0f4" font-size="12" letter-spacing="0.16em">ANCHORED ACTIONS</text>',
    '<rect x="16" y="36" width="92" height="26" rx="13" fill="#d9e7ea" />',
    '<text x="31" y="53" fill="#13232b" font-size="13">Keep frame</text>',
    '<rect x="118" y="36" width="86" height="26" rx="13" fill="#2a414a" stroke="#6e8d97" />',
    '<text x="136" y="53" fill="#d7e5e9" font-size="13">Measure wrap</text>',
    '</g>',
    `<text x="${geometry.framePadding}" y="${geometry.sceneHeight - 12}" fill="#6d604f" font-size="12">${escapeXml(preset.description)} · ${bodyLineCount} body lines</text>`,
    '</svg>',
  ].join('');
}

function renderDebugNode(node: FlowtextLayoutResult): string {
  const rect = `<rect data-node-id="${node.id}" x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" fill="none" stroke="#6b7280" stroke-width="1" />`;
  const lines = renderTextLines(node, node.x, node.y, '#111827');
  const children = node.children?.map(renderDebugNode).join('') ?? '';

  return `${rect}${lines}${children}`;
}

function renderTextLines(
  node: FlowtextLayoutResult,
  offsetX: number,
  offsetY: number,
  fill: string,
  showLineBoxes = false,
): string {
  return node.lines?.map((line) => {
    const x = offsetX + line.x;
    const y = offsetY + line.y + line.height - 4;

    return [
      showLineBoxes
        ? `<rect data-overlay="line-box" x="${x - 4}" y="${y - line.height + 4}" width="${line.width + 8}" height="${line.height}" rx="10" fill="rgba(20, 52, 61, 0.08)" stroke="rgba(20, 52, 61, 0.24)" />`
        : '',
      `<text x="${x}" y="${y}" font-size="14" fill="${fill}">${escapeXml(line.text)}</text>`,
    ].join('');
  }).join('') ?? '';
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
