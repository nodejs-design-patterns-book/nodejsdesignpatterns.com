# Node.js Design Patterns Website

This is the source code for the official website of the book **"Node.js Design Patterns"** by Mario Casciaro and Luciano Mammino. The website serves as the primary landing page and resource hub for the book.

## 🌐 Live Site

The website is available at **[https://nodejsdesignpatterns.com](https://nodejsdesignpatterns.com)**

The site is deployed as a static site on GitHub Pages and is automatically updated on every push to the `main` branch.

## 🛠️ Technology Stack

This project is built with:

- **[Astro](https://astro.build/)** - Static site generator for optimal performance
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[React](https://react.dev/)** - Used sparingly for interactive components
- **TypeScript** - For type safety and better developer experience
- **pnpm** - Fast, disk space efficient package manager

## 📁 Project Structure

```text
/
├── .claude/                  # Claude Code AI assistant configuration
│   └── commands/            # Custom Claude commands
├── .github/                  # GitHub Actions workflows
├── public/                   # Static assets served directly
│   └── images/              # Public images
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── pages/          # Page-specific components
│   │   │   └── Home/       # Home page components
│   │   │       └── components/ # Shared Home components
│   │   ├── ui/             # Generic UI components (Astro)
│   │   │   └── social/     # Social media icons
│   │   ├── blog/           # Blog-related components
│   │   ├── AnimatedCounter.tsx  # React: Animated counter component
│   │   └── ParallaxBackground.tsx # React: Parallax background effect
│   ├── content/            # Content collections (Astro)
│   │   ├── authors/        # Author information
│   │   ├── blog/           # Blog posts with assets
│   │   ├── chapters/       # Book chapters
│   │   ├── faq/            # FAQ entries
│   │   ├── quotes/         # Testimonial quotes
│   │   └── reviews/        # Book reviews
│   ├── hooks/              # React hooks (minimal set)
│   │   ├── useAnimatedCounter.tsx # Hook for counter animation
│   │   └── useInView.tsx   # Hook for viewport detection
│   ├── images/             # Optimized images for Astro
│   │   ├── authors/        # Author photos
│   │   ├── mktg/           # Marketing images
│   │   ├── people/         # People photos
│   │   └── promo/          # Promotional materials
│   ├── lib/                # Utility functions and constants
│   ├── pages/              # Astro pages and routes
│   │   └── blog/           # Blog pages
│   └── styles/             # Global CSS and theme files
└── dist/                   # Built site (generated)
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended package manager)

### Installation

```bash
# Clone the repository
git clone [repository-url]

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The site will be available at `http://localhost:4321`

## 🧞 Available Commands

| Command             | Action                                       |
| :------------------ | :------------------------------------------- |
| `pnpm install`      | Installs dependencies                        |
| `pnpm dev`          | Starts local dev server at `localhost:4321`  |
| `pnpm build`        | Build your production site to `./dist/`      |
| `pnpm preview`      | Preview your build locally, before deploying |
| `pnpm lint`         | Run ESLint on the codebase                   |
| `pnpm lint:fix`     | Fix auto-fixable ESLint issues               |
| `pnpm format`       | Format code with Prettier                    |
| `pnpm format:check` | Check code formatting                        |
| `pnpm typecheck`    | Run TypeScript type checking                 |

## 🤖 AI Assistant Support

This project is configured to work seamlessly with AI coding assistants:

- **[Claude Code](https://claude.ai/code)** - Full project configuration in `.claude/` directory

The AI assistant configuration includes project structure understanding, coding standards, and constitutional principles to help maintain consistency and quality during development.

## 🤝 Contributing

Contributions are **super welcome**! Whether you want to:

- Fix a bug
- Add a new feature
- Improve documentation
- Enhance accessibility
- Optimize performance

Please feel free to:

1. **Open an Issue** - For bug reports, feature requests, or questions
2. **Submit a Pull Request** - For code contributions

### Before Contributing

Please read our [project constitution](memory/constitution.md) to understand our coding standards, principles, and guidelines.

### Development Guidelines

- Follow the mobile-first responsive design approach
- Maintain accessibility standards (WCAG AA)
- Keep the site lean and performant
- Prefer Astro components over React when possible
- Write semantic HTML with proper ARIA attributes
- Ensure all PRs pass linting and formatting checks

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📚 About the Book

"Node.js Design Patterns" is a comprehensive guide to mastering Node.js development through proven design patterns and best practices. Learn more about the book and purchase it from the official website.

---

Built with ❤️ using [Astro](https://astro.build) | Deployed on [GitHub Pages](https://pages.github.com)
