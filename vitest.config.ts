import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [
      ...configDefaults.exclude,
      '.worktrees/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
      include: [
        'packages/flowtext/src/**/*.ts',
        'apps/demo/src/**/*.ts',
      ],
      exclude: [
        ...configDefaults.exclude,
        '.worktrees/**',
        '**/*.test.ts',
      ],
    },
  },
});
