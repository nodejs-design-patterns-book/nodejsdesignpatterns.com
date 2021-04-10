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

  config.addFilter('dateToUTC', function (date) {
    const d = new Date(date)
    return d.toUTCString()
  })

  // Add markdown filter
  config.addFilter('markdown', function (value) {
    const markdown = markdownIt({
      html: true
    })
    return markdown.render(value)
  })

  // Add custom filter to remove a content with a given URL from a list of pages
  config.addFilter('removeUrl', function matchUrl (elements, url) {
    return elements.filter((el) => el.url !== url)
  })

  // Add custom filter to keep the top X elements of an array
  config.addFilter('keep', function keep (arr, n) {
    return arr.slice(0, n)
  })

  // Add currentYear helper
  config.addNunjucksShortcode('currentYear', function () {
    return `${new Date().getFullYear()}`
  })
}
