'use strict'

const rss = require('@11ty/eleventy-plugin-rss')
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight')
const copyStaticFiles = require('./copyStaticFiles')
const configureMarkdown = require('./configureMarkdown')
const toc = require('./toc')
const purifycss = require('./purifycss')
const minifyhtml = require('./minifyhtml')
const nunjucksFilters = require('./nunjucksFilters')
const shareImage = require('./shareImage')
const responsiveImage = require('./responsiveImage')
const image = require('./image')

module.exports = function allPlugins (config) {
  config.setUseGitIgnore(false)

  config.addPlugin(rss)
  config.addPlugin(syntaxHighlight)
  config.addPlugin(copyStaticFiles)
  config.addPlugin(configureMarkdown)
  config.addPlugin(toc)
  config.addPlugin(purifycss)
  config.addPlugin(minifyhtml)
  config.addPlugin(nunjucksFilters)
  config.addPlugin(shareImage)
  config.addPlugin(responsiveImage)
  config.addPlugin(image)
}
