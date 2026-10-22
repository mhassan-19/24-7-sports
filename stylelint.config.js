// Logical properties only: physical left/right/top-left etc. break RTL.
export default {
  extends: ['stylelint-config-standard'],
  ignoreFiles: ['**/dist/**', '**/node_modules/**', '**/test-results/**'],
  plugins: ['stylelint-use-logical'],
  rules: {
    'csstools/use-logical': ['always', { except: ['top', 'bottom', 'margin-top', 'margin-bottom', 'padding-top', 'padding-bottom', 'height', 'width', 'min-height', 'max-height', 'min-width', 'max-width'] }],
    'selector-class-pattern': null,
    'custom-property-pattern': null,
    'keyframes-name-pattern': null,
    'value-keyword-case': 'lower',
    'import-notation': 'string',
    'no-descending-specificity': null,
  },
};
