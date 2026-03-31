import type { FlowtextNode } from './types';

export function normalizeNodeTree(node: FlowtextNode): FlowtextNode {
  if (node.type === 'inline') {
    throw new Error('Inline nodes are not supported yet.');
  }

  return {
    ...node,
    children: node.children?.map(normalizeNodeTree),
  };
}
