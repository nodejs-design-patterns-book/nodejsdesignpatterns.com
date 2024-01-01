import path from 'node:path'
import * as url from 'node:url'
import { readFile } from 'fs/promises'
import { hashFile } from 'hasha'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export default async function () {
  // Add webpack assets as globals
  const assetsPath = path.join(__dirname, '..', '_includes', 'assets')
  const manifestPath = path.join(assetsPath, 'manifest.json')
  const content = await readFile(manifestPath)
  const manifest = JSON.parse(content)
  const scripts = []
  const styles = []
  const assets = []
  for await (const [originalName, compiledName] of Object.entries(manifest)) {
    const hash = await hashFile(path.join(assetsPath, compiledName), { algorithm: 'sha256', encoding: 'base64' })
    const integrity = `sha256-${hash}`
    const entry = { originalName, compiledName, href: `/assets/${compiledName}`, hash, integrity, html: '' }
    if (compiledName.endsWith('.css')) {
      entry.html = `<link rel="preload" href="/assets/${compiledName}" integrity="${integrity}" as="style" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="/assets/${compiledName}" integrity="${integrity}"></noscript>`
      styles.push(entry)
    } else if (compiledName.endsWith('.js')) {
      entry.html = `<script type="text/javascript" defer="defer" src="/assets/${compiledName}" integrity="${integrity}"></script>`
      scripts.push(entry)
    }
    assets.push(entry)
  }

  return {
    assets, styles, scripts
  }
}
