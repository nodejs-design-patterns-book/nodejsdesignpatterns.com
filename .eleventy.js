'use strict'

const allPlugins = require('./_11ty/allPlugins')

module.exports = function (config) {
  config.addPlugin(allPlugins)

  return {
    markdownTemplateEngine: 'njk',
    dir: {
      input: './src',
      output: './build'
    }
  }
}
