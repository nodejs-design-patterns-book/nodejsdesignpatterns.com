'use strict'

const path = require('path')
const { cpus } = require('os')
const Image = require('@11ty/eleventy-img')

Image.concurrency = (cpus()).length

module.exports = function (eleventyConfig) {
  eleventyConfig.setUseGitIgnore(false)

  eleventyConfig.addNunjucksAsyncShortcode('responsiveImage', async function (src, alt, options = {}) {
    if (alt === undefined) {
      throw new Error(`Missing \`alt\` on responsiveImage from: ${src}`)
    }

    options.outputDir = path.join(__dirname, 'build', 'img')
    options.widths = [256, 512, 1024, null]
    options.cacheOptions = {

    }
    const stats = await Image(path.join(__dirname, 'src', src), options)
    const lowestSrc = stats.jpeg[0]
    const sizes = '(max-width: 1024px) 100vw, 1024px'

    // Iterate over formats and widths
    return `
    <span style="position: relative; display: block; margin-left: auto; margin-right: auto; max-width: 1024px; ">
    <picture>
      ${Object.values(stats).map(imageFormat => {
      return `  <source type="image/${imageFormat[0].format}" srcset="${imageFormat.map(entry => `${entry.url} ${entry.width}w`).join(', ')}" sizes="${sizes}">`
    }).join('\n')}
      <img
        loading="lazy"
        style="max-width: 100%; width: 100%; margin: 0px; vertical-align: middle;"
        alt="${alt}"
        src="${lowestSrc.url}"
        width="${lowestSrc.width}"
        height="${lowestSrc.height}">
    </picture>
    </span>`
  })
}
