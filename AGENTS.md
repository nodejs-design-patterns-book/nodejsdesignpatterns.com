# AGENTS.md

This file provides guidance to AI coding assistants when working with code in this repository.

## Project Overview

Official website for the book "Node.js Design Patterns" by Mario Casciaro and Luciano Mammino. Built with Astro as a minimal static site, deployed to GitHub Pages at https://nodejsdesignpatterns.com.

## Commands

```bash
pnpm dev          # Start dev server at localhost:4321
pnpm build        # Build production site to ./dist/
pnpm preview      # Preview production build locally
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix auto-fixable ESLint issues
pnpm format       # Format with Prettier
pnpm format:check # Check formatting
pnpm typecheck    # TypeScript type checking
```

## Architecture

### Core Stack

- **Astro 5** - Static site generator (ESM, TypeScript)
- **Tailwind CSS 4** - Styling via Vite plugin
- **React** - Used sparingly for interactive components only
- **pnpm** - Package manager

### Content Collections (`src/content/`)

Strongly typed via Zod schemas in `src/content.config.ts`:

- `authors/` - Author JSON files with profile pics
- `blog/` - Blog posts (markdown with frontmatter, each in its own folder)
- `chapters/` - Book chapter descriptions
- `faq/` - FAQ entries
- `quotes/` - Testimonials
- `reviews/` - Book reviews

### Key Directories

- `src/components/` - Astro components (`.astro`) and React components (`.tsx`)
- `src/components/blog/` - Blog-specific components including `BlogLayout.astro`
- `src/components/ui/` - Reusable UI components (badge, button, card)
- `src/pages/` - Astro routes (index, blog, RSS, 404)
- `src/plugins/` - Remark plugins (admonitions for tip/note/warning/etc.)
- `src/lib/` - Utilities, constants, theme configuration
- `src/images/` - Images optimized by Astro

### Markdown Features

Blog posts support admonitions via remark-directive:

```markdown
:::tip[Custom Title]
Content here
:::
```

Types: `tip`, `note`, `important`, `caution`, `warning`

## Development Principles

1. **Astro-first**: Prefer Astro components over React. Use React only for interactive features that require client-side JS.

2. **Mobile-first responsive**: Use Tailwind breakpoint prefixes (`sm:`, `md:`, `lg:`) starting from mobile layouts.

3. **Accessibility required**: Semantic HTML, proper heading hierarchy, ARIA labels, keyboard navigation, WCAG AA contrast.

4. **Data-driven content**: Separate data from templates. Use content collections with Zod schemas.

5. **Lean and fast**: Optimize images, minimize JS, pre-build everything possible.

## Spec-Driven Development Workflow

This project uses a spec-driven development workflow:

1. **Specify** - Create feature branch and specification
2. **Plan** - Generate implementation plan from spec
3. **Tasks** - Break plan into executable tasks

Templates are in `templates/` and helper scripts in `scripts/`.

## Blog Article Creation

New blog articles should:

- Follow the template in `.claude/article-brief-template.md`
- Use modern ESM syntax and async/await
- Include FAQ section for schema markup
- Place each article in its own folder under `src/content/blog/<slug>/`

### Content Writing Style

When writing or editing content, follow these guidelines:

**Tone and Readability**

- Use a friendly, approachable tone, almost colloquial, as if explaining to a colleague
- Write conversationally while maintaining technical accuracy
- Avoid overly formal or academic language

**Punctuation**

- Never use em dashes (—). Use commas, parentheses, or separate sentences instead

**Structure and Flow**

- Always provide context first: explain "what" and "why" before diving into "how"
- Emphasize the "why": readers should understand not just how something works, but why it matters
- Connect sections smoothly using:
  - Forward references: "In the next section, we'll see how to handle errors"
  - Backward references: "As we saw earlier, streams provide memory efficiency"
  - Previews: "Before we implement this, let's understand the underlying concept"

**Technical Explanations**

- Start with the problem or use case before the solution
- Explain progressively: simple version first, then edge cases
- Use real-world analogies for abstract concepts
