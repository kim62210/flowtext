import { basicTree } from './examples/basic-tree';
import { renderDemoSvg } from './main';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Missing #app container for the Flowtext demo.');
}

const svg = await renderDemoSvg(basicTree, { width: 320, height: 240 });

app.innerHTML = svg;
