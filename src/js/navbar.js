export default function navbar () {
  const html = document.getElementsByTagName('html')[0]
  const navbar = document.getElementById('navbar')
  const htmlStickyClasses = ['has-navbar-fixed-top']
  const navbarStickyClasses = ['is-fixed-top', 'has-shadow']

  let lastScrollY = 0
  let state = {
    stickyBarEnabled: true,
    stickyBarVisible: true
  }

  function updateState (stateChanges) {
    const newState = { ...state, ...stateChanges }
    if (JSON.stringify(newState) !== JSON.stringify(state)) {
      state = newState
      update()
    }
  }

  function update () {
    if (state.stickyBarEnabled && state.stickyBarVisible) {
      for (const className of htmlStickyClasses) {
        html.classList.add(className)
      }
      for (const className of navbarStickyClasses) {
        navbar.classList.add(className)
      }
    } else {
      for (const className of htmlStickyClasses) {
        html.classList.remove(className)
      }
      for (const className of navbarStickyClasses) {
        navbar.classList.remove(className)
      }
    }
  }

  const mobileMq = window.matchMedia('screen and (max-width: 768px)')
  mobileMq.addEventListener('change', (e) => {
    updateState({ stickyBarEnabled: e.matches })
  })

  window.addEventListener('scroll', (e) => {
    const isScrollingUp = window.scrollY < lastScrollY
    updateState({ stickyBarVisible: isScrollingUp })
    lastScrollY = window.scrollY
  })
}
