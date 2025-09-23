/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import astroParser from 'astro-eslint-parser'
import { defineConfig, globalIgnores } from 'eslint/config'
import eslintConfigPrettier from 'eslint-config-prettier'
import astro from 'eslint-plugin-astro'
import prettierPlugin from 'eslint-plugin-prettier'
import globals from 'globals'

export default defineConfig([
  globalIgnores(['dist/**/*'], 'Ignore Astro Build Directory'),
  globalIgnores(['.astro/**/*'], 'Ignore Astro Files'),
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2026,
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.eslint.json',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      prettier: prettierPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...eslintConfigPrettier.rules,
      ...prettierPlugin.configs.recommended.rules,
    },
  },
  {
    files: ['**/*.astro'],
    languageOptions: {
      parser: astroParser,
      parserOptions: {
        parser: tsParser,
        project: './tsconfig.eslint.json',
        extraFileExtensions: ['.astro'],
      },
      globals: astro.environments.astro.globals,
      sourceType: 'module',
    },
    processor: astro.processors['client-side-ts'],
    plugins: {
      astro,
      '@typescript-eslint': tseslint,
      prettier: prettierPlugin,
    },
    rules: {
      ...astro.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...eslintConfigPrettier.rules,
      ...prettierPlugin.configs.recommended.rules,
    },
  },
  {
    files: ['**/*.astro/*.js', '*.astro/*.js'],
    languageOptions: {
      sourceType: 'module',
    },
    rules: {
      'prettier/prettier': 'off',
    },
  },
  {
    files: ['**/*.astro/*.ts', '*.astro/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: 'module',
        project: null,
      },
    },
    rules: {
      'prettier/prettier': 'off',
    },
  },
])
