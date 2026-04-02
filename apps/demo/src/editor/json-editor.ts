export interface JsonEditorInstance {
  setValue(json: string): void;
  getValue(): string;
  dispose(): void;
}

export async function createJsonEditor(
  container: HTMLElement,
  initialValue: string,
  onChange: (value: string) => void,
): Promise<JsonEditorInstance> {
  const { EditorView, keymap, lineNumbers, highlightActiveLine } = await import('@codemirror/view');
  const { EditorState } = await import('@codemirror/state');
  const { json } = await import('@codemirror/lang-json');
  const { defaultKeymap, history, historyKeymap } = await import('@codemirror/commands');
  const {
    syntaxHighlighting,
    defaultHighlightStyle,
    bracketMatching,
    foldGutter,
  } = await import('@codemirror/language');

  let suppressChange = false;

  const darkTheme = EditorView.theme({
    '&': {
      backgroundColor: '#1e1e2e',
      color: '#cdd6f4',
      height: '100%',
    },
    '.cm-content': {
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: '13px',
      lineHeight: '1.7',
      caretColor: '#f5e0dc',
    },
    '.cm-gutters': {
      backgroundColor: '#1e1e2e',
      color: '#6c7086',
      border: 'none',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(147, 153, 178, 0.08)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(147, 153, 178, 0.08)',
    },
    '.cm-selectionBackground': {
      backgroundColor: 'rgba(147, 153, 178, 0.2) !important',
    },
    '.cm-cursor': {
      borderLeftColor: '#f5e0dc',
    },
  });

  const state = EditorState.create({
    doc: initialValue,
    extensions: [
      lineNumbers(),
      highlightActiveLine(),
      history(),
      bracketMatching(),
      foldGutter(),
      json(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      darkTheme,
      keymap.of([...defaultKeymap, ...historyKeymap]),
      EditorView.updateListener.of((update) => {
        if (suppressChange) return;
        if (!update.docChanged) return;
        onChange(update.state.doc.toString());
      }),
    ],
  });

  const view = new EditorView({
    state,
    parent: container,
  });

  return {
    setValue(newJson: string) {
      const current = view.state.doc.toString();
      if (current === newJson) return;

      suppressChange = true;
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: newJson,
        },
      });
      suppressChange = false;
    },
    getValue() {
      return view.state.doc.toString();
    },
    dispose() {
      view.destroy();
    },
  };
}
