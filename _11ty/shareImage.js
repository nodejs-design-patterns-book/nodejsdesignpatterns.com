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
      // title
      `/l_text:Playfair%20Display_80_bold_center:${encodeURIComponent(title)},co_rgb:363636,c_fit,g_north,w_1000,y_200` +
      // subtitle
      '/l_text:Playfair%20Display_40_bold_center:Node.js%20Design%20Patterns,co_rgb:363636,c_fit,g_south,w_1000,y_40' +
      // base image
      '/nodejsdesignpatterns/fsb-bg-share-fb.png'

    const image = await Cache(imageUrl, { duration: '1d', type: 'buffer' })
    await writeFile(destPath, image)

    return destUrl
  })
}
