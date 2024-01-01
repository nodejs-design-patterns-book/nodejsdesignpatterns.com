import pluginTOC from 'eleventy-plugin-toc'

export default function toc (config) {
  config.addPlugin(pluginTOC, {
    tags: ['h2'],
    wrapper: 'div'
  })
}
