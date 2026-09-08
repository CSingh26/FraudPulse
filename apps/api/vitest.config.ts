import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Build output duplicates these source tests as CommonJS; execute each source test once.
    include: ['src/**/*.test.ts'],
    fileParallelism: false,
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
});
