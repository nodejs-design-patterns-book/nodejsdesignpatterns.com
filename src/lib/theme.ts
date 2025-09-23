export type ThemePreference = 'light' | 'dark' | 'system'
export type ActualTheme = 'light' | 'dark'
export type ThemeSelection = {
  preference: ThemePreference
  actual: ActualTheme
}

const codeThemes = {
  light: 'min-light',
  dark: 'material-theme-ocean',
}

function getActualThemeFromMedia(): ActualTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function getTheme(): ThemeSelection {
  let savedTheme = (localStorage.getItem('theme') ||
    'system') as ThemePreference
  if (
    savedTheme !== 'light' &&
    savedTheme !== 'dark' &&
    savedTheme !== 'system'
  ) {
    localStorage.removeItem('theme') // Clear invalid theme
    savedTheme = 'system' // Fallback to system if invalid value is found
  }

  const preference = savedTheme
  const actual =
    savedTheme === 'system' ? getActualThemeFromMedia() : savedTheme
  return { preference, actual }
}

export function isValidThemeChangeEvent(
  event: Event,
): event is CustomEvent<ThemeSelection> {
  return (
    event instanceof CustomEvent &&
    event.detail &&
    typeof event.detail === 'object' &&
    'preference' in event.detail &&
    'actual' in event.detail &&
    ['light', 'dark', 'system'].includes(event.detail.preference as string) &&
    ['light', 'dark'].includes(event.detail.actual as string)
  )
}

export function setTheme(theme: ThemeSelection) {
  const { preference, actual } = theme

  const root = window.document.documentElement
  root.dataset.theme = actual
  root.dataset.codeTheme = codeThemes[actual]
  localStorage.setItem('theme', preference)

  root.dispatchEvent(
    new CustomEvent('themechange', {
      detail: { preference, actual },
    }),
  )
}

export function toggleTheme(): ThemeSelection {
  const { preference } = getTheme()

  let newActual: ThemePreference
  let newPreference: ThemePreference

  if (preference === 'light') {
    newPreference = 'dark'
    newActual = 'dark'
  } else if (preference === 'dark') {
    newPreference = 'system'
    newActual = getActualThemeFromMedia()
  } else {
    newPreference = 'light'
    newActual = 'light'
  }

  const newThemeSelection = { preference: newPreference, actual: newActual }
  setTheme(newThemeSelection)
  return newThemeSelection
}

export function initTheme() {
  const { preference, actual } = getTheme()
  setTheme({ preference, actual })

  // Listen for system theme changes
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (e) => {
      // Only update if using system theme
      if (preference === 'system') {
        const newActual = e.matches ? 'dark' : 'light'
        setTheme({ preference, actual: newActual })
      }
    })
}
