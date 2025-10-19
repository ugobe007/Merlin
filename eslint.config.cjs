const { defineConfig } = require('eslint/config');

module.exports = defineConfig({
  ignores: ['dist/**'],
  files: ['**/*.{js,jsx,ts,tsx}'],
  languageOptions: {
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      ecmaFeatures: { jsx: true },
      project: './tsconfig.json'
    }
  },
  // Minimal rules only to unblock linting — no 'extends' or plugin configs to avoid nested/lookup issues.
  rules: {
    'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    'no-undef': 'off'
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
});
