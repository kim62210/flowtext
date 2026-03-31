import {
  layoutWithLines,
  prepareWithSegments,
  setLocale,
  type LayoutLine,
  type PreparedTextWithSegments,
} from '@chenglou/pretext';

export type TextMeasureRequest = {
  text: string;
  font: string;
  lineHeight: number;
  width: number;
  locale?: string;
  whiteSpace?: 'normal' | 'pre-wrap';
};

export type PreparedTextMeasurement = {
  request: TextMeasureRequest;
  cacheKey: string;
  prepared?: PreparedTextWithSegments;
};

export type MeasuredTextLine = {
  text: string;
  width: number;
  start: number;
  end: number;
};

export type TextMeasureResult = {
  width: number;
  height: number;
  lineCount: number;
  lines: MeasuredTextLine[];
};

export type TextMeasurementAdapter = {
  prepare(request: TextMeasureRequest): PreparedTextMeasurement;
  layout(prepared: PreparedTextMeasurement): TextMeasureResult | Promise<TextMeasureResult>;
};

export type CreateTextMeasureRequestInput = {
  text: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  width: number;
  locale?: string;
  fontWeight?: string | number;
  whiteSpace?: 'normal' | 'pre-wrap';
};

export function createTextMeasureRequest(
  input: CreateTextMeasureRequestInput,
): TextMeasureRequest {
  const fontWeight = input.fontWeight ? `${input.fontWeight} ` : '';

  return {
    text: input.text,
    font: `${fontWeight}${input.fontSize}px ${input.fontFamily}`.trim(),
    lineHeight: input.lineHeight,
    width: input.width,
    locale: input.locale,
    whiteSpace: input.whiteSpace,
  };
}

export async function measurePreparedText(
  adapter: TextMeasurementAdapter,
  prepared: PreparedTextMeasurement,
): Promise<TextMeasureResult> {
  return adapter.layout(prepared);
}

export function createPretextMeasurementAdapter(): TextMeasurementAdapter {
  return {
    prepare(request) {
      if (request.locale) {
        setLocale(request.locale);
      }

      const prepared = prepareWithSegments(request.text, request.font, {
        whiteSpace: request.whiteSpace,
      });

      return {
        request,
        cacheKey: [request.font, request.text, request.locale ?? '', request.whiteSpace ?? 'normal'].join('::'),
        prepared,
      };
    },

    layout(prepared) {
      if (!prepared.prepared) {
        throw new Error('Prepared text payload is missing.');
      }

      const result = layoutWithLines(
        prepared.prepared,
        prepared.request.width,
        prepared.request.lineHeight,
      );

      return {
        width: maxLineWidth(result.lines),
        height: result.height,
        lineCount: result.lineCount,
        lines: result.lines.map(mapLayoutLine),
      };
    },
  };
}

function maxLineWidth(lines: LayoutLine[]): number {
  let width = 0;

  for (const line of lines) {
    if (line.width > width) {
      width = line.width;
    }
  }

  return width;
}

function mapLayoutLine(line: LayoutLine): MeasuredTextLine {
  return {
    text: line.text,
    width: line.width,
    start: line.start.graphemeIndex,
    end: line.end.graphemeIndex,
  };
}
