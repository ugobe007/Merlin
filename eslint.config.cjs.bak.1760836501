const { defineConfig } = require('eslint/config');

module.exports = defineConfig({
  ignores: ['dist/**'],
  files: ['**/*.{js,jsx,ts,tsx}'],

  // Provide the actual parser implementation object (not a string).
  languageOptions: {
    parser: require('@typescript-eslint/parser'),
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      ecmaFeatures: { jsx: true },
      project: './tsconfig.json',
    },
  },

  // Minimal rules to unblock linting. Avoid plugin 'extends' objects that can nest extends.
  rules: {
    'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    // turn off browser-specific undefined checks (TypeScript handles these)
    'no-undef': 'off',
  },

  settings: {
    react: {
      version: 'detect',
    },
  },
});
