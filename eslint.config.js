// CommonJS ESLint config with Node & Browser envs and notes for enabling TS linting
const js = require('@eslint/js');
const globals = require('globals');
const reactHooks = require('eslint-plugin-react-hooks');
const reactRefresh = require('eslint-plugin-react-refresh');
const { defineConfig, globalIgnores } = require('eslint/config');

// If you want full TypeScript linting, install these:
// npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin
// then uncomment parser/plugin lines below.
module.exports = defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      env: {
        browser: true,
        node: true,
        es2021: true
      },
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
      // parser: '@typescript-eslint/parser', // enable after installing parser
    },
    // plugins: ['@typescript-eslint'], // enable after installing plugin
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
      // 'plugin:@typescript-eslint/recommended' // enable after installing parser/plugin
    ],
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
]);
