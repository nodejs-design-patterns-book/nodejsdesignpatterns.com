// @ts-check

import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, fontProviders } from 'astro/config'
import expressiveCode from 'astro-expressive-code'
import partytown from '@astrojs/partytown'

// https://astro.build/config
export default defineConfig({
  site: 'https://nodejsdesignpatterns.com',
  integrations: [
    react(),
    expressiveCode(),
    sitemap(),
    partytown({ config: { forward: ['dataLayer.push'] } }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  experimental: {
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
  },
})
