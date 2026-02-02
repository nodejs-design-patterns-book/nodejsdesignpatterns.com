# Node.js Design Patterns Website Constitution

## Core Principles

### Minimal Static Site

This project represents a minimal static site built with Astro. The core principle is to keep the site lean and fast for the users. So everything that can be pre-built should be pre-built. Images should be optimized and served in modern formats (e.g., WebP) to reduce load times. Whenever we implement a new feature we should aim for the smallest possible footprint and, if possible, the simplest and least intrusive solution.

This means for example favoring Astro components and minimal vanilla JavaScript snippets, rather than React.
React is also available for more advanced use cases, though. But it should be used sparingly.

### Modern tooling

This website assumes we use modern tooling such as recent versions of Node.js and pnpm and Tailwind CSS for styling.

### Data-driven approach

Where it makes sense we separate data from actual templates, components and other rendering logic. We have data files organized in the `src/content` subdivided in specific types, for example `authors`, `blog`, `chapters`, `quotes`, `faq`, and `reviews`. Each piece of content can be in markdown or JSON format and it should be strongly typed using Astro collections which are defined in `src/content.config.ts`.

### Responsive mobile-first design

The website must be designed to follow a responsive mobile-first approach. This is generally achieved using specific Tailwind CSS utilities that prioritize mobile layouts and progressively enhance them for larger screens (e.g., using `sm:`, `md:`, and `lg:` prefixes).

### Accessibility

The website must follow accessibility best practices to ensure it is usable by everyone, including users with disabilities. This includes:

- Using semantic HTML elements (e.g., `<main>`, `<nav>`, `<section>`, `<article>`, `<header>`, `<footer>`)
- Providing meaningful alt text for all images and decorative images marked with empty alt attributes
- Ensuring proper heading hierarchy (h1, h2, h3, etc.) without skipping levels
- Maintaining sufficient color contrast ratios (WCAG AA standard: 4.5:1 for normal text, 3:1 for large text)
- Making all interactive elements keyboard accessible with visible focus indicators
- Using ARIA labels and attributes when semantic HTML is insufficient
- Ensuring forms have properly associated labels and error messages
- Testing with screen readers and keyboard navigation
- Providing skip links for main content navigation

### Coding standards

We adhere to a set of coding standards to ensure code quality and maintainability. This includes using consistent naming conventions, writing clear and concise comments (which must provide business context and describe why we do certain things and not how, the code should be clear enough not to require code-specific comments), and following best practices for each technology used in the project.

The repository uses well-defined formatting rules through [Prettier](https://prettier.io/) and linting through [ESLint](https://eslint.org/).

### Content Writing Style

When creating or editing written content (blog articles, documentation, tutorials), follow these style guidelines:

#### Tone and Readability
- Use a **friendly, approachable tone** - almost colloquial, as if explaining to a colleague
- Write in a conversational style while maintaining technical accuracy
- Avoid overly formal or academic language

#### Punctuation and Formatting
- **Never use em dashes (—)** - use commas, parentheses, or separate sentences instead
- Use short paragraphs and clear sentence structure
- Break up long explanations with code examples, lists, or callouts

#### Structure and Flow
- **Always provide context first** - explain the "what" and "why" before diving into "how"
- **Emphasize the "why"** - readers should understand not just how something works, but why it matters and why it works that way
- **Connect sections smoothly** using:
  - Forward references: "In the next section, we'll see how to handle errors"
  - Backward references: "As we saw earlier, streams provide memory efficiency"
  - Brief previews of what's coming: "Before we implement this, let's understand the underlying concept"

#### Technical Explanations
- Start with the problem or use case before introducing the solution
- Explain concepts progressively - simple version first, then edge cases and advanced usage
- Use real-world analogies when explaining abstract concepts
- Include practical examples that readers can relate to their own projects

## Deployment

The website is automatically deployed to GitHub Pages through a GitHub Actions workflow. The deployment process is triggered on every push to the `main` branch. The workflow builds the static site and publishes it to GitHub Pages, making it accessible to users. Contributors do not need to manually handle deployment - focus on code quality and the automated pipeline will handle the rest.

## Governance

- Everyone is welcome to contribute as long as they follow the established guidelines and best practices.
- Every PR should be reviewed and approved by at least one other contributor before being merged.
- Every PR must pass basic formatting and linting checks before being merged.
- PRs should be squashed before merging to maintain a clean commit history.
- Articles and other textual changes should be proofread for clarity and coherence (AI usage is allowed and encouraged).

**Version**: 1.0.0 | **Ratified**: 2025-09-04 | **Last Amended**: 2025-09-04
