// @ts-check

import { unified } from '@astrojs/markdown-remark'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, fontProviders } from 'astro/config'
import expressiveCode from 'astro-expressive-code'
import remarkDirective from 'remark-directive' /* Handle ::: directives as nodes */
import { remarkAdmonitions } from './src/plugins/remark-admonitions' /* Add admonitions */

// https://astro.build/config
export default defineConfig({
  site: 'https://nodejsdesignpatterns.com',
  integrations: [react(), expressiveCode(), sitemap()],
  /* Keep the pre-Astro-7 whitespace behavior: templates rely on spaces between
     inline elements, which the new 'jsx' default would strip */
  compressHTML: true,
  markdown: {
    /* Explicitly use the remark/rehype pipeline (instead of Astro 7's default
       Sätteri) since admonitions depend on remark plugins */
    processor: unified({
      remarkPlugins: [remarkDirective, remarkAdmonitions],
    }),
  },
  vite: {
    plugins: [tailwindcss()],
  },
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Hanuman',
      cssVariable: '--font-base-serif',
    },
    {
      provider: fontProviders.google(),
      name: 'Atkinson Hyperlegible',
      cssVariable: '--font-base-sans',
    },
    {
      provider: fontProviders.google(),
      name: 'Cascadia Mono',
      cssVariable: '--font-base-mono',
    },
  ],
})
