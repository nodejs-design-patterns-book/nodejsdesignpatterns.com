import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections'

const config = {
  themes: ['material-theme-ocean', 'min-light'],
  themeCssSelector(theme) {
    return `[data-code-theme='${theme.name}']`
  },
  plugins: [pluginCollapsibleSections({})],
  useDarkModeMediaQuery: false,
  styleOverrides: {
    /* Use the self-hosted Cascadia Mono instead of the generic system stack */
    codeFontFamily:
      "var(--font-base-mono), ui-monospace, Menlo, Consolas, 'Liberation Mono', monospace",
    codeFontSize: '0.875rem',
    codeLineHeight: '1.65',
    uiFontFamily: 'var(--font-base-sans), system-ui, sans-serif',
  },
}

export default config
