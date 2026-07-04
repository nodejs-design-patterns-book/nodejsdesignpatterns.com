---
date: 2026-07-04T17:28:32
updatedAt: 2026-07-04T17:28:32
title: Environment Variables in Node.js
slug: nodejs-environment-variables
description: Learn how to use environment variables in Node.js with process.env, the native --env-file flag, validation, and security best practices.
authors: ['luciano-mammino']
tags: ['blog']
faq:
  - question: How do I access environment variables in Node.js?
    answer: Use the global process.env object. For example, process.env.API_URL returns the value of the API_URL variable. All values are coerced to strings, so you need to parse numbers and booleans yourself.
  - question: Does Node.js have built-in .env file support?
    answer: Yes, since Node.js 20.6.0 you can use the --env-file flag to load .env files without any dependencies. Run your app with node --env-file=.env app.js. Since 20.7.0, you can specify multiple files, and since 21.7.0 (backported to 20.12.0) you can also use process.loadEnvFile() programmatically.
  - question: Do I still need the dotenv package in Node.js?
    answer: For new projects running Node.js 20.6 or later, the native --env-file flag covers most use cases. However, dotenv still offers features the native implementation lacks, such as multiline values and variable expansion. Use dotenv if you need these advanced features or support older Node.js versions.
  - question: Should I store secrets in environment variables in Node.js?
    answer: It's common and convenient, but not ideal. Environment variables are inherited by child processes, visible in docker inspect output, and often captured by crash reporters and logs. For production, prefer a dedicated secrets manager or mounted secret files, and never commit secrets to version control.
  - question: What is NODE_ENV and should I use it?
    answer: NODE_ENV is a widely adopted convention (not an official Node.js feature) that indicates the runtime environment, typically set to "development" or "production". Many frameworks use it to toggle behavior. You should use it, but never rely on it alone for security decisions.
  - question: Why are all process.env values strings in Node.js?
    answer: Environment variables are strings at the operating system level. Node.js preserves this behavior, so process.env coerces everything to strings. The number 42 becomes "42", null becomes "null", and undefined becomes "undefined". Always validate and parse values at application startup.
---

We've all been there. You hardcode the base URL of the API your app talks to, everything works fine on your machine and in staging, and then the production deploy goes out still pointing at the staging endpoint. Now production is broken, and the only fix is to change the source code and redeploy. Or you crank the log level up to `debug` while chasing a bug, forget to change it back, and your production logs balloon overnight. These are exactly the problems that environment variables solve, and not just in JavaScript: they're a standard mechanism that every language and operating system supports. In this article, we'll see how to use environment variables in Node.js the right way.

The [Twelve-Factor App methodology](https://12factor.net/config) puts it simply: configuration that varies between deploys belongs in the environment, not in the code. The litmus test is straightforward: could your codebase be open-sourced right now without compromising any credentials? Mind you, getting credentials out of the code is only half the story: as we'll discuss in a moment, environment variables aren't the ideal home for secrets either. But the principle holds for everything that varies between deploys (API endpoints, log levels, feature flags, etc.).

Environment variables give you a clean separation between your code and its configuration, and that separation is what enables the modern deployment workflow: you build and package your application once, then promote the exact same artifact (say, a Docker image) from development to staging to production, with each environment supplying its own configuration at runtime. No rebuilds, no environment-specific bundles. On top of that, environment variables are language and OS agnostic, they keep environment-specific values out of version control, and every deployment platform you'll encounter, whether it's Docker, Kubernetes, AWS, or a CI/CD pipeline, supports them natively.

In this guide, you'll learn everything you need to work with environment variables in Node.js effectively: when they're the right tool (and when they're not), the basics of `process.env`, the native `--env-file` flag introduced in Node.js 20.6, validation strategies, security best practices, and the full set of Node.js-specific variables you should know about.

:::note[Prerequisites]
The examples in this guide use **top-level `await`** and ESM syntax. Set `"type": "module"` in your `package.json` or use the `.mjs` extension. All examples assume Node.js 20 or later (Node.js 22+ for some features). If you need to install or update Node.js, check out our guide on [5 ways to install Node.js](/blog/5-ways-to-install-node-js/).
:::

## Quick Answer: `process.env`

If you just need to read an environment variable, here's the short version:

```javascript
// app.js
const apiUrl = process.env.API_URL

if (!apiUrl) {
  console.error('Missing API_URL environment variable')
  process.exit(1)
}

console.log(`Using API at ${apiUrl}`)
```

Run it by passing the variable inline:

```bash
API_URL=https://api.example.com node app.js
```

That's the core idea. But there are plenty of gotchas hiding behind this simplicity: string coercion traps, `.env` file loading options, validation strategies, and security concerns. Keep reading to learn how to handle environment variables like a pro.

## When to Use Environment Variables (and When Not To)

Before we dive into the mechanics, it's worth being honest about what environment variables are good at and where they fall short. Not every piece of configuration belongs in the environment.

Environment variables shine for configuration that **changes between deploys and isn't particularly sensitive**:

- The port and host your server binds to
- Log levels and debug flags
- URLs of the services your app depends on
- Feature flags and tuning knobs
- The environment name itself (`NODE_ENV`)

The common thread is that these values differ between your laptop, staging, and production, but nothing terrible happens if someone sees them. And because they live outside the code, you can build your application once and run that exact same artifact in every environment, just with a different configuration wrapped around it.

They're a poor fit for other kinds of configuration, though:

- **Large or structured configuration**: if you need nested objects, lists, or dozens of related settings, a proper configuration file (JSON, YAML, TOML) loaded per environment is easier to read and review. Use environment variables to select the environment and override individual values, not to encode your entire config.
- **Values that never change between deploys**: those are constants, and they belong in code where they can be reviewed and versioned.
- **Secrets, ideally**: this one deserves its own explanation.

Here's the nuance. The Twelve-Factor App methodology treats credentials as just another piece of config to store in the environment, and in practice that's what most teams do. I'll confess I've shipped more than one `DATABASE_URL` with a password embedded in it, simply because it's so convenient. But convenience is exactly the problem: environment variables leak more easily than you might expect.

- Every child process inherits them by default (we'll see this in detail later)
- They're visible in `docker inspect` output
- On Linux, they can be read from `/proc/<pid>/environ` by any process running as the same user
- Crash reporters and error-tracking tools love to capture the entire environment in their reports

For production systems, the more robust approach is a dedicated secrets manager, like HashiCorp Vault or AWS Secrets Manager, that your app queries at runtime, or secrets mounted as files with restricted permissions. Kubernetes, for example, explicitly recommends secret volumes over environment variables for exactly these reasons. Secrets managers also unlock something environment variables fundamentally can't: integrated secret rotation. Because the app fetches secrets while it runs, credentials can be rotated centrally without restarting the process or redeploying the app. An environment variable, by contrast, is a snapshot taken at process startup: to pick up a new value, you have to restart.

That said, let's stay pragmatic: secrets passed as environment variables, injected at runtime by a trusted platform and never written to a committed file, are still a huge improvement over credentials hardcoded in your source. If that's where your project is today, you're in good company. Just be aware of the trade-off, and treat "move the secrets to a proper secrets manager" as a natural next step as your application grows. We'll come back to these risks in the security best practices section later in this guide.

With the "when" sorted, let's get into the "how", starting with how `process.env` actually works.

## Understanding `process.env`

### How `process.env` Works

`process.env` is a plain JavaScript object that Node.js populates at process startup from the operating system's environment. It's available globally without any imports, and it behaves like any other object in many ways: you can enumerate its keys, destructure it, and spread it.

```javascript
// explore-env.js

// List all environment variables
console.log(Object.keys(process.env).length, 'variables found')

// Destructure specific variables
const { HOME, USER, SHELL } = process.env
console.log(`User: ${USER}, Home: ${HOME}, Shell: ${SHELL}`)

// Spread into a new object
const envCopy = { ...process.env }
```

What might surprise you is that `process.env` is **not read-only**. You can set and delete properties at runtime:

```javascript
// runtime-env.js

// Set a new variable
process.env.MY_CUSTOM_VAR = 'hello'
console.log(process.env.MY_CUSTOM_VAR) // 'hello'

// Delete a variable
delete process.env.MY_CUSTOM_VAR
console.log(process.env.MY_CUSTOM_VAR) // undefined
```

These runtime changes are **local to the current process**. They don't affect the operating system, they don't persist after the process exits, and they don't propagate back to parent processes. However, child processes spawned after a change will inherit the modified environment, because they receive a snapshot of the parent's environment at spawn time.

### The String Coercion Gotcha

This is one of the most common sources of bugs when working with environment variables. Because environment variables are strings at the operating system level, Node.js coerces **everything** to strings when you assign to `process.env`:

```javascript
// string-coercion.js

// Numbers become strings
process.env.PORT = 3000
console.log(typeof process.env.PORT) // 'string'
console.log(process.env.PORT) // '3000'

// Booleans become strings
process.env.DEBUG = true
console.log(process.env.DEBUG) // 'true'

// Even null and undefined become strings!
process.env.EMPTY = null
console.log(process.env.EMPTY) // 'null'
process.env.MISSING = undefined
console.log(process.env.MISSING) // 'undefined'
```

:::warning[The "false" trap]
`if (process.env.FEATURE_ENABLED)` evaluates to `true` even when the value is `"false"`, because `"false"` is a non-empty string. Always compare explicitly: `process.env.FEATURE_ENABLED === 'true'`.
:::

This behavior means you should never use truthy/falsy checks for boolean environment variables. A value of `"false"`, `"0"`, or even `"null"` will all evaluate as truthy in a conditional check. Always parse and validate explicitly. See for yourself:

```javascript
// truthy-traps.js

if ('0') {
  console.log('"0" is truthy') // this prints!
}

if ('false') {
  console.log('"false" is truthy') // this prints too!
}

if ('null') {
  console.log('"null" is truthy') // yep, this one as well!
}

// The only falsy string is the empty string
if ('') {
  console.log('this never prints')
}
```

One more thing worth knowing: this implicit conversion is officially deprecated. Future versions of Node.js may throw an error when the assigned value is not a string, number, or boolean, so it's a good habit to assign strings explicitly.

### Platform Differences

On Unix-like systems (Linux, macOS), environment variable names are **case-sensitive**: `PATH` and `Path` are two different variables. On Windows, they are **case-insensitive**: `PATH`, `Path`, and `path` all refer to the same variable.

This matters if you're building cross-platform applications. If you set `process.env.myVar` on Windows, you can read it as `process.env.MYVAR` and it will work. On Linux, it won't. The safest approach is to use a consistent naming convention (typically `UPPER_SNAKE_CASE`) across all platforms.

## Setting Environment Variables

### Inline (Command-Line) Variables

The simplest way to pass an environment variable to a Node.js process is inline, right before the command:

```bash
PORT=3000 node app.js
```

You can pass multiple variables at once:

```bash
LISTEN_ADDRESS=0.0.0.0 PORT=3000 NODE_ENV=production node app.js
```

These variables exist only for the duration of that single command. Once the process exits, they're gone. This approach is great for quick testing and one-off scripts.

:::tip[npm scripts]
You can use inline variables in `package.json` scripts too. However, this syntax doesn't work on Windows `cmd`. For cross-platform npm scripts, consider the `--env-file` flag instead (covered next).
:::

### Shell Export

To make a variable available for the entire shell session, use `export` in bash or zsh:

```bash
export LOG_LEVEL=debug
node app.js   # Can read process.env.LOG_LEVEL
node other.js # This one too
```

The variable persists until you close the terminal or explicitly `unset` it. For variables you want available in every session, add the `export` line to your shell profile (`~/.bashrc`, `~/.zshrc`, or similar).

### System-Level Variables

You can also set environment variables at the system level through your OS settings (e.g., `/etc/environment` on Linux, System Preferences on macOS, System Properties on Windows). These are available to all processes for all users.

However, for application configuration, system-level variables are rarely the right choice. They're hard to manage across environments, easy to forget about, and they affect every process on the machine. For application-specific configuration, `.env` files are the modern standard, and Node.js now supports them natively.

## Loading `.env` Files: Native Support vs. dotenv

For years, the `dotenv` package was the standard way to load `.env` files in Node.js. Since Node.js 20.6, there's a built-in alternative. Let's explore both options and when to use each.

### The Native `--env-file` Flag (Node.js 20.6+)

Starting with Node.js 20.6.0, you can load `.env` files directly using the `--env-file` CLI flag. No packages to install, no code to add:

```bash
node --env-file=.env app.js
```

Create a `.env` file in your project root:

```bash
# .env
# Database configuration
DATABASE_URL=postgres://localhost:5432/myapp

# Server settings
PORT=3000
HOST=0.0.0.0

# Local dev secrets can live here, but ONLY if this file never gets committed
API_KEY=your-api-key-here

# Values with special characters need quotes
APP_NAME="My Awesome App"
GREETING='Hello, World!'
QUERY_STRING="search=node&page=1"
MESSAGE="This has a # hash inside"
```

:::note[.env file format]
Each line is a `KEY=VALUE` pair. Use double or single quotes for values containing `=` or `#` characters. Anything after a `#` is treated as a comment (inline comments after a value work too), and empty lines are ignored. A leading `export ` keyword before a variable name is ignored, which is handy when converting shell scripts. Multiline values inside quoted strings are supported since Node.js 20.12/21.7.
:::

Since Node.js 20.7.0, you can specify **multiple `.env` files**. Later files take precedence over earlier ones, which is useful for layering base and local configurations:

```bash
node --env-file=.env --env-file=.env.local app.js
```

In this example, any variables defined in `.env.local` will override those in `.env`. A common pattern is to commit `.env` with default (non-sensitive) values and add `.env.local` to `.gitignore` for developer-specific overrides.

For optional `.env` files that may not exist (e.g., `.env.local` in CI environments), use `--env-file-if-exists` (added in Node.js 22.9.0) to avoid errors when the file is missing:

```bash
node --env-file=.env --env-file-if-exists=.env.local app.js
```

**An important precedence rule**: environment variables that are already set in the OS take precedence over values in the `.env` file. The `.env` file won't overwrite existing variables. This is useful in production where you set real values through your deployment platform and the `.env` file only provides development defaults. But it can be surprising if you expect the file to always win.

### `process.loadEnvFile()` and `util.parseEnv()`

Starting with Node.js 21.7.0 (backported to 20.12.0, so LTS users have it too), you can also load `.env` files programmatically:

```javascript
// load-env-programmatic.js

// Load a .env file at runtime
process.loadEnvFile('.env')

// Or parse .env content from a string
import { parseEnv } from 'node:util'

const envContent = `
DATABASE_URL=postgres://localhost/mydb
PORT=3000
`

const parsed = parseEnv(envContent)
console.log(parsed.DATABASE_URL) // 'postgres://localhost/mydb'
console.log(parsed.PORT) // '3000'
```

`process.loadEnvFile()` is handy for conditional loading (e.g., only in development) or for loading files from non-standard locations. `util.parseEnv()` is useful when you have `.env`-formatted content from a source that isn't a file, like a configuration service response.

:::caution[NODE_OPTIONS in .env files]
`NODE_OPTIONS` defined in a `.env` file only takes effect when loaded via the `--env-file` CLI flag, because the flag is processed before the script runs. If you use `process.loadEnvFile()` instead, `NODE_OPTIONS` won't affect the current process because initialization has already completed.
:::

### The dotenv Package

Before native `.env` support, the [`dotenv`](https://github.com/motdotla/dotenv) package was the de facto standard. You'll still find it in many codebases:

```javascript
// Using dotenv
import 'dotenv/config'

// That's it. process.env now has your .env values.
console.log(process.env.DATABASE_URL)
```

Or with more control:

```javascript
import dotenv from 'dotenv'

dotenv.config({ path: '.env.production', override: true })
```

The `override: true` option tells dotenv to overwrite existing environment variables, which differs from the native `--env-file` behavior where OS variables always win.

### Native vs. dotenv: When to Use Which

| Feature                       | Native `--env-file`          | dotenv                           |
| ----------------------------- | ---------------------------- | -------------------------------- |
| Zero dependencies             | Yes                          | No                               |
| Multiline values              | Yes (20.12+, quoted strings) | Yes                              |
| Variable expansion (`${VAR}`) | No                           | Yes (dotenv-expand)              |
| Multiple .env files           | Yes (20.7.0+)                | Yes (`path` array, dotenv 16.4+) |
| Optional file loading         | Yes (`--env-file-if-exists`) | Manual check                     |
| Programmatic loading          | Yes (20.12.0+ / 21.7.0+)     | Yes                              |
| Env precedence (OS wins)      | Yes                          | Configurable (`override` option) |
| Minimum Node.js               | 20.6.0                       | Any                              |

For new projects on Node.js 20.6 or later, the native `--env-file` flag is the recommended choice. It covers the vast majority of use cases with zero dependencies. Stick with dotenv if you need variable expansion (e.g., `DATABASE_URL=postgres://${DB_USER}:${DB_PASS}@localhost/mydb`), or if you need to support older Node.js versions.

:::tip[Migration from dotenv]
Replace `import 'dotenv/config'` with the `--env-file` CLI flag. The `.env` format is compatible. Test that none of your values rely on variable expansion syntax (`${VAR}`), which the native implementation doesn't support.
:::

## Validating Environment Variables

Reading environment variables is easy. The hard part is ensuring they're actually correct. Without validation, a missing or malformed variable might not cause an error until it's buried deep in your application logic, maybe during a database query that runs hours after startup, or in an edge case that only triggers in production.

The principle is simple: **fail fast at startup with clear errors**. If your app needs `API_URL` and it's missing, crash immediately with a helpful message rather than starting up and failing silently later.

### Manual Validation

For a zero-dependency approach, a simple validation function does the job:

```javascript
// config.js
function loadConfig() {
  const errors = []

  const apiUrl = process.env.API_URL
  if (!apiUrl) {
    errors.push('API_URL is required')
  }

  const port = Number(process.env.PORT || '3000')
  if (Number.isNaN(port) || port < 1 || port > 65535) {
    errors.push('PORT must be a number between 1 and 65535')
  }

  const nodeEnv = process.env.NODE_ENV || 'development'
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    errors.push('NODE_ENV must be "development", "production", or "test"')
  }

  if (errors.length > 0) {
    console.error('Configuration errors:')
    errors.forEach((err) => console.error(`  - ${err}`))
    process.exit(1)
  }

  return Object.freeze({
    apiUrl,
    port,
    nodeEnv,
  })
}

export const config = loadConfig()
```

This approach collects all errors before exiting, so developers see every missing or invalid variable at once instead of fixing them one at a time.

### Validation with Zod

For larger applications, a schema validation library like [Zod](https://zod.dev/) gives you more expressive validation with less code:

```javascript
// config.js
import { z } from 'zod'

const envSchema = z.object({
  API_URL: z.string().url('API_URL must be a valid URL'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  API_KEY: z.string().min(1, 'API_KEY is required'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
})

const result = envSchema.safeParse(process.env)

if (!result.success) {
  console.error('Invalid environment variables:')
  for (const issue of result.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`)
  }
  process.exit(1)
}

export const config = Object.freeze(result.data)
```

The `z.coerce.number()` parser handles the string-to-number conversion automatically, which is particularly useful for environment variables since they're always strings.

:::tip[znv for better coercion]
Check out the [`znv`](https://github.com/lostfictions/znv) package for parsing environment variables with Zod. It handles string-to-type coercion more naturally and provides a cleaner API tailored for env var parsing.
:::

### Structuring Your Config Module

Regardless of which validation approach you choose, the pattern should be the same: create a single `config.js` module that validates all environment variables at import time and exports a frozen config object. Other modules import from `config.js` instead of accessing `process.env` directly.

```javascript
// app.js
import { config } from './config.js'

// Use typed, validated config everywhere
console.log(`Starting server on port ${config.port}`)
console.log(`Environment: ${config.nodeEnv}`)
```

This centralization gives you a single place to see every environment variable your app needs, makes testing easier (you can mock the config module), and ensures that invalid configuration is caught at startup, not at runtime.

## Security Best Practices

As we discussed earlier, environment variables end up holding your most sensitive data in many real-world setups: database credentials, API keys, encryption secrets. Ideally your most critical secrets live in a dedicated secrets manager, but whenever they do travel through the environment, handling them carelessly can undo all the benefits they're supposed to provide.

### Keep `.env` Files Out of Version Control

This is the most fundamental rule. Add `.env` to your `.gitignore` immediately:

```bash
# .gitignore
.env
.env.local
.env.*.local
```

Instead, commit a `.env.example` file that documents every variable your app needs, with placeholder values:

```bash
# .env.example
DATABASE_URL=postgres://user:password@localhost:5432/myapp
PORT=3000
API_KEY=your-api-key-here
NODE_ENV=development
```

This serves as documentation for new team members and CI setup, without exposing real credentials.

Keep in mind that `.env` files are also a favorite target for attackers: vulnerabilities like [path traversal](/blog/nodejs-path-traversal-security/) are commonly exploited to read them straight off your server's filesystem, which is one more reason not to keep production secrets in files.

:::warning[Check your git history]
If you accidentally committed a `.env` file, adding it to `.gitignore` won't remove it from history. Anyone who clones the repo can still find the secrets. Rotate all exposed credentials immediately, then purge the file from history with `git filter-branch` or [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/).
:::

### Don't Log Environment Variables

It's tempting to add `console.log(process.env)` during debugging, but this dumps every secret to your logs. If those logs end up in a monitoring service, a log aggregator, or a crash report, your secrets are now exposed to anyone with access.

Instead, log selectively and redact sensitive values:

```javascript
// safe-logging.js
const SENSITIVE_KEYS = ['KEY', 'SECRET', 'TOKEN', 'PASSWORD', 'CREDENTIAL']

function isSensitive(key) {
  return SENSITIVE_KEYS.some((s) => key.toUpperCase().includes(s))
}

function safeLogEnv() {
  const safeEnv = {}
  for (const [key, value] of Object.entries(process.env)) {
    safeEnv[key] = isSensitive(key) ? '***REDACTED***' : value
  }
  console.log('Environment:', safeEnv)
}

safeLogEnv()
```

### Child Process Inheritance

When you spawn a child process in Node.js, it inherits a copy of the parent's entire environment by default. This includes all your secrets:

```javascript
// child-process-env.js
import { spawn } from 'node:child_process'

// DANGEROUS: child inherits ALL environment variables, including secrets
const child = spawn('node', ['untrusted-script.js'])

// SAFER: pass only what's needed
const safeChild = spawn('node', ['worker.js'], {
  env: {
    PATH: process.env.PATH,
    NODE_ENV: process.env.NODE_ENV,
    WORKER_ID: '1',
    // Intentionally NOT passing DATABASE_URL, API_KEY, etc.
  },
})
```

:::caution[Secrets in child processes]
A child process running user-provided code with access to `DATABASE_URL` and `API_SECRET` is a security risk. Always pass only the variables the child process actually needs.
:::

### Secrets Management in Production

Environment variables are the right abstraction for passing configuration to your application, but storing and managing those secrets requires dedicated tooling in production:

- **Docker**: Use `-e` flag, `--env-file`, or Docker Compose `environment` / `env_file` directives. Avoid `ENV` directives in Dockerfiles for secrets since Docker layers are inspectable.
- **Kubernetes**: Use ConfigMaps for non-sensitive config and Secrets for credentials. Mount them as environment variables in your pod spec.
- **Cloud providers**: AWS Secrets Manager, Azure Key Vault, and GCP Secret Manager provide encrypted storage with access controls, rotation policies, and audit logs.
- **CI/CD**: GitHub Actions Secrets, GitLab CI Variables, and similar features inject secrets at build/deploy time without exposing them in code.

:::important[Never bake secrets into Docker images]
Avoid `ENV` directives in Dockerfiles for secrets. Docker layers are inspectable with `docker history` or `docker inspect`. Pass secrets at runtime via `-e` flags or mounted secret files.
:::

For more on running Node.js in containers, check out our guide on [Node.js development with Docker and Docker Compose](/blog/node-js-development-with-docker-and-docker-compose/).

## Node.js-Specific Environment Variables

Beyond your application's custom variables, Node.js itself uses several environment variables to control runtime behavior. Knowing these can save you hours of debugging and help you tune performance.

### `NODE_ENV`

`NODE_ENV` is probably the most widely known Node.js environment variable, but it's important to understand that it's a **convention, not an official Node.js feature**. It was popularized by Express, which uses it to toggle between development and production behavior (e.g., disabling verbose error pages in production).

```javascript
// node-env-example.js
const isDev = process.env.NODE_ENV !== 'production'

if (isDev) {
  console.log('Running in development mode')
  // Enable verbose logging, pretty-printing, etc.
}
```

Common values are `development`, `production`, and `test`. Many frameworks and libraries check `NODE_ENV` to toggle behavior: React disables development warnings in production, Express enables view caching, and bundlers like webpack apply optimizations.

A common misconception is that setting `NODE_ENV=production` magically makes your app faster. It doesn't. It simply tells **your code and your dependencies** to behave as if they're in production. If your dependencies don't check `NODE_ENV`, it has no effect. And you should never use it alone for security decisions, it's easy to set and provides no guarantees.

### `NODE_OPTIONS`

`NODE_OPTIONS` lets you set Node.js CLI flags via an environment variable, which is especially useful in environments where you can't control the `node` command directly:

```bash
# Increase memory limit
NODE_OPTIONS='--max-old-space-size=4096' node app.js

# Load .env file via NODE_OPTIONS
NODE_OPTIONS='--env-file=.env' node app.js

# Enable TypeScript stripping (Node.js 22.6+)
NODE_OPTIONS='--experimental-strip-types' node app.js

# Combine multiple flags
NODE_OPTIONS='--max-old-space-size=4096 --env-file=.env' node app.js
```

:::warning[Security implications of NODE_OPTIONS]
A malicious `NODE_OPTIONS` value could inject code via `--require` or `--import`. In production, ensure `NODE_OPTIONS` is set by trusted configuration only. The Node.js [Permission Model](https://nodejs.org/api/permissions.html) can help restrict this.
:::

### `NODE_DEBUG`

`NODE_DEBUG` enables debug output from Node.js built-in modules. This is invaluable for troubleshooting without adding logging libraries or modifying code:

```bash
# Debug HTTP client behavior
NODE_DEBUG=http node app.js

# Debug multiple modules
NODE_DEBUG=http,net,tls node app.js

# Debug module resolution
NODE_DEBUG=module node app.js

# Debug timers
NODE_DEBUG=timer node app.js
```

The output is verbose but can reveal exactly what's happening inside Node.js internals when something isn't behaving as expected.

### Controlling Colors and Warnings

These variables control the developer experience in terminals and CI environments:

- `FORCE_COLOR=1` (or `2`, `3`): Force colored output even when the terminal doesn't appear to support it. Useful in CI pipelines where color detection often fails.
- `NO_COLOR`: Disable all colored output. This is a [cross-tool standard](https://no-color.org/) respected by many CLI tools beyond Node.js.
- `NODE_DISABLE_COLORS=1`: Node.js-specific color disable.
- `NODE_NO_WARNINGS=1`: Suppress all Node.js process warnings (experimental feature warnings, deprecation notices, etc.).
- `NODE_REDIRECT_WARNINGS=file`: Write warnings to a file instead of stderr, keeping your application output clean.

```bash
# Get colored test output in CI
FORCE_COLOR=1 node --test

# Suppress warnings in production
NODE_NO_WARNINGS=1 node app.js
```

### TLS and Certificate Variables

These variables control TLS/SSL behavior and are especially relevant for corporate networks and development environments:

- `NODE_EXTRA_CA_CERTS=file`: Add additional CA certificates to the default set. Essential for corporate proxies and self-signed certificates.
- `NODE_TLS_REJECT_UNAUTHORIZED`: Set to `0` to disable TLS certificate validation.
- `NODE_USE_SYSTEM_CA=1`: Use the system CA certificate store instead of the bundled Mozilla CAs.
- `SSL_CERT_DIR` / `SSL_CERT_FILE`: OpenSSL certificate paths.

:::caution[NODE_TLS_REJECT_UNAUTHORIZED=0]
This disables **ALL** TLS validation, making your application vulnerable to man-in-the-middle attacks. Use `NODE_EXTRA_CA_CERTS` to add your specific CA certificate or `NODE_USE_SYSTEM_CA=1` to use system certificates instead. Never disable TLS validation in production.
:::

### Performance and Runtime Variables

- `UV_THREADPOOL_SIZE`: Controls the libuv thread pool size (default 4, max 1024). This affects async DNS lookups, [filesystem operations](/blog/reading-writing-files-nodejs/), and crypto operations. If your app is heavy on these, increasing the pool can improve throughput.
- `NODE_COMPILE_CACHE=dir`: V8 code cache directory for faster startup. Node.js caches compiled code so subsequent runs skip the compilation step.
- `TZ`: Sets the timezone for the process. Affects `Date`, `Intl`, and logging timestamps.

```bash
# Increase thread pool for I/O-heavy apps
UV_THREADPOOL_SIZE=16 node app.js

# Enable compilation cache
NODE_COMPILE_CACHE=/tmp/node-cache node app.js

# Set timezone
TZ=UTC node app.js
```

### Other Notable Node.js Variables

Here's a reference table for additional variables worth knowing:

| Variable                     | Purpose                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| `NODE_PATH`                  | Additional module lookup paths (mostly superseded by ESM)                                        |
| `NODE_ICU_DATA`              | Custom ICU data for internationalization                                                         |
| `NODE_REPL_HISTORY`          | Path to REPL history file                                                                        |
| `NODE_V8_COVERAGE=dir`       | Output directory for V8 code coverage data                                                       |
| `NODE_TEST_CONTEXT`          | Context value available in the built-in test runner                                              |
| `NODE_PENDING_DEPRECATION=1` | Emit pending deprecation warnings                                                                |
| `NODE_RUN_SCRIPT_NAME`       | Set by `node --run`, contains the script name being executed                                     |
| `NODE_USE_ENV_PROXY=1`       | Use `HTTP_PROXY`/`HTTPS_PROXY` env vars for Node.js [fetch requests](/blog/nodejs-http-request/) |

For the complete and up-to-date reference, see the [Node.js CLI documentation](https://nodejs.org/api/cli.html#environment-variables_1). You can also check your current Node.js version to know which features are available with our guide on [how to check Node.js version](/blog/checking-node-js-version/).

## Best Practices Summary

Here's a consolidated checklist for working with environment variables in Node.js:

1. **Validate at startup, fail fast**: Check all required variables before your app starts accepting requests. Report all errors at once, not one at a time.
2. **Centralize config access**: Create a single config module. Other code imports from it, never from `process.env` directly.
3. **Parse types explicitly**: Don't rely on truthiness. Convert strings to numbers, booleans, and enums at the boundary.
4. **Use the native `--env-file` flag**: Zero dependencies, built into Node.js 20.6+.
5. **Never commit `.env` files**: Add them to `.gitignore`. Commit a `.env.example` instead.
6. **Don't log the full environment**: Redact sensitive keys. A stray `console.log(process.env)` can leak secrets to your monitoring stack.
7. **Use a secrets manager in production**: Don't rely on `.env` files in production. Use your platform's secrets management solution.
8. **Document variables in `.env.example`**: New team members and CI pipelines need to know what variables are required.
9. **Be aware of string coercion**: Everything is a string. `"false"` is truthy. `"3000"` is not a number.
10. **Control child process inheritance**: Don't pass secrets to child processes that don't need them.

## Summary

Here's a quick reference for choosing the right approach:

| Approach                | Best For                                     | Node.js Version    |
| ----------------------- | -------------------------------------------- | ------------------ |
| `process.env`           | Reading variables already in the environment | All                |
| `--env-file`            | Loading `.env` files with no dependencies    | 20.6.0+            |
| `--env-file-if-exists`  | Optional `.env` files that may not exist     | 22.9.0+            |
| `process.loadEnvFile()` | Programmatic `.env` loading at runtime       | 20.12.0+ / 21.7.0+ |
| `util.parseEnv()`       | Parsing `.env`-formatted strings             | 20.12.0+ / 21.7.0+ |
| `dotenv`                | Variable expansion, older Node.js versions   | Any                |

Separating configuration from code is one of the most impactful things you can do for the maintainability and security of your applications. Environment variables give you a standard, portable way to do it, and they're what make it possible to build your app once and ship the same artifact to every environment. With the native `--env-file` flag, modern Node.js makes it easier than ever to work with `.env` files without adding dependencies.

Whether you're building a small script or a production service, the principles are the same: validate early, centralize access, parse types explicitly, and never let secrets leak into your code or logs.

:::tip[Ready to Master Node.js?]
Environment variables are just one piece of building production-grade applications. **Node.js Design Patterns** covers architectural patterns, module systems, async patterns, and more, everything you need to build reliable Node.js applications.

[Get a FREE chapter →](/#free-chapter)
:::

## Frequently Asked Questions

### How do I access environment variables in Node.js?

Use the global `process.env` object. For example, `process.env.API_URL` returns the value of the `API_URL` variable. All values are coerced to strings, so you need to parse numbers with `Number()` and compare booleans explicitly (e.g., `process.env.DEBUG === 'true'`). The `process.env` object is available globally without any imports.

### Does Node.js have built-in .env file support?

Yes, since Node.js 20.6.0 you can use the `--env-file` flag to load `.env` files without any dependencies. Run your app with `node --env-file=.env app.js`. Since 20.7.0, you can specify multiple files (later files override earlier ones), and since 21.7.0 (backported to 20.12.0) you can also use `process.loadEnvFile()` and `util.parseEnv()` for programmatic loading and parsing.

### Do I still need the dotenv package in Node.js?

For new projects running Node.js 20.6 or later, the native `--env-file` flag covers most use cases with zero dependencies. However, dotenv still offers features the native implementation lacks, most notably variable expansion (`${VAR}` syntax via dotenv-expand) and the `override` option that lets `.env` files overwrite existing OS variables. Use dotenv if you need these features or need to support older Node.js versions.

### Should I store secrets in environment variables in Node.js?

It's common and convenient, but not ideal. Environment variables are inherited by child processes by default, visible in `docker inspect` output, readable from `/proc/<pid>/environ` on Linux, and often captured by crash reporters and logging tools. For production systems, prefer a dedicated secrets manager (like AWS Secrets Manager or HashiCorp Vault) or secrets mounted as files with restricted permissions. If you do pass secrets as environment variables, make sure they're injected at runtime by your platform and never committed to version control.

### What is NODE_ENV and should I use it?

`NODE_ENV` is a widely adopted convention (not an official Node.js feature) that indicates the runtime environment, typically set to `"development"` or `"production"`. Many frameworks use it to toggle behavior: Express enables view caching, React disables dev warnings, and bundlers apply optimizations. You should use it as a convention, but never rely on it alone for security decisions since it's trivially easy to set.

### Why are all process.env values strings in Node.js?

Environment variables are strings at the operating system level. Node.js preserves this behavior, so `process.env` coerces everything to strings. The number `42` becomes `"42"`, `null` becomes `"null"`, and `undefined` becomes `"undefined"`. This means you should always validate and parse values at application startup using `Number()`, explicit string comparisons, or a validation library like Zod.
