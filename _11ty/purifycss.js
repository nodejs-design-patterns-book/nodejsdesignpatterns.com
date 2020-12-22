'use strict'

const { join } = require('path')
const { readFile } = require('fs').promises
const PurgeCSS = require('purgecss').PurgeCSS
const csso = require('csso')

module.exports = function purifycss (config) {
  // optimize css - removes unused css and inlines css
  config.addTransform('purifyCss', async function (content, outputPath) {
    if (outputPath.endsWith('.html')) {
      const stylesheetsRegex = /<link rel="stylesheet" href="([0-9a-zA-Z/._]+)">/gm
      const stylesheets = content.matchAll(stylesheetsRegex)
      let newContent = content
      for await (const [match, href] of stylesheets) {
        const filePath = join(__dirname, '..', 'build', href)

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
}
