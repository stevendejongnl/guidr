import tsparser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'

export default [
  {
    ignores: ['dist', 'node_modules', 'build', 'coverage']
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        },
        warnOnUnsupportedTypeScriptVersion: false,
        project: ['./tsconfig.json']
      },
      globals: {
        console: 'readonly',
        process: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin
    },
    rules: {
      // Indentation
      indent: [
        'error',
        2,
        {
          flatTernaryExpressions: false,
          SwitchCase: 1,
          ignoredNodes: [
            'TemplateLiteral *',
            'PropertyDefinition[decorators]',
            'TSUnionType',
            'FunctionExpression[params]:has(Identifier[decorators])'
          ]
        }
      ],

      // TypeScript rules
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/await-thenable': 'error',

      // Formatting rules
      'object-curly-spacing': ['error', 'always'],
      'linebreak-style': ['error', 'unix'],
      quotes: ['error', 'single'],
      semi: ['error', 'never'],
      'space-before-function-paren': [
        'error',
        {
          anonymous: 'never',
          named: 'never',
          asyncArrow: 'always'
        }
      ]
    }
  },
  {
    files: ['src/**/*.{test,spec}.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off'
    }
  }
]
