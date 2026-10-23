import js from '@eslint/js';
import globals from 'globals';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.turbo/**',
      'docs/**',
      '**/test-results/**',
      '**/playwright-report/**',
      'apps/mobile/.expo/**',
      'apps/mobile/android/**',
      'apps/mobile/ios/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.tsx'],
    plugins: { 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
    },
  },
  {
    files: ['**/*.{js,mjs}'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    // React Native has no DOM: jsx-a11y's rules target HTML elements. RN accessibility props are
    // reviewed by hand and with the platform screen readers instead.
    files: ['apps/mobile/**/*.tsx'],
    rules: Object.fromEntries(Object.keys(jsxA11y.flatConfigs.recommended.rules).map((r) => [r, 'off'])),
  },
  {
    files: ['apps/mobile/*.config.js', 'apps/mobile/plugins/*.js'],
    languageOptions: { sourceType: 'commonjs' },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
);
