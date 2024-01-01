import rss from '@11ty/eleventy-plugin-rss'
import syntaxHighlight from '@11ty/eleventy-plugin-syntaxhighlight'
import copyStaticFiles from './copyStaticFiles.js'
import configureMarkdown from './configureMarkdown.js'
import toc from './toc.js'
import purifycss from './purifycss.js'
import minifyhtml from './minifyhtml.js'
import nunjucksFilters from './nunjucksFilters.js'
import shareImage from './shareImage.js'
import responsiveImage from './responsiveImage.js'
import image from './image.js'

export default function allPlugins (config) {
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
