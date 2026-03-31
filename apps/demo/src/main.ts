import { layoutTree, type FlowtextLayoutResult, type FlowtextNode, type LayoutConstraints, type LayoutTreeOptions } from '../../../packages/flowtext/src';

export async function renderDemoSvg(
  tree: FlowtextNode,
  constraints: LayoutConstraints,
  options: LayoutTreeOptions = {},
): Promise<string> {
  const result = await layoutTree(tree, constraints, options);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${result.width}" height="${result.height}" viewBox="0 0 ${result.width} ${result.height}">`,
    renderNode(result),
    '</svg>',
  ].join('');
}

function renderNode(node: FlowtextLayoutResult): string {
  const rect = `<rect data-node-id="${node.id}" x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" fill="none" stroke="#6b7280" stroke-width="1" />`;
  const lines = node.lines?.map((line) => {
    const x = node.x + line.x;
    const y = node.y + line.y + line.height - 4;

    return `<text x="${x}" y="${y}" font-size="14" fill="#111827">${escapeXml(line.text)}</text>`;
  }).join('') ?? '';
  const children = node.children?.map(renderNode).join('') ?? '';

  return `${rect}${lines}${children}`;
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
