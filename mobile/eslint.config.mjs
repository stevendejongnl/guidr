import tsparser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'

const SKIP_TEST_SELECTORS = [
  { selector: "CallExpression[callee.object.name='test'][callee.property.name='skip']", message: 'test.skip is not allowed — remove the skip or delete the test' },
  { selector: "CallExpression[callee.object.name='it'][callee.property.name='skip']", message: 'it.skip is not allowed — remove the skip or delete the test' },
  { selector: "CallExpression[callee.object.name='describe'][callee.property.name='skip']", message: 'describe.skip is not allowed — remove the skip or delete the test' },
  { selector: "CallExpression[callee.name='xtest']", message: 'xtest is not allowed — remove the skip or delete the test' },
  { selector: "CallExpression[callee.name='xit']", message: 'xit is not allowed — remove the skip or delete the test' },
  { selector: "CallExpression[callee.name='xdescribe']", message: 'xdescribe is not allowed — remove the skip or delete the test' },
]

export default [
  { ignores: ['node_modules', 'coverage'] },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        warnOnUnsupportedTypeScriptVersion: false,
        project: ['./tsconfig.json'],
      },
      globals: { ...globals.node, ...globals.es2021, ...globals.jest },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react,
      'react-hooks': reactHooks,
    },
    settings: { react: { version: '19.0' } },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...react.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      indent: ['error', 2, {
        flatTernaryExpressions: false,
        SwitchCase: 1,
        ignoredNodes: ['TemplateLiteral *', 'PropertyDefinition[decorators]', 'TSUnionType', 'FunctionExpression[params]:has(Identifier[decorators])'],
      }],
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      '@typescript-eslint/await-thenable': 'error',
      'object-curly-spacing': ['error', 'always'],
      'linebreak-style': ['error', 'unix'],
      quotes: ['error', 'single'],
      semi: ['error', 'never'],
      'space-before-function-paren': ['error', { anonymous: 'never', named: 'never', asyncArrow: 'always' }],
    },
  },
  {
    files: ['src/**/*.{test,spec}.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      'no-restricted-syntax': ['error', ...SKIP_TEST_SELECTORS],
    },
  },
]
