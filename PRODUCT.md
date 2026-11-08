# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Prospective readers:** intermediate Node.js developers who can ship code but want to understand why production-grade Node.js is designed the way it is (async flows, streams, scalability, architecture). They land on the homepage deciding whether the book is worth buying.
- **Search visitors:** developers arriving on a blog article from a search for a specific Node.js task (HTTP requests, env vars, file I/O, new releases). They want a correct, modern answer quickly, and some become prospective readers.

## Product Purpose

The official website for the book _Node.js Design Patterns_ by Mario Casciaro and Luciano Mammino. It exists to sell the book.

Success, in priority order when goals conflict:

1. **Book sales:** clicks to buy the print edition (`BUY_LINK_PRINT`) or the e-book (`BUY_LINK_EBOOK`).
2. **Free chapter signups:** an 80-page free chapter delivered by email through a Kit form. It feeds sales.
3. **Blog authority:** search traffic and trust from original articles (target cadence: 2 per month). It feeds both of the above.

## Positioning

All four are confirmed and can be claimed:

- **Patterns, not recipes:** teaches the reasoning behind production-grade Node.js design, so it outlasts API churn.
- **Hands-on depth:** runnable examples and exercises in every chapter, for learning by building.
- **Practitioner authors:** written by working engineers active in the Node.js community, with forewords by Node.js core contributors.
- **Longevity and trust:** four editions, widely read and well reviewed.

## Operating Context

- Homepage visitors compare the book against free docs, courses, and other books. Proof (reviews, reader count, rating, chapter contents, free chapter) carries the decision.
- Blog visitors read long technical articles with code blocks, often from search, on desktop and mobile, in light and dark themes. Articles promote the book in a sidebar and closing block.
- The book is sold through Amazon (via `nodejsdp.link` redirects) and Packt; the site itself has no checkout.

## Capabilities and Constraints

- Static site (Astro), deployed to GitHub Pages at https://nodejsdesignpatterns.com. Everything that can be prebuilt is prebuilt; client-side JavaScript is minimal (see `.claude/constitution.md`).
- Content is data-driven through typed collections in `src/content/`: authors, blog, chapters, FAQ, quotes, reviews.
- Blog articles follow `.claude/article-brief-template.md`, use modern ESM and async/await, and include an FAQ section for schema markup.
- **Canonical book facts** live in `src/lib/const.ts`: Fourth Edition, Packt Publishing, published 2025-10-09, ISBN 9781803238944, 13 chapters, 732 pages, 170 examples, 54 exercises, 30,000+ readers, 4.6/5 from 780 reviews.
  - Known stale copy: `SITE_DESCRIPTION` still says "660+ pages, 150+ examples". Do not reuse those figures.

## Brand Commitments

- Name: _Node.js Design Patterns_, Fourth Edition. Authors: Mario Casciaro and Luciano Mammino. Publisher: Packt.
- Forewords by Colin J. Ihrig and Matteo Collina (as printed on the cover).
- Social handles: `@nodejspatterns` (site), `@loige` (Luciano).
- Writing voice (blog and site copy): friendly, almost colloquial, like explaining to a colleague; technically accurate. Context and "why" before "how". Never use em dashes.

## Evidence on Hand

- Reader reviews with rating, platform, and source URL: `src/content/reviews/`.
- Testimonials: `src/content/quotes/`.
- Chapter descriptions: `src/content/chapters/` (13 chapters).
- FAQ entries: `src/content/faq/`.
- Author profiles and photos: `src/content/authors/` (Luciano Mammino, Mario Casciaro, plus guest blog author Giuseppe Morelli).
- Book cover and promo imagery: `src/images/`, `public/images/`.
- 13 published blog articles: `src/content/blog/`.
- Do not fabricate reviews, quotes, reader counts, ratings, or endorsements beyond these sources.

## Product Principles

1. **Every surface earns the sale honestly.** Persuasion comes from real proof and real content, never invented numbers or urgency.
2. **Teach first on the blog.** An article must be the best answer to its query; the book promotion follows the value and never interrupts it.
3. **Lean and fast.** Static, prebuilt, optimized assets, minimal JavaScript. Speed is part of the credibility with a developer audience.
4. **Truthful, current Node.js.** Code and claims reflect modern Node.js (ESM, async/await, current releases).

## Accessibility & Inclusion

WCAG AA is required: semantic HTML, correct heading hierarchy, meaningful alt text, 4.5:1 text contrast (3:1 large), keyboard access with visible focus, labeled forms, skip links. Light and dark themes must both meet it. Source: `.claude/constitution.md`.
