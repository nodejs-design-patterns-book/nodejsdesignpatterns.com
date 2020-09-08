'use strict'

module.exports = () => {
  const buttons = document.querySelectorAll('dl.faq button')

  function toggle (btn) {
    const isExpanded = btn.getAttribute('aria-expanded') === 'true'
    const targetId = btn.getAttribute('aria-controls')
    const target = document.getElementById(targetId)
    if (isExpanded) {
      btn.setAttribute('aria-expanded', 'false')
      target.style.maxHeight = 0
      target.style.padding = '0 0 0 3.2rem'
    } else {
      btn.setAttribute('aria-expanded', 'true')
      target.style.maxHeight = '1000px'
      target.style.padding = '1.5rem 0 1.5rem 3.2rem'
    }
  }

  buttons.forEach((button) => {
    button.addEventListener('click', (e) => {
      e.preventDefault()
      toggle(e.currentTarget)
    })
    toggle(button) // once the page loads collapse all tha faqs
  })
}
