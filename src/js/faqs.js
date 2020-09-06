'use strict'

module.exports = () => {
  const buttons = document.querySelectorAll('dl.faq button')

  function toggle (btn) {
    const isExpanded = btn.getAttribute('aria-expanded') === 'true'
    const targetId = btn.getAttribute('aria-controls')
    const target = document.getElementById(targetId)
    if (isExpanded) {
      btn.setAttribute('aria-expanded', 'false')
      target.classList.remove('open')
      target.classList.add('close')
    } else {
      btn.setAttribute('aria-expanded', 'true')
      target.classList.remove('close')
      target.classList.add('open')
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
