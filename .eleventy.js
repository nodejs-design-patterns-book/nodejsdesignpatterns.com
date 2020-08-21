'use strict'

const path = require('path')
const { cpus } = require('os')
const { readFile, access } = require('fs').promises
const htmlmin = require('html-minifier')
const Image = require('@11ty/eleventy-img')

Image.concurrency = (cpus()).length

module.exports = function (config) {
  config.setUseGitIgnore(false)

  // Pass-through files
  config.addPassthroughCopy('src/robots.txt')
  config.addPassthroughCopy({ 'src/_includes/js': 'js' })

  // favicons
  const favicons = [
    'android-chrome-192x192.png',
    'android-chrome-512x512.png',
    'apple-touch-icon.png',
    'favicon-16x16.png',
    'favicon-32x32.png',
    'favicon.ico',
    'site.webmanifest'
  ]
  favicons.forEach((f) => config.addPassthroughCopy(`src/${f}`))

  // Add webpack assets helper
  config.addNunjucksAsyncShortcode('webpackAssets', async function () {
    const manifestPath = path.join(__dirname, 'src', '_includes', 'js', 'manifest.json')
    const content = await readFile(manifestPath)
    const manifest = JSON.parse(content)
    return `${Object.values(manifest).map(f => `<script defer="defer" src="/js/${f}"></script>`)}`
  })

  // Add HTML minification transform
  config.addTransform('htmlmin', function (content, outputPath) {
    if (outputPath.endsWith('.html')) {
      const minified = htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true
      })
      return minified
    }

    return content
  })

  // Add responsive image helper
  config.addNunjucksAsyncShortcode('responsiveImage', async function (src, alt, options = {}) {
    if (alt === undefined) {
      throw new Error(`Missing \`alt\` on responsiveImage from: ${src}`)
    }

    const inputImage = path.join(__dirname, 'src', src)
    // makes sure that the input picture exists
    await access(inputImage)

    options.outputDir = path.join(__dirname, 'build', 'img')
    options.widths = [256, 512, 1024, null]
    const stats = await Image(inputImage, options)
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
        ${options.class ? `class="${options.class}"` : ''}
        alt="${alt}"
        src="${lowestSrc.url}"
        width="${lowestSrc.width}"
        height="${lowestSrc.height}">
    </picture>
    </span>`
  })
}
