'use strict'

const path = require('path')
const { cpus } = require('os')
const { join, dirname } = require('path')
const { readFile, writeFile, access } = require('fs').promises
const htmlmin = require('html-minifier')
const PurgeCSS = require('purgecss').PurgeCSS
const csso = require('csso')
const markdownIt = require('markdown-it')
const markdownItAnchor = require('markdown-it-anchor')
const markdownItClass = require('@toycode/markdown-it-class')
const Cache = require('@11ty/eleventy-cache-assets')
const Image = require('@11ty/eleventy-img')
const format = require('date-fns/format')
const pluginTOC = require('eleventy-plugin-toc')

Image.concurrency = (cpus()).length

module.exports = function (config) {
  config.setUseGitIgnore(false)

  // Pass-through files
  config.addPassthroughCopy('src/CNAME')
  config.addPassthroughCopy({ 'src/_includes/assets': 'assets' })
  config.addPassthroughCopy({ 'src/node-js-design-patterns.jpg': 'img/node-js-design-patterns.jpg' })
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

  // configure markdown
  const mdClassesMapping = {
    h2: ['title', 'is-2'],
    h3: ['title', 'is-3']
  }
  config.setLibrary('md',
    markdownIt({
      html: true,
      linkify: true
    })
      .use(markdownItAnchor)
      .use(markdownItClass, mdClassesMapping)
  )

  config.addPlugin(pluginTOC, {
    tags: ['h2', 'h3'],
    wrapper: 'div'
  })

  // optimize css - removes unused css and inlines css
  config.addTransform('purifyCss', async function (content, outputPath) {
    if (outputPath.endsWith('.html')) {
      const stylesheetsRegex = /<link rel="stylesheet" href="([0-9a-zA-Z/._]+)">/gm
      const stylesheets = content.matchAll(stylesheetsRegex)
      let newContent = content
      for await (const [match, href] of stylesheets) {
        const filePath = path.join(__dirname, 'build', href)

        let cssContent = await readFile(filePath, 'utf8')
        cssContent = cssContent.replace(/@font-face {/g, '@font-face {font-display:swap;')

        const purged = await new PurgeCSS().purge({
          content: [
            {
              raw: content,
              extension: 'html'
            }
          ],
          css: [
            {
              raw: cssContent
            }
          ],
          whitelist: ['is-active'],
          fontFace: true,
          variables: true
        })

        const after = csso.minify(purged[0].css).css
        newContent = newContent.replace(match, `<style>${after}</style>`)
      }

      return newContent
    }

    return content
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

  // Generates blog share images
  config.addNunjucksAsyncShortcode('generateShareImage', async function (title) {
    if (typeof title === 'undefined') {
      throw new Error('Missing `title` on generateShareImage')
    }

    const filename = `og_${this.page.fileSlug}.jpg`
    const destPath = join(dirname(this.page.outputPath), filename)
    const destUrl = `${this.page.url}${filename}`
    const imageUrl = `https://res.cloudinary.com/loige/image/upload/w_1280,h_669,c_fill,q_auto,f_jpg/l_text:Playfair%20Display_80_bold_center:${encodeURIComponent(title)},co_rgb:363636,c_fit,g_north,w_1000,y_200/l_text:Playfair%20Display_40_bold_center:Node.js%20Design%20Patterns,co_rgb:363636,c_fit,g_south,w_1000,y_40/nodejsdesignpatterns/fsb-bg-share-fb.png`
    const image = await Cache(imageUrl, { duration: '1d', type: 'buffer' })
    await writeFile(destPath, image)

    return destUrl
  })

  // Add responsive image helper
  config.addNunjucksAsyncShortcode('responsiveImage', async function (src, alt, options = {}) {
    if (typeof alt === 'undefined') {
      throw new Error(`Missing \`alt\` on responsiveImage from: ${src}`)
    }

    const inputImage = path.join(__dirname, 'src', src)
    // makes sure that the input picture exists
    await access(inputImage)

    const maxWidth = options.maxWidth || 1024
    options.formats = ['png', 'webp']
    options.outputDir = path.join(__dirname, 'build', 'img')
    options.widths = [null, 64]
    options.filenameFormat = function (id, src, width, format, options) {
      const ext = path.extname(src)
      const name = path.basename(src, ext)

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
    return `
    <span style="position: relative; display: block; margin-left: auto; margin-right: auto; max-width: ${maxWidth}px; ">
    <picture>
      ${Object.values(stats).map(imageFormat => {
      return `  <source type="image/${imageFormat[0].format}" srcset="${imageFormat.map(entry => `${entry.url} ${entry.width}w`).join(', ')}" sizes="${sizes}">`
    }).join('\n')}
      <img
        loading="lazy"
        decoding="async"
        style="max-width: 100%; width: 100%; margin: 0px; vertical-align: middle;"
        ${options.class ? `class="${options.class}"` : ''}
        alt="${alt}"
        src="${lowestSrc.url}"
        width="${lowestSrc.width}"
        height="${lowestSrc.height}">
    </picture>
    </span>`
  })

  return {
    markdownTemplateEngine: 'njk',
    dir: {
      input: './src',
      output: './build'
    }
  }
}
