const path = require('path');
const { defineConfig } = require('eslint/config');

module.exports = defineConfig([
  // 1) Fast general config (no type-aware parsing) for most files
  {
    ignores: ['dist/**', 'coverage/**'],
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true }
      }
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
      'react-hooks': require('eslint-plugin-react-hooks')
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {
        varsIgnorePattern: '^[A-Z_]',
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],
      'no-undef': 'off'
    },
    settings: {
      react: { version: 'detect' }
    }
  },

  // 2) Type-aware config (enables rules requiring type info) for files that are part of tsconfig.eslint.json
  {
    files: [
      'src/**/*.{ts,tsx}',
      'vite.config.ts',
      'src/**/__tests__/**/*.{ts,tsx,js,jsx}'
    ],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        project: path.resolve(__dirname, './tsconfig.eslint.json')
      }
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin')
    },
    rules: {
      // relax these to warnings for now so we can fix code gradually without breaking builds
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // no-floating-promises: warning and allow void-prefixed ignores
      '@typescript-eslint/no-floating-promises': ['warn', { ignoreVoid: true }],

      // no-misused-promises: warn and avoid strict void-return-only checks in JSX attrs
      '@typescript-eslint/no-misused-promises': ['warn', {
        checksVoidReturn: false,
        checksConditionals: true
      }]
    }
  }
]);
