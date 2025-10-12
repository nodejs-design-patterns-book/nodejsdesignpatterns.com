import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections'

const config = {
  themes: ['material-theme-ocean', 'min-light'],
  themeCssSelector(theme) {
    return `[data-code-theme='${theme.name}']`
  },
  plugins: [pluginCollapsibleSections({})],
  useDarkModeMediaQuery: false,
}

export default config
