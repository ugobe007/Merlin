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
  plugins: {
    '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
    'react-hooks': require('eslint-plugin-react-hooks')
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended'
  ],
  rules: {
    'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }]
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
});
