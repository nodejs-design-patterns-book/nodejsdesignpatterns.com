'use strict'

const { join, dirname } = require('path')
const { writeFile } = require('fs').promises
const mkdirp = require('mkdirp')
const Cache = require('@11ty/eleventy-cache-assets')

module.exports = function shareImage (config) {
  // Generates blog share images
  config.addNunjucksAsyncShortcode('generateShareImage', async function (title) {
    if (typeof title === 'undefined') {
      throw new Error('Missing `title` on generateShareImage')
    }

    const filename = `og_${this.page.fileSlug}.jpg`
    const destFolder = dirname(this.page.outputPath)
    await mkdirp(destFolder)
    const destPath = join(destFolder, filename)
    const destUrl = `${this.page.url}${filename}`

    const imageUrl = 'https://res.cloudinary.com/loige/image/upload' +
      // size, fill, quality, format
      '/w_1280,h_669,c_fill,q_auto,f_jpg' +
      // book stack
      '/l_v1608629631:nodejsdesignpatterns:book_stack_trimmed.png,h_669,g_north_west,c_fill' +
      // title
      `/l_text:Playfair%20Display_70_bold_left:${encodeURIComponent(title)},co_rgb:363636,c_fit,g_north_west,w_780,x_460,y_200` +
      // subtitle
      '/l_text:Playfair%20Display_40_bold_left:Node.js%20Design%20Patterns,co_rgb:363636,c_fit,g_south_west,w_1000,y_40,x_460' +
      // base image
      '/nodejsdesignpatterns/fsb-bg-share-fb.png'

    const image = await Cache(imageUrl, { duration: '1d', type: 'buffer' })
    await writeFile(destPath, image)

    return destUrl
  })
}
