/** Shared visual constants across all renderers for consistent appearance */

export const COLORS = {
  stroke: '#94a3b8',        // slate-400 -- node borders
  strokeSelected: '#6366f1', // indigo -- selected node
  text: '#1e293b',          // slate-800 -- body text
  label: '#94a3b8',         // slate-400 -- node ID labels
  labelSelected: '#6366f1',
};

export const LABEL_FONT_SIZE = 8;
export const LABEL_OFFSET_X = 3;
export const LABEL_OFFSET_Y = 10;

/**
 * Compute the y position for SVG/Canvas text baseline.
 * FlowtextLayoutResult lines have y = top of line, height = line height.
 * For a reasonable baseline approximation, use y + height * 0.78.
 * This fraction works for most Latin fonts at common sizes.
 */
export function baselineY(lineY: number, lineHeight: number): number {
  return lineY + lineHeight * 0.78;
}
