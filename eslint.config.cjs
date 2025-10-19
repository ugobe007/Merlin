const { defineConfig } = require('eslint/config');

module.exports = defineConfig([
  // Generic rules for JS/TSX/JSX/TS files (no type-aware parsing)
  {
    ignores: ['dist/**', 'coverage/**'],
    files: ['**/*.{js,jsx,ts,tsx}'],

    // Use the TypeScript parser implementation so TSX/TS parse correctly,
    // but DO NOT set parserOptions.project here to avoid "file not found in project" errors.
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        // NOTE: project is intentionally omitted to avoid type-aware parsing
      },
    },

    // Register the TypeScript plugin so we can use its rules (no nested extends)
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
      'react-hooks': require('eslint-plugin-react-hooks'),
    },

    // Minimal rules: prefer the TS plugin's no-unused-vars rule over the base one.
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      // keep no-undef off: TS handles undefined checks
      'no-undef': 'off',
    },

    settings: {
      react: {
        version: 'detect',
      },
    },
  },
]);
