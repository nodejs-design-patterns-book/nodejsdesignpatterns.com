'use strict'

const { cpus } = require('os')
const { join, extname, basename } = require('path')
const { access } = require('fs').promises
const Image = require('@11ty/eleventy-img')

Image.concurrency = (cpus()).length

module.exports = function responsiveImage (config) {
  // Add responsive image helper
  config.addNunjucksAsyncShortcode('responsiveImage', async function (src, alt, options = {}) {
    if (typeof alt === 'undefined') {
      throw new Error(`Missing \`alt\` on responsiveImage from: ${src}`)
    }

    const inputImage = join(__dirname, '..', 'src', src)
    // makes sure that the input picture exists
    await access(inputImage)

    const maxWidth = options.maxWidth || 1024
    options.formats = ['png', 'webp']
    options.outputDir = join(__dirname, '..', 'build', 'img')
    options.widths = [null, 64]
    options.filenameFormat = function (id, src, width, format, options) {
      const ext = extname(src)
      const name = basename(src, ext)

      if (width) {
        return `${name}-${id}-${width}.${format}`
      }

      return `${name}-${id}.${format}`
    }

    while (options.widths[options.widths.length - 1] * 2 <= maxWidth) {
      options.widths.push(options.widths[options.widths.length - 1] * 2)
    }

    const stats = await Image(inputImage, options)
    const lowestSrc = stats.png[0]
    const sizes = `(max-width: ${maxWidth}px) 100vw, ${maxWidth}px`

    // Iterate over formats and widths
    const html = `<span style="position: relative; display: block; margin-left: auto; margin-right: auto; max-width: ${maxWidth}px; ">
<picture>
  ${Object.values(stats).map(imageFormat => {
  return `<source type="image/${imageFormat[0].format}" srcset="${imageFormat.map(entry => `${entry.url} ${entry.width}w`).join(', ')}" sizes="${sizes}">`
}).join('\n')}
<img loading="lazy" decoding="async" style="max-width: 100%; width: 100%; margin: 0px; vertical-align: middle;" ${options.class ? `class="${options.class}"` : ''} alt="${alt}" src="${lowestSrc.url}" width="${lowestSrc.width}" height="${lowestSrc.height}">
</picture>
</span>`
    return html
  })
}
