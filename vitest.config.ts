import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

const sharedConfig = {
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
      '@server': path.resolve(__dirname, './server')
    }
  }
};

export default defineConfig({
  plugins: [react()],
  ...sharedConfig,
  test: {
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        'client/',
        '**/*.d.ts'
      ]
    },
    projects: [
      {
        ...sharedConfig,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts', 'tests/ai/**/*.test.ts'],
          setupFiles: ['./tests/setup.ts'],
          globals: true
        }
      },
      {
        plugins: [react()],
        ...sharedConfig,
        test: {
          name: 'components',
          environment: 'jsdom',
          include: ['tests/components/**/*.test.tsx'],
          setupFiles: ['./tests/setup.ts'],
          globals: true
        }
      }
    ]
  }
});
