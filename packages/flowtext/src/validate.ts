import type { FlowtextErrorCode, FlowtextNode, FlowtextStyle } from './types';

const SUPPORTED_STYLE_KEYS = new Set<keyof FlowtextStyle>([
  'flexDirection',
  'justifyContent',
  'alignItems',
  'alignSelf',
  'flexGrow',
  'flexShrink',
  'width',
  'height',
  'minWidth',
  'maxWidth',
  'minHeight',
  'maxHeight',
  'padding',
  'margin',
  'fontSize',
  'lineHeight',
  'fontFamily',
  'fontWeight',
  'whiteSpace',
]);

export class FlowtextError extends Error {
  readonly code: FlowtextErrorCode;

  constructor(code: FlowtextErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'FlowtextError';
  }
}

export function validateNodeTree(node: FlowtextNode): void {
  if (!node.id || typeof node.id !== 'string') {
    throw new FlowtextError('INVALID_NODE', 'Every public node must include a string id.');
  }

  if (!node.type || typeof node.type !== 'string') {
    throw new FlowtextError('INVALID_NODE', 'Every public node must include a node type.');
  }

  validateStyle(node.style);
  node.children?.forEach(validateNodeTree);
}

export function wrapMeasurementError(error: unknown): FlowtextError {
  if (error instanceof FlowtextError) {
    return error;
  }

  const message = error instanceof Error ? error.message : 'Unknown text measurement failure.';

  return new FlowtextError('MEASURE_FAILED', message);
}

function validateStyle(style: FlowtextStyle | undefined): void {
  if (!style) {
    return;
  }

  for (const key of Object.keys(style)) {
    if (!SUPPORTED_STYLE_KEYS.has(key as keyof FlowtextStyle)) {
      throw new FlowtextError('UNSUPPORTED_STYLE', `Unsupported style key: ${key}`);
    }
  }
}
