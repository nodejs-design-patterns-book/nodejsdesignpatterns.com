'use strict'

require('../scss/style.scss')
const navbar = require('./navbar')
const faqs = require('./faqs')

document.addEventListener('DOMContentLoaded', () => {
  navbar() // init navbar
  faqs() // init faqs
})
