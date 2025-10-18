// CommonJS ESLint flat-config with Node & Browser globals expressed as languageOptions.globals
const js = require('@eslint/js');
const globals = require('globals');
const reactHooks = require('eslint-plugin-react-hooks');
const reactRefresh = require('eslint-plugin-react-refresh');
const { defineConfig, globalIgnores } = require('eslint/config');

/**
 * NOTE: ESLint flat config does not accept "env".
 * Express needed globals via languageOptions.globals instead.
 */

module.exports = defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        // Merge browser + node globals so files that run in either env parse
        ...globals.browser,
        ...globals.node
      },
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
