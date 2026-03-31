import { describe, expect, it } from 'vitest';

import {
  FLOWTEXT_SCHEMA_VERSION,
  type FlowtextErrorCode,
  type FlowtextLayoutResult,
  type FlowtextNode,
  type LayoutConstraints,
} from './index';

describe('Flowtext public type contracts', () => {
  it('exports the schema version constant', () => {
    expect(FLOWTEXT_SCHEMA_VERSION).toBe(1);
  });

  it('accepts a renderer-neutral node shape', () => {
    const node: FlowtextNode = {
      id: 'root',
      type: 'view',
      children: [
        {
          id: 'headline',
          type: 'text',
          text: 'Flowtext',
        },
      ],
    };

    expect(node.children?.[0]?.type).toBe('text');
  });

  it('accepts root layout constraints', () => {
    const constraints: LayoutConstraints = {
      width: 320,
      height: 180,
    };

    expect(constraints.width).toBe(320);
  });

  it('accepts the documented public error codes', () => {
    const codes: FlowtextErrorCode[] = [
      'INVALID_NODE',
      'UNSUPPORTED_STYLE',
      'MEASURE_FAILED',
    ];

    expect(codes).toHaveLength(3);
  });

  it('accepts the public layout result shape', () => {
    const result: FlowtextLayoutResult = {
      schemaVersion: FLOWTEXT_SCHEMA_VERSION,
      id: 'root',
      type: 'view',
      x: 0,
      y: 0,
      width: 320,
      height: 180,
    };

    expect(result.schemaVersion).toBe(1);
  });
});
