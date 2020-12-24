'use strict'

const pluginTOC = require('eleventy-plugin-toc')

module.exports = function toc (config) {
  config.addPlugin(pluginTOC, {
    tags: ['h2'],
    wrapper: 'div'
  })
}
