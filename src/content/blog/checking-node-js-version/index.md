---
date: 2025-09-09T10:00:00
updatedAt: 2025-09-09T10:00:00
title: How to check Node.js version and package manager versions
slug: checking-node-js-version
description: Learn how to check your current Node.js version and the versions of popular package managers including npm, pnpm, and yarn
authors: ['luciano-mammino']
tags: ['blog']
---

Whether you're debugging compatibility issues, ensuring you're running the right version for a project, or just curious about your current setup, knowing how to check your Node.js version and package manager versions is essential for any Node.js developer.

## Why version checking matters

Knowing your versions is crucial for several reasons:

1. **Compatibility**: Different projects may require specific Node.js or package manager versions
2. **Feature availability**: Newer versions include new features and improvements
3. **Security**: Keeping track of versions helps ensure you're running secure, up-to-date software
4. **Debugging**: Version mismatches are often the cause of unexpected behavior
5. **Project requirements**: Many projects specify minimum version requirements in their documentation
6. **Support and maintenance**: **This is critical** - according to the [official Node.js releases roadmap](https://nodejs.org/en/about/previous-releases), production applications should only use **Active LTS** or **Maintenance LTS** releases

The Node.js project follows a predictable release cycle where:

- Major versions are "Current" for six months
- Odd-numbered releases become unsupported after six months
- Even-numbered releases move to "Active LTS" with critical bug fixes guaranteed for 30 months
- Older, unsupported versions may have unaddressed security vulnerabilities

<figure>

![Horizontal timeline of the Node.js release schedule from Jun 2025 to Jun 2027. Rows for Main, 20, 22, 24, 25, 26. Colors: orange = unstable, green = current, blue = active, gray = maintenance. Node.js 20 is maintenance until May 2026. Node.js 22 is active to Nov 2025, then maintenance to May 2027. Node.js 24 goes current → active → maintenance (from Nov 2026). Node.js 25 is current Oct 2025–Apr 2026, then brief maintenance. Node.js 26 is current May–Nov 2026, then active.](./nodejs-releases-schedule-2025-09-09.svg)

<figcaption>Node.js official release schedule (as of September 2025)</figcaption>

</figure>

**Always ensure you're running a currently supported version** to get the best security, stability, and access to critical bug fixes. Check the [Node.js releases page](https://nodejs.org/en/about/previous-releases) regularly to stay informed about your version's support status.

In this article, we'll cover the simple commands to check versions of Node.js and popular package managers including **npm**, **pnpm**, and **yarn**.

## Checking Node.js version

The most straightforward way to check your Node.js version is using the `--version` or `-v` flag:

```bash title="loige@terminal"
node --version
# or
node -v
```

This will output something like:

```
v20.11.0
```

### Getting more detailed version information

To see all the compilation and runtime information, you can use the `-p` flag (short for `--print`), which evaluates a script and prints the result:

```bash title="loige@terminal"
node -p process.version
```

You can also get comprehensive version information including V8, OpenSSL, and other dependencies:

```bash title="loige@terminal"
node -p process.versions
```

This will output a detailed object with information about all the underlying components.

### Getting Node.js version from code

When writing Node.js applications, you might need to check the version programmatically:

```javascript
// versions.js

// Get the Node.js version
console.log('Node.js version:', process.version)

// Get all version information
console.log('All versions:', process.versions)

// Check if running a specific major version
const majorVersion = parseInt(process.version.slice(1))
if (majorVersion >= 24) {
  console.log('Running Node.js 24 or newer')
}

// Or if you want to extract major, minor, and patch versions as numbers
const [major, minor, patch] = process.version
  .substring(1)
  .split('.')
  .map((s) => Number.parseInt(s, 10))

console.log(`Major: ${major}, Minor: ${minor}, Patch: ${patch}`)
```

This is particularly useful for conditional features or compatibility checks in your applications.

## Checking package manager versions

Modern Node.js development relies heavily on package managers. Here's how to check the versions of the most popular ones:

### npm (Node Package Manager)

npm comes bundled with Node.js, so if you have Node.js installed, you likely have npm too:

```bash title="loige@terminal"
npm --version
# or
npm -v
```

Example output:

```
10.2.4
```

### pnpm

pnpm is a fast, space-efficient package manager that uses hard linking from a single content-addressable storage to save disk space and speed up installations. It's up to 2x faster than npm and provides stricter dependency management.

Full disclaimer, pnpm is my favorite package manager these days and it powers the dependency management of this very site, so check it out if you haven't already! 😊

If you have pnpm installed, check its version with:

```bash title="loige@terminal"
pnpm --version
# or
pnpm -v
```

Example output:

```
9.12.0
```

### yarn

Yarn is a modern package and project manager focused on providing stable, reproducible installations with excellent workspace management for projects of all sizes, from simple applications to enterprise monorepos.

For yarn users:

```bash title="loige@terminal"
yarn --version
# or
yarn -v
```

Example output:

```
1.22.19
```

## Upgrading your versions

If you discover you need to upgrade your Node.js version or install a different package manager, check out our comprehensive guide on [5 Ways to install Node.js](/blog/5-ways-to-install-node-js) which covers various installation and upgrade methods including version managers like **nvm** and **n**.

## Summary

Checking versions is a quick but essential task for Node.js developers:

- **Node.js**: `node --version` or `node -v`
- **npm**: `npm --version` or `npm -v`
- **pnpm**: `pnpm --version` or `pnpm -v`
- **yarn**: `yarn --version` or `yarn -v`

Keep these commands handy, and you'll always know what versions you're working with!
