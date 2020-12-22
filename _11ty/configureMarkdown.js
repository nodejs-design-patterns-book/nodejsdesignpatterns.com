'use strict'

const markdownIt = require('markdown-it')
const markdownItAnchor = require('markdown-it-anchor')
const markdownItClass = require('@toycode/markdown-it-class')

module.exports = function configureMarkdown (config) {
  // configure markdown
  const mdClassesMapping = {
    h2: ['title', 'is-2'],
    h3: ['title', 'is-3']
  }
  config.setLibrary('md',
    markdownIt({
      html: true,
      linkify: true
    })
      .use(markdownItAnchor)
      .use(markdownItClass, mdClassesMapping)
  )
}
