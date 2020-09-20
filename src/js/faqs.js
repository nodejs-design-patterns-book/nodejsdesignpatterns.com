'use strict'

module.exports = () => {
  const buttons = document.querySelectorAll('dl.faq button')

  function toggle (btn, skipIfAnchor = false) {
    const isExpanded = btn.getAttribute('aria-expanded') === 'true'
    const targetId = btn.getAttribute('aria-controls')
    const target = document.getElementById(targetId)

    if (skipIfAnchor && target.id.includes(window.location.hash.substr(1))) {
      if (window.dataLayer) {
        window.dataLayer.push({ event: `faq_open_${targetId}` })
      }
      return
    }

    if (isExpanded) {
      btn.setAttribute('aria-expanded', 'false')
      target.style.maxHeight = 0
      target.style.padding = '0 0 0 3.2rem'
    } else {
      if (window.dataLayer) {
        window.dataLayer.push({ event: `faq_open_${targetId}` })
      }
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
    toggle(button, true) // once the page loads collapse all tha faqs
  })
}
