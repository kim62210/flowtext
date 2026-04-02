import type { FlowtextNode, LayoutConstraints } from 'flowtext';
import { playgroundPreset } from './playground';
import { textReflowPreset } from './text-reflow';
import { ogImagePreset } from './og-image';

export interface Preset {
  id: string;
  label: string;
  description: string;
  node: FlowtextNode;
  constraints: LayoutConstraints;
  initialSelectedNodeId: string;
}

export { playgroundPreset, textReflowPreset, ogImagePreset };
export const presets: Preset[] = [playgroundPreset, textReflowPreset, ogImagePreset];
