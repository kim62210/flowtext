import type { FlowtextNode } from './types';
import { FlowtextError, validateNodeTree } from './validate';

export function normalizeNodeTree(node: FlowtextNode): FlowtextNode {
  validateNodeTree(node);

  if (node.type === 'inline') {
    throw new FlowtextError('INVALID_NODE', 'Inline nodes are not supported yet.');
  }

  return {
    ...node,
    children: node.children?.map(normalizeNodeTree),
  };
}
