import nextConfig from 'eslint-config-next';

const [nextBase, nextTs, ...rest] = nextConfig;

const eslintConfig = [
  nextBase,
  {
    ...nextTs,
    rules: {
      ...nextTs.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  ...rest,
];

export default eslintConfig;
