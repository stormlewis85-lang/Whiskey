import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 30000,
    // Run tests sequentially to avoid overwhelming the server
    fileParallelism: false,
    isolate: false,
  },
});
