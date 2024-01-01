import allPlugins from './_11ty/allPlugins.js'

export default function (config) {
  config.addPlugin(allPlugins)

  return {
    markdownTemplateEngine: 'njk',
    dir: {
      input: './src',
      output: './build'
    }
  }
}
