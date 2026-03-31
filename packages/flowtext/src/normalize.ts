import type { FlowtextNode } from './types';
import { validateNodeTree } from './validate';

export function normalizeNodeTree(node: FlowtextNode): FlowtextNode {
  validateNodeTree(node);

  if (node.type === 'inline') {
    throw new Error('Inline nodes are not supported yet.');
  }

  return {
    ...node,
    children: node.children?.map(normalizeNodeTree),
  };
}
