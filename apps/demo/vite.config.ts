import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: '.',
  resolve: {
    alias: {
      flowtext: resolve(__dirname, '../../packages/flowtext/src'),
    },
  },
  build: {
    outDir: 'dist',
  },
});
