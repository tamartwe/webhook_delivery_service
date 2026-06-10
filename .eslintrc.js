/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'import', 'prettier'],
  extends: [
    'airbnb-base',
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/typescript',
    'prettier', // must be last — disables rules that conflict with Prettier
    'plugin:prettier/recommended',
  ],
  rules: {
    'no-console': 'error',
    'prettier/prettier': 'error',

    // Named exports are used consistently — default export not required
    'import/prefer-default-export': 'off',

    // Allow `void expr` as a statement to explicitly mark intentional floating promises
    'no-void': ['error', { allowAsStatement: true }],

    // Two small error classes in one file is fine
    'max-classes-per-file': 'off',

    // Allow underscore-prefixed parameters for intentionally unused args (e.g. Express _next)
    'no-underscore-dangle': ['error', { allow: ['_reset'] }],
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],

    // uuid and other libs import fine without extensions
    'import/extensions': ['error', 'ignorePackages', { ts: 'never', js: 'never' }],

    // Sequential retry with exponential backoff requires await-in-loop by design
    'no-await-in-loop': 'off',

    // for...of is readable and preferred over forEach when async is involved
    'no-restricted-syntax': [
      'error',
      { selector: 'LabeledStatement', message: 'Labels are not allowed.' },
      { selector: 'WithStatement', message: 'With is not allowed.' },
    ],
  },
  ignorePatterns: ['dist/', 'node_modules/', 'coverage/', 'vitest.config.ts'],
};
