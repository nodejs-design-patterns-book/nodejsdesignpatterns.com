import type { CollectionEntry } from 'astro:content'

export interface BlogPostingSchemaOptions {
  title: string
  description: string
  datePublished: Date
  dateModified: Date
  authors: CollectionEntry<'authors'>[]
  url: string
  wordCount: number
  siteUrl: string
}

export function generateBlogPostingSchema(options: BlogPostingSchemaOptions): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: options.title,
    description: options.description,
    datePublished: options.datePublished.toISOString(),
    dateModified: options.dateModified.toISOString(),
    author: options.authors.map((author) => ({
      '@type': 'Person',
      name: author.data.name,
      url: author.data.link,
    })),
    publisher: {
      '@type': 'Organization',
      name: 'Node.js Design Patterns',
      url: options.siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${options.siteUrl}/images/og-image.jpg`,
      },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': options.url },
    wordCount: options.wordCount,
    inLanguage: 'en-US',
  }
}

export interface FAQItem {
  question: string
  answer: string
}

export function generateFAQPageSchema(items: FAQItem[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
}
