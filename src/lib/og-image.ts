// Build-time Open Graph card generator for blog posts.
// Satori lays out a small element tree and turns text into SVG paths
// (so the result does not depend on fonts installed on the build machine),
// then sharp rasterizes the SVG into a 1200x630 PNG.
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import satori from 'satori'
import sharp from 'sharp'

export const OG_WIDTH = 1200
export const OG_HEIGHT = 630

const COLORS = {
  bg: '#16181d',
  panel: '#1f2229',
  title: '#f5f7fa',
  body: '#aab3c0',
  accent: '#4ade80',
  rule: '#2c313a',
}

type Node = {
  type: string
  props: Record<string, unknown> & { children?: unknown }
}

function h(
  type: string,
  style: Record<string, unknown>,
  ...children: unknown[]
): Node {
  return {
    type,
    props: {
      style,
      children: children.length === 1 ? children[0] : children,
    },
  }
}

const fontFile = (pkg: string, file: string) =>
  readFile(resolve('node_modules/@fontsource', pkg, 'files', file))

let assets: Promise<{
  fonts: Parameters<typeof satori>[1]['fonts']
  cover: string
}> | null = null

// Fonts and the book cover are loaded once and reused for every post.
function loadAssets() {
  assets ??= (async () => {
    const [serifBold, sans, sansBold, coverPng] = await Promise.all([
      fontFile('hanuman', 'hanuman-latin-700-normal.woff'),
      fontFile(
        'atkinson-hyperlegible',
        'atkinson-hyperlegible-latin-400-normal.woff',
      ),
      fontFile(
        'atkinson-hyperlegible',
        'atkinson-hyperlegible-latin-700-normal.woff',
      ),
      sharp(resolve('src/images/book-cover.png'))
        .resize({ width: 600 })
        .png()
        .toBuffer(),
    ])
    return {
      fonts: [
        { name: 'Hanuman', data: serifBold, weight: 700, style: 'normal' },
        { name: 'Atkinson', data: sans, weight: 400, style: 'normal' },
        { name: 'Atkinson', data: sansBold, weight: 700, style: 'normal' },
      ],
      cover: `data:image/png;base64,${coverPng.toString('base64')}`,
    }
  })()
  return assets
}

// Shorter titles get bigger type so the card never looks empty or crowded.
function titleSize(title: string) {
  if (title.length <= 28) return 76
  if (title.length <= 45) return 64
  return 54
}

export interface OgCardInput {
  title: string
  description: string
  authors: string[]
}

export async function renderOgImage({
  title,
  description,
  authors,
}: OgCardInput): Promise<Buffer> {
  const { fonts, cover } = await loadAssets()

  const tree = h(
    'div',
    {
      width: '100%',
      height: '100%',
      display: 'flex',
      position: 'relative',
      backgroundColor: COLORS.bg,
      fontFamily: 'Atkinson',
      overflow: 'hidden',
    },
    // Green bar along the top edge, matching the site's primary color.
    h('div', {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: 10,
      backgroundColor: COLORS.accent,
    }),
    // Text column.
    h(
      'div',
      {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        // Satori adds padding on top of width/height (content-box),
        // so subtract it to keep the byline inside the card.
        width: 780 - 72,
        height: OG_HEIGHT - 64 - 56,
        margin: '64px 0 56px 72px',
      },
      h(
        'div',
        { display: 'flex', flexDirection: 'column', gap: 28 },
        h(
          'div',
          {
            display: 'flex',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: 'uppercase',
            color: COLORS.accent,
          },
          'Node.js Design Patterns · Blog',
        ),
        h(
          'div',
          {
            display: 'block',
            fontFamily: 'Hanuman',
            fontWeight: 700,
            fontSize: titleSize(title),
            lineHeight: 1.12,
            color: COLORS.title,
            lineClamp: 3,
          },
          title,
        ),
        h(
          'div',
          {
            display: 'block',
            fontSize: 27,
            lineHeight: 1.4,
            color: COLORS.body,
            lineClamp: 3,
          },
          description,
        ),
      ),
      h(
        'div',
        {
          display: 'flex',
          fontSize: 24,
          fontWeight: 700,
          color: COLORS.title,
          borderTop: `2px solid ${COLORS.rule}`,
          paddingTop: 22,
          marginRight: 24,
        },
        `By ${authors.join(' & ')}`,
      ),
    ),
    // Book cover, tilted and bleeding off the bottom-right corner.
    h(
      'div',
      {
        position: 'absolute',
        right: -70,
        top: 130,
        display: 'flex',
        transform: 'rotate(6deg)',
        boxShadow: '0 30px 60px rgba(0, 0, 0, 0.55)',
      },
      {
        type: 'img',
        props: { src: cover, width: 380, height: 469 },
      },
    ),
  )

  const svg = await satori(tree as Parameters<typeof satori>[0], {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts,
  })
  return sharp(Buffer.from(svg)).png().toBuffer()
}
