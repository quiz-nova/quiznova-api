import path from 'node:path';

import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, './src/app/shared'),
      '@Core': path.resolve(__dirname, './src/app/core'),
      '@Features': path.resolve(__dirname, './src/app/features'),
      '@Environments': path.resolve(__dirname, './src/environments'),
      '@StoreFeatures': path.resolve(__dirname, './src/store-features'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    exclude: [...configDefaults.exclude, 'e2e/**'],
    setupFiles: './test-setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        '**/node_modules/**',
        '**/e2e/**',
        '**/*.spec.ts',
        '**/*.config.*',
        '**/environments/**',
        '**/main.ts',
        '**/test-setup.ts',
        'public/**',
      ],
    },
  },
});
