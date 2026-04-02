export interface SliderConfig {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
}

export interface SliderInstance {
  setValue(v: number): void;
  dispose(): void;
}

export function createSlider(
  container: HTMLElement,
  config: SliderConfig,
  onChange: (value: number) => void,
): SliderInstance {
  const row = document.createElement('div');
  row.className = 'property-row';

  const label = document.createElement('label');
  label.className = 'property-label';
  label.textContent = config.label;

  const range = document.createElement('input');
  range.type = 'range';
  range.className = 'property-slider';
  range.min = String(config.min);
  range.max = String(config.max);
  range.step = String(config.step);
  range.value = String(config.value);

  const number = document.createElement('input');
  number.type = 'number';
  number.className = 'property-number';
  number.min = String(config.min);
  number.max = String(config.max);
  number.step = String(config.step);
  number.value = String(config.value);

  let updating = false;

  range.addEventListener('input', () => {
    if (updating) return;
    updating = true;
    const v = Number(range.value);
    number.value = String(v);
    onChange(v);
    updating = false;
  });

  number.addEventListener('input', () => {
    if (updating) return;
    updating = true;
    const v = Number(number.value);
    if (!Number.isNaN(v)) {
      range.value = String(v);
      onChange(v);
    }
    updating = false;
  });

  row.appendChild(label);
  row.appendChild(range);
  row.appendChild(number);
  container.appendChild(row);

  return {
    setValue(v: number) {
      range.value = String(v);
      number.value = String(v);
    },
    dispose() {
      row.remove();
    },
  };
}
