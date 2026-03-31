export const FLOWTEXT_SCHEMA_VERSION = 1 as const;

export type FlowtextNodeType = 'view' | 'text' | 'inline' | 'block';

export type FlowtextStyle = {
  display?: 'flex' | 'none';
  flexDirection?: 'row' | 'column';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
  alignItems?: 'stretch' | 'flex-start' | 'center' | 'flex-end' | 'baseline';
  alignSelf?: 'auto' | 'stretch' | 'flex-start' | 'center' | 'flex-end' | 'baseline';
  flexGrow?: number;
  flexShrink?: number;
  width?: number;
  height?: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  padding?: number;
  margin?: number;
  fontSize?: number;
  lineHeight?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  whiteSpace?: 'normal' | 'pre-wrap';
  overflowWrap?: 'break-word';
};

export type TextMeasureOptions = {
  locale?: string;
  fontProfile?: string;
};

export type FlowtextNode = {
  id: string;
  type: FlowtextNodeType;
  style?: FlowtextStyle;
  text?: string;
  children?: FlowtextNode[];
  textOptions?: TextMeasureOptions;
};

export type LayoutConstraints = {
  width?: number;
  height?: number;
};

export type FlowtextLayoutLine = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type FlowtextLayoutResult = {
  schemaVersion: typeof FLOWTEXT_SCHEMA_VERSION;
  id: string;
  type: FlowtextNodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  overflow?: {
    x: boolean;
    y: boolean;
  };
  baseline?: number;
  limitations?: string[];
  lines?: FlowtextLayoutLine[];
  children?: FlowtextLayoutResult[];
};

export type FlowtextErrorCode =
  | 'INVALID_NODE'
  | 'UNSUPPORTED_STYLE'
  | 'MEASURE_FAILED';
