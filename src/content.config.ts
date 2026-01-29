import { defineCollection, reference, z } from 'astro:content'
import { glob } from 'astro/loaders'

const chapters = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/chapters' }),
  schema: z.object({
    number: z.string(),
    title: z.string(),
    description: z.string(),
    numWords: z.number(),
    numExamples: z.number(),
    numExercises: z.number(),
    isFree: z.boolean().optional(),
  }),
})

const quotes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/quotes' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      description: z.string(),
      picture: image(),
    }),
})

const reviews = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/reviews' }),
  schema: z.object({
    name: z.string(),
    rating: z.number().min(1).max(5).optional(),
    platform: z
      .enum(['Amazon', 'Goodreads', 'Bookshop', 'Reddit', 'LinkedIn'])
      .optional(),
    url: z.string().url().optional(),
  }),
})

const faq = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/faq' }),
  schema: z.object({
    question: z.string(),
  }),
})

const authors = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/authors' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      profile_pic: image(),
      link: z.string().url(),
      bio: z.string().optional(),
    }),
})

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    date: z.date(),
    updatedAt: z.date(),
    title: z.string(),
    description: z.string(),
    authors: z.array(reference('authors')),
    tags: z.array(z.string()),
    faq: z
      .array(
        z.object({
          question: z.string(),
          answer: z.string(),
        }),
      )
      .optional(),
  }),
})

export const collections = { chapters, quotes, reviews, faq, authors, blog }
