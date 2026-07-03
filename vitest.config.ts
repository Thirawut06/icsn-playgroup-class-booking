import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    exclude: [
      'node_modules/**', 
      '.next/**', 
      'e2e/**', 
      'playwright-report/**', 
      'test-results/**',
      // Exclude integration tests in CI environment since they need real DB access
      ...(process.env.CI ? ['**/*.integration.test.ts'] : [])
    ],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
