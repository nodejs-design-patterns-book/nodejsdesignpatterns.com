'use strict'

const { join, extname, basename } = require('path')
const { createReadStream, createWriteStream } = require('fs')
const { access } = require('fs').promises
const { createHash } = require('crypto')

function hashFile (fileStream) {
  return new Promise((resolve, reject) => {
    const hash = createHash('md5')
    const hashStream = fileStream.pipe(hash)
    hash.on('error', reject)
    hashStream.on('error', reject)
    hashStream.on('finish', () => resolve(hash.digest('hex')))
  })
}

function copyFile (fileStream, dest) {
  return new Promise((resolve, reject) => {
    fileStream.on('error', reject)
    const destStream = createWriteStream(dest)
    destStream.on('error', reject)
    const copyStream = fileStream.pipe(destStream)
    copyStream.on('error', reject)
    copyStream.on('finish', resolve)
  })
}

module.exports = function image (config) {
  config.addNunjucksAsyncShortcode('image', async function (src, alt, options) {
    if (typeof alt === 'undefined') {
      throw new Error(`Missing \`alt\` on image from: ${src}`)
    }

    const inputImage = join(__dirname, '..', 'src', src)

    // makes sure that the input picture exists
    await access(inputImage)

    // calculates md5 of image
    const hash = await hashFile(createReadStream(inputImage))

    const ext = extname(src)
    const name = basename(src, ext)

    const destFileName = `${name}_${hash.substr(0, 8)}${ext}`
    const destPath = join(__dirname, '..', 'build', 'img', destFileName)
    const url = `/img/${destFileName}`

    try {
      await access(destPath)
    } catch (err) {
      // copies the file only if it does not exist already
      if (err.code === 'ENOENT') {
        await copyFile(createReadStream(inputImage), destPath)
      }
    }

    const html = `<p style="text-align: center"><img loading="lazy" decoding="async" style="max-width: 100%; margin: 0px; vertical-align: middle;" ${options.class ? `class="${options.class}"` : ''} alt="${alt}" src="${url}" ${options.width ? `width="${options.width}"` : ''} ${options.height ? `height="${options.height}"` : ''}/></p>`

    return html
  })
}
