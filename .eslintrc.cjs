module.exports = {
  extends: ['eslint-config-salesforce-typescript'],
  root: true,
  rules: {
    header: 'off',
    complexity: ["error", 500]
  },
  ignorePatterns: [
    ".eslintrc.cjs",
  ],
};
