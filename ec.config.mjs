const config = {
  themes: ['material-theme-ocean', 'min-light'],
  themeCssSelector(theme) {
    return `[data-code-theme='${theme.name}']`
  },
  useDarkModeMediaQuery: false,
}

export default config
