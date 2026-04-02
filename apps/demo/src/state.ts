import { layoutTree, type FlowtextNode, type FlowtextLayoutResult, type LayoutConstraints } from 'flowtext';

export class DemoState extends EventTarget {
  private node: FlowtextNode;
  private constraints: LayoutConstraints;
  private result: FlowtextLayoutResult | null;
  private nodeIndex: Map<string, FlowtextNode>;
  private selectedNodeId: string | null;
  private layoutTimer: ReturnType<typeof setTimeout> | null;

  constructor(node: FlowtextNode, constraints: LayoutConstraints) {
    super();
    this.node = node;
    this.constraints = constraints;
    this.result = null;
    this.nodeIndex = new Map();
    this.selectedNodeId = null;
    this.layoutTimer = null;
    this.buildIndex(node);
    this.scheduleLayout();
  }

  getNode(): FlowtextNode {
    return this.node;
  }

  setNode(node: FlowtextNode): void {
    this.node = node;
    this.buildIndex(node);
    this.dispatchEvent(new CustomEvent('node-change', { detail: node }));
    this.scheduleLayout();
  }

  updateStyle(nodeId: string, key: keyof NonNullable<FlowtextNode['style']>, value: string | number | undefined): void {
    const node = this.nodeIndex.get(nodeId);
    if (!node) return;
    if (!node.style) {
      node.style = {};
    }
    (node.style as Record<string, string | number | undefined>)[key] = value;
    this.dispatchEvent(new CustomEvent('node-change', { detail: this.node }));
    this.scheduleLayout();
  }

  /** Batch multiple style updates into a single layout pass */
  updateStyles(nodeId: string, updates: Record<string, string | number | undefined>): void {
    const node = this.nodeIndex.get(nodeId);
    if (!node) return;
    if (!node.style) {
      node.style = {};
    }
    for (const [key, value] of Object.entries(updates)) {
      (node.style as Record<string, string | number | undefined>)[key] = value;
    }
    this.dispatchEvent(new CustomEvent('node-change', { detail: this.node }));
    this.scheduleLayout();
  }

  updateText(nodeId: string, text: string): void {
    const node = this.nodeIndex.get(nodeId);
    if (!node) return;
    node.text = text;
    this.dispatchEvent(new CustomEvent('node-change', { detail: this.node }));
    this.scheduleLayout();
  }

  getResult(): FlowtextLayoutResult | null {
    return this.result;
  }

  getSelectedNodeId(): string | null {
    return this.selectedNodeId;
  }

  setSelectedNodeId(id: string | null): void {
    this.selectedNodeId = id;
    this.dispatchEvent(new CustomEvent('selection-change', { detail: id }));
  }

  reorderChild(childId: string, newIndex: number): void {
    // Find parent that contains this child
    const parent = this.findParentOf(childId);
    if (!parent || !parent.children) return;

    const oldIndex = parent.children.findIndex((c) => c.id === childId);
    if (oldIndex === -1) return;

    const [child] = parent.children.splice(oldIndex, 1);
    // Adjust index if removing before insertion point
    const adjustedIndex = newIndex > oldIndex ? newIndex - 1 : newIndex;
    parent.children.splice(adjustedIndex, 0, child);

    this.dispatchEvent(new CustomEvent('node-change', { detail: this.node }));
    this.scheduleLayout();
  }

  private findParentOf(childId: string): FlowtextNode | null {
    const search = (node: FlowtextNode): FlowtextNode | null => {
      if (node.children) {
        for (const child of node.children) {
          if (child.id === childId) return node;
          const found = search(child);
          if (found) return found;
        }
      }
      return null;
    };
    return search(this.node);
  }

  setConstraints(constraints: LayoutConstraints): void {
    this.constraints = constraints;
    this.scheduleLayout();
  }

  private buildIndex(node: FlowtextNode): void {
    this.nodeIndex.clear();
    const traverse = (n: FlowtextNode): void => {
      this.nodeIndex.set(n.id, n);
      if (n.children) {
        for (const child of n.children) {
          traverse(child);
        }
      }
    };
    traverse(node);
  }

  private scheduleLayout(): void {
    if (this.layoutTimer !== null) {
      clearTimeout(this.layoutTimer);
    }
    this.layoutTimer = setTimeout(() => {
      this.layoutTimer = null;
      layoutTree(this.node, this.constraints)
        .then(result => {
          this.result = result;
          this.dispatchEvent(new CustomEvent('result-change', { detail: result }));
        })
        .catch(error => {
          this.dispatchEvent(new CustomEvent('layout-error', { detail: error }));
        });
    }, 30);
  }
}
