export interface TabConfig {
  id: string;
  label: string;
}

export interface TabInstance {
  setActive(id: string): void;
  dispose(): void;
}

export function createTabs(
  container: HTMLElement,
  tabs: TabConfig[],
  onSelect: (id: string) => void,
  initialId?: string,
): TabInstance {
  const buttons: HTMLButtonElement[] = [];

  for (const tab of tabs) {
    const button = document.createElement('button');
    button.className = 'tab-button';
    button.textContent = tab.label;
    button.dataset.tabId = tab.id;

    if (tab.id === (initialId ?? tabs[0]?.id)) {
      button.classList.add('active');
    }

    button.addEventListener('click', () => {
      for (const b of buttons) {
        b.classList.toggle('active', b === button);
      }
      onSelect(tab.id);
    });

    buttons.push(button);
    container.appendChild(button);
  }

  return {
    setActive(id: string) {
      for (const b of buttons) {
        b.classList.toggle('active', b.dataset.tabId === id);
      }
    },
    dispose() {
      for (const b of buttons) {
        b.remove();
      }
      buttons.length = 0;
    },
  };
}
