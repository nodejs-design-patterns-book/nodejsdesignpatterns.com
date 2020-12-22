'use strict'

const rss = require('@11ty/eleventy-plugin-rss')
const copyStaticFiles = require('./copyStaticFiles')
const configureMarkdown = require('./configureMarkdown')
const toc = require('./toc')
const purifycss = require('./purifycss')
const minifyhtml = require('./minifyhtml')
const nunjucksFilters = require('./nunjucksFilters')
const shareImage = require('./shareImage')
const responsiveImage = require('./responsiveImage')

module.exports = function allPlugins (config) {
  config.setUseGitIgnore(false)

  config.addPlugin(rss)
  config.addPlugin(copyStaticFiles)
  config.addPlugin(configureMarkdown)
  config.addPlugin(toc)
  config.addPlugin(purifycss)
  config.addPlugin(minifyhtml)
  config.addPlugin(nunjucksFilters)
  config.addPlugin(shareImage)
  config.addPlugin(responsiveImage)
}
