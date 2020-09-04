'use strict'

const navbar = require('./navbar')
const faqs = require('./faqs')

document.addEventListener('DOMContentLoaded', () => {
  navbar() // init navbar
  faqs() // init faqs
})
