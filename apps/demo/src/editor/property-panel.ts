import type { FlowtextNode, FlowtextStyle } from 'flowtext';
import type { DemoState } from '../state';
import { createSlider, type SliderInstance } from '../ui/slider';

const NUMERIC_PROPS: { key: keyof FlowtextStyle; label: string; min: number; max: number; step: number }[] = [
  { key: 'width', label: 'width', min: 0, max: 2000, step: 1 },
  { key: 'height', label: 'height', min: 0, max: 2000, step: 1 },
  { key: 'padding', label: 'padding', min: 0, max: 100, step: 1 },
  { key: 'margin', label: 'margin', min: 0, max: 100, step: 1 },
  { key: 'flexGrow', label: 'flexGrow', min: 0, max: 10, step: 0.1 },
  { key: 'flexShrink', label: 'flexShrink', min: 0, max: 10, step: 0.1 },
  { key: 'minWidth', label: 'minWidth', min: 0, max: 2000, step: 1 },
  { key: 'maxWidth', label: 'maxWidth', min: 0, max: 2000, step: 1 },
  { key: 'minHeight', label: 'minHeight', min: 0, max: 2000, step: 1 },
  { key: 'maxHeight', label: 'maxHeight', min: 0, max: 2000, step: 1 },
  { key: 'fontSize', label: 'fontSize', min: 8, max: 72, step: 1 },
  { key: 'lineHeight', label: 'lineHeight', min: 8, max: 120, step: 1 },
];

const ENUM_PROPS: { key: keyof FlowtextStyle; label: string; options: string[] }[] = [
  { key: 'flexDirection', label: 'flexDirection', options: ['row', 'column'] },
  { key: 'justifyContent', label: 'justifyContent', options: ['flex-start', 'center', 'flex-end', 'space-between'] },
  { key: 'alignItems', label: 'alignItems', options: ['stretch', 'flex-start', 'center', 'flex-end', 'baseline'] },
  { key: 'alignSelf', label: 'alignSelf', options: ['auto', 'stretch', 'flex-start', 'center', 'flex-end', 'baseline'] },
  { key: 'whiteSpace', label: 'whiteSpace', options: ['normal', 'pre-wrap'] },
];

export function createPropertyPanel(
  container: HTMLElement,
  state: DemoState,
): { dispose(): void } {
  const panel = document.createElement('div');
  panel.className = 'property-panel';
  container.appendChild(panel);

  const sliders: SliderInstance[] = [];
  const listeners: (() => void)[] = [];

  function render() {
    panel.innerHTML = '';
    sliders.length = 0;

    const node = state.getNode();
    const selectedId = state.getSelectedNodeId();

    // Node tree
    const treeEl = document.createElement('div');
    treeEl.className = 'node-tree';
    renderNodeTree(treeEl, node, 0, selectedId, state);
    panel.appendChild(treeEl);

    // Find selected node
    const selectedNode = findNode(node, selectedId ?? node.id);
    if (!selectedNode) return;

    const style = selectedNode.style ?? {};

    // Text property (for text nodes)
    if (selectedNode.type === 'text') {
      const textGroup = createGroup(panel, 'Text');
      const row = document.createElement('div');
      row.className = 'property-row';
      const label = document.createElement('label');
      label.className = 'property-label';
      label.textContent = 'text';
      const input = document.createElement('textarea');
      input.className = 'property-text';
      input.value = selectedNode.text ?? '';
      input.rows = 3;
      input.style.resize = 'vertical';
      input.addEventListener('input', () => {
        state.updateText(selectedNode.id, input.value);
      });
      row.appendChild(label);
      row.appendChild(input);
      textGroup.appendChild(row);
    }

    // Layout properties
    const layoutGroup = createGroup(panel, 'Layout');
    for (const prop of NUMERIC_PROPS) {
      const val = style[prop.key];
      if (val === undefined && !isRelevantProp(selectedNode, prop.key)) continue;
      const slider = createSlider(layoutGroup, {
        label: prop.label,
        min: prop.min,
        max: prop.max,
        step: prop.step,
        value: (val as number) ?? 0,
      }, (v) => {
        state.updateStyle(selectedNode.id, prop.key, v);
      });
      sliders.push(slider);
    }

    // Enum properties
    const flexGroup = createGroup(panel, 'Flex');
    for (const prop of ENUM_PROPS) {
      const val = style[prop.key];
      if (val === undefined && !isRelevantProp(selectedNode, prop.key)) continue;
      const row = document.createElement('div');
      row.className = 'property-row';
      const label = document.createElement('label');
      label.className = 'property-label';
      label.textContent = prop.label;
      const select = document.createElement('select');
      select.className = 'property-select';
      for (const opt of prop.options) {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        if (opt === val) option.selected = true;
        select.appendChild(option);
      }
      select.addEventListener('change', () => {
        state.updateStyle(selectedNode.id, prop.key, select.value);
      });
      row.appendChild(label);
      row.appendChild(select);
      flexGroup.appendChild(row);
    }

    // Font family
    if (selectedNode.type === 'text') {
      const fontGroup = createGroup(panel, 'Font');
      const row = document.createElement('div');
      row.className = 'property-row';
      const label = document.createElement('label');
      label.className = 'property-label';
      label.textContent = 'fontFamily';
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'property-text';
      input.value = (style.fontFamily as string) ?? 'sans-serif';
      input.addEventListener('change', () => {
        state.updateStyle(selectedNode.id, 'fontFamily', input.value);
      });
      row.appendChild(label);
      row.appendChild(input);
      fontGroup.appendChild(row);
    }

    // Supported types note
    const note = document.createElement('div');
    note.style.cssText = 'margin-top:16px;font-size:11px;color:var(--color-text-secondary);';
    note.textContent = 'Supported node types: view, text';
    panel.appendChild(note);
  }

  render();

  const onNodeChange = () => render();
  const onSelectionChange = () => render();

  state.addEventListener('node-change', onNodeChange);
  state.addEventListener('selection-change', onSelectionChange);

  listeners.push(
    () => state.removeEventListener('node-change', onNodeChange),
    () => state.removeEventListener('selection-change', onSelectionChange),
  );

  return {
    dispose() {
      for (const unsub of listeners) unsub();
      for (const s of sliders) s.dispose();
      panel.remove();
    },
  };
}

function createGroup(parent: HTMLElement, title: string): HTMLElement {
  const group = document.createElement('div');
  group.className = 'property-group';
  const titleEl = document.createElement('div');
  titleEl.className = 'property-group-title';
  titleEl.textContent = title;
  group.appendChild(titleEl);
  parent.appendChild(group);
  return group;
}

function renderNodeTree(
  container: HTMLElement,
  node: FlowtextNode,
  depth: number,
  selectedId: string | null,
  state: DemoState,
) {
  const item = document.createElement('div');
  item.className = 'node-tree-item';
  if (node.id === selectedId) item.classList.add('selected');
  item.style.paddingLeft = `${8 + depth * 16}px`;
  item.textContent = `${node.type}#${node.id}`;
  item.addEventListener('click', () => {
    state.setSelectedNodeId(node.id);
  });
  container.appendChild(item);

  if (node.children) {
    for (const child of node.children) {
      renderNodeTree(container, child, depth + 1, selectedId, state);
    }
  }
}

function findNode(root: FlowtextNode, id: string): FlowtextNode | null {
  if (root.id === id) return root;
  if (root.children) {
    for (const child of root.children) {
      const found = findNode(child, id);
      if (found) return found;
    }
  }
  return null;
}

function isRelevantProp(node: FlowtextNode, key: string): boolean {
  const layoutProps = ['width', 'height', 'padding', 'margin', 'flexDirection', 'justifyContent', 'alignItems', 'flexGrow', 'flexShrink'];
  const textProps = ['fontSize', 'lineHeight', 'fontFamily', 'fontWeight', 'whiteSpace'];
  if (node.type === 'text') return [...layoutProps, ...textProps].includes(key);
  return layoutProps.includes(key);
}
