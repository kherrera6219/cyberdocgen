// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';
import security from 'eslint-plugin-security';

export default [js.configs.recommended, {
  files: ['**/*.{ts,tsx}'],
  languageOptions: {
    parser: typescriptParser,
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      project: ['./tsconfig.eslint.json'],
      // eslint-disable-next-line no-undef
      tsconfigRootDir: process.cwd(),
    },
    globals: {
      process: 'readonly',
      console: 'readonly',
    },
  },

  plugins: {
    '@typescript-eslint': typescript,
    'react-hooks': reactHooks,
    security,
  },
  rules: {
    ...typescript.configs.recommended.rules,
    ...reactHooks.configs.recommended.rules,
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
    'security/detect-object-injection': 'warn',
    'security/detect-non-literal-regexp': 'warn',
    'security/detect-unsafe-regex': 'warn',
    'no-console': 'off',
    'prefer-const': 'error',
    'no-var': 'error',
    'no-duplicate-imports': 'warn',
    'no-unused-expressions': 'warn',
    'no-undef': 'off',
  },
}, {
  files: ['client/**/*.{ts,tsx}'],
  rules: {
    // Frontend React patterns frequently trigger false positives for this rule.
    // Keep server-side object-injection checks enabled.
    'security/detect-object-injection': 'off',
  },
}, {
  ignores: [
    'dist/**',
    'node_modules/**',
    '.cache/**',
    '.local/**',
    '.upm/**',
    'development-archive/**',
    'test-results/**',
    'playwright-report/**',
    'client/public/sw.js',
    'client/src/stories/**',
    '.storybook/**'
  ],
}, {
  files: ['public/sw.js'],
  languageOptions: {
    globals: {
      self: 'readonly',
      caches: 'readonly',
      fetch: 'readonly',
    },
  },
}, {
  files: ['scripts/**/*.js'],
  languageOptions: {
    globals: {
      console: 'readonly',
      process: 'readonly',
      setTimeout: 'readonly',
      clearTimeout: 'readonly',
    },
  },
}, {
  files: ['**/tests/**', '**/*.test.ts', '**/*.test.tsx'],
  languageOptions: {
    globals: {
      describe: 'readonly',
      it: 'readonly',
      expect: 'readonly',
      beforeAll: 'readonly',
      afterAll: 'readonly',
      beforeEach: 'readonly',
      afterEach: 'readonly',
      vi: 'readonly',
      test: 'readonly',
    },
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-unnecessary-type-assertion': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    'security/detect-object-injection': 'off',
    'security/detect-non-literal-regexp': 'off',
    'security/detect-unsafe-regex': 'off',
    'no-console': 'off',
    'no-undef': 'off',
  },
}, ...storybook.configs["flat/recommended"]];
