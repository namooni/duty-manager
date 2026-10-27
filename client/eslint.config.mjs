import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
import refresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import prettier from 'eslint-config-prettier';
export default tseslint.config(
  {ignores: ['node_modules/**', 'dist/**', 'coverage/**']},
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {globals: {...globals.browser, ...globals.es2022}},
    plugins: {'react-hooks': hooks, 'react-refresh': refresh},
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'react-refresh/only-export-components': ['error', {allowConstantExport: true}],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true},
      ],
    },
  },
  {files: ['**/*.mjs'], languageOptions: {globals: globals.node}},
  prettier,
);
