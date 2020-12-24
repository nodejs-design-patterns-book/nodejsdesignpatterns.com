'use strict'

const format = require('date-fns/format')
const markdownIt = require('markdown-it')

module.exports = function nunjucksFilters (config) {
  // Add is_array filter
  config.addFilter('is_array', function (value) {
    return Array.isArray(value)
  })

  // add date filter
  config.addFilter('date', function (date, dateFormat = 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx') {
    return format(date, dateFormat)
  })

  // Add markdown filter
  config.addFilter('markdown', function (value) {
    const markdown = markdownIt({
      html: true
    })
    return markdown.render(value)
  })

  // Add currentYear helper
  config.addNunjucksShortcode('currentYear', function () {
    return `${new Date().getFullYear()}`
  })
}
