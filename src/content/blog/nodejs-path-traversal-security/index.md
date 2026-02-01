---
date: 2026-01-30T10:00:00
updatedAt: 2026-01-30T10:00:00
title: 'Node.js Path Traversal: Prevention & Security Guide'
slug: nodejs-path-traversal-security
description: Learn to prevent path traversal attacks in Node.js. Secure file servers with input validation, boundary checks, and defense-in-depth patterns.
authors: ['luciano-mammino']
tags: ['blog']
faq:
  - question: What is a path traversal attack in Node.js?
    answer: A path traversal attack exploits improper input validation to access files outside the intended directory using sequences like "../" to navigate up the filesystem. In Node.js, this often happens when user input is passed directly to path.join() or fs functions without validation.
  - question: How do I prevent path traversal in Node.js?
    answer: Prevent path traversal by (1) decoding user input, (2) rejecting absolute paths, (3) resolving paths with path.resolve(), (4) following symlinks with fs.realpath(), and (5) verifying the final path stays within your root directory using startsWith().
  - question: Is path.join() safe from path traversal?
    answer: No, path.join() does not prevent path traversal. It simply concatenates paths without security validation. An input like "../../etc/passwd" will be joined as-is, allowing directory escape. Always validate paths after joining.
  - question: How do I secure file uploads in Node.js?
    answer: Secure file uploads by (1) validating filenames with strict patterns, (2) storing files with generated names rather than user-provided ones, (3) serving files through a validated path resolution function, and (4) using file handles to minimize TOCTOU race conditions.
---

Building on our extensive [Node.js File Operations Guide](/blog/reading-writing-files-nodejs/), let's explore one of the most critical security vulnerabilities related to handling files and paths in web applications: **path traversal attacks**.

## When Simple File Serving can Become Dangerous

You've built a Node.js application that serves user-uploaded images. The implementation is clean, efficient, and uses modern streaming APIs. But what happens when a malicious user requests `../../etc/passwd` instead of `cat.jpg`? Suddenly, your simple file server could become a gateway to your entire server filesystem.

This article will guide you through understanding, detecting, and preventing path traversal attacks in Node.js web servers. We'll start with a vulnerable implementation, demonstrate how attackers exploit it, and then build a secure solution using modern Node.js APIs.

If you build applications that allow users to read files from the filesystem—whether it's serving uploads, generating downloads, or processing user-specified paths—this is essential reading.


## Quick Answer: Secure Path Resolution

If you're already familiar with path traversal attacks and just need a quick checklist to sanity-check your implementation, here's the summary:

To prevent path traversal in Node.js:

1. **Decode user input** with `decodeURIComponent()` (handle double encoding with a loop)
2. **Reject null bytes** that can truncate paths
3. **Reject absolute paths** with `path.isAbsolute()`
4. **Resolve to canonical path** with `path.resolve()`
5. **Follow symlinks** with `fs.realpath()`
6. **Verify path stays within root** using `startsWith(root + path.sep)`

```js
const safePath = path.resolve(root, decodeURIComponent(userInput))
const realPath = await fs.realpath(safePath)
if (!realPath.startsWith(root + path.sep)) {
  throw new Error('Path traversal detected')
}
```

Read on for the complete implementation with all edge cases handled, and to understand *why* each of these measures is necessary and how they work together to protect your application.


## Understanding Path Traversal Vulnerabilities

### What is a Path Traversal Attack?

A **path traversal** (also known as **directory traversal**) attack is a security vulnerability that allows an attacker to access files and directories stored outside the intended web root folder. By manipulating variables that reference files with "dot-dot-slash (../)" sequences and variations, an attacker can read arbitrary files on the server.

### Why Are These Attacks Dangerous?

Path traversal vulnerabilities can lead to:

1. **Information Disclosure**: Attackers can read sensitive files like configuration files, database credentials, or private keys.
2. **System Compromise**: In some cases, attackers might access system files that reveal information about the server's architecture.
3. **Data Theft**: Access to application data files could lead to data breaches.
4. **Lateral Movement**: Information gained from these attacks can help attackers plan further attacks on your system.

### The Anatomy of a Path Traversal Attack

Path traversal attacks typically follow these steps:

1. **Identify Vulnerability**: The attacker discovers that user input is used to construct file paths.
2. **Craft Payload**: The attacker creates a payload with directory traversal sequences.
3. **Exploit**: The attacker sends the payload to the server.
4. **Access Files**: If successful, the attacker can now access files outside the intended directory.


## The Vulnerable Implementation: A Naive Image Server

Let's begin with a common but vulnerable implementation of an image server:

```js
import { createServer } from 'node:http'
import { createReadStream } from 'node:fs'
import path from 'node:path'

// VULNERABLE: Do not use in production
const server = createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)

  // Extract user-provided path (e.g., /images/cats/kitty.jpg)
  const rel = url.pathname.replace(/^\/images\//, '')

  // DANGEROUS: Directly joining user input with our directory
  const filePath = path.join(process.cwd(), 'uploads', rel)

  // Set content type based on file extension
  const ext = path.extname(filePath).toLowerCase()
  const type =
    ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
    ext === '.png' ? 'image/png' :
    ext === '.gif' ? 'image/gif' :
    'application/octet-stream'

  const stream = createReadStream(filePath)
  stream.once('open', () => {
    res.writeHead(200, { 'Content-Type': type })
    stream.pipe(res)
  })
  stream.once('error', () => {
    res.writeHead(404)
    res.end('Image not found')
  })
})

server.listen(3000, () => {
  console.log('Image server running at http://localhost:3000')
})
```

### Why This Code is Vulnerable

Let's break down the security issues in this implementation:

1. **Unvalidated User Input**: The code directly uses `url.pathname` without any validation.
2. **Unsafe Path Construction**: `path.join()` simply concatenates paths without checking if the result stays within the intended directory.
3. **No Boundary Checking**: There's no verification that the final path is still within the `uploads` directory.
4. **No Input Sanitization**: Special characters like `../` are not filtered or handled safely.

When a user requests `/images/../../etc/passwd`, the code:
1. Extracts `../../etc/passwd` from the URL
2. Joins it with the current working directory and `uploads`
3. Results in a path like `/home/user/myapp/uploads/../../etc/passwd`
4. Which resolves to `/home/user/etc/passwd` - completely outside our intended directory!

:::warning[Real-World Impact]
This exact pattern has led to serious security breaches in production applications. Attackers can use path traversal to:
- Read `/etc/passwd` to enumerate system users
- Access `.env` files containing API keys and database credentials
- Read private SSH keys from `~/.ssh/id_rsa`
- Access application source code to find more vulnerabilities
:::


## The Attack: Common Exploitation Techniques

### Understanding the Vulnerability in Action

A path traversal attack occurs when user input is used to construct file paths without proper validation. Attackers exploit this by using special sequences like `../` to navigate up the directory structure.

Consider what happens when a malicious user requests:
```
/images/../../etc/passwd
```

Our server takes this path, removes the `/images/` prefix, and joins it with our uploads directory:
```js
path.join(process.cwd(), 'uploads', '../../etc/passwd')
```

This resolves to something like `/home/user/myapp/uploads/../../etc/passwd`, which is equivalent to `/home/user/etc/passwd` - completely outside our intended uploads directory!

### Common Attack Vectors

Path traversal attacks can take many sophisticated forms:

1. **Basic traversal**: `../../etc/passwd`
2. **URL encoding**: `..%2F..%2Fetc%2Fpasswd`
3. **Double encoding**: `..%252F..%252Fetc%252Fpasswd`
4. **Windows paths**: `..\..\windows\system32\config\sam`
5. **Mixed encoding**: `..%2F..%5Cetc%2Fpasswd`
6. **Overlong UTF-8**: `..%c0%af..%c0%afetc%c0%afpasswd` (largely a legacy attack vector - modern UTF-8 parsers reject these malformed sequences, but older systems may be vulnerable)

:::tip[URL Decoding Matters]
Many HTTP servers and frameworks decode URL-encoded characters once, but behavior varies by framework. The important point is that validation must happen **after** full URL decoding, not before. Always decode input explicitly rather than relying on framework behavior.
:::

### Real-World Examples

Path traversal vulnerabilities have affected many major applications:

1. **Apache HTTP Server (CVE-2021-41773)**: A path traversal flaw in Apache httpd 2.4.49 that allowed attackers to map URLs to files outside the document root, leading to arbitrary file reads and potential RCE.
2. **`st` npm module (CVE-2014-6394)**: A classic Node.js ecosystem example where the popular static file serving module was vulnerable to directory traversal via URL-encoded sequences.
3. **`serve` npm module (CVE-2019-5418)**: Path traversal vulnerability in the serve package allowing access to files outside the served directory through crafted requests.
4. **Jenkins (CVE-2024-23897)**: Arbitrary file read via CLI "@file" argument expansion - while not pure path traversal, it demonstrates how path-based input can lead to unauthorized file access.
5. **Node.js (CVE-2023-32002)**: Policy bypass via path traversal in Node.js experimental policy feature, allowing module loading restrictions to be circumvented.

:::tip[Keep Node.js Updated]
The Node.js team actively patches security vulnerabilities. Always keep your Node.js runtime updated to the latest LTS version to benefit from security fixes. Run `node --version` to check your version and visit [nodejs.org](https://nodejs.org) for the latest releases.
:::


## The Defense: Building a Secure File Server

Now that we understand the threat, let's build a secure implementation. We'll create a multi-layered defense using modern Node.js APIs.

### Step 1: Path Validation and Canonicalization

First, let's create a utility function that safely resolves user-provided paths:

```js
import path from 'node:path'
import fs from 'node:fs/promises'

function fullyDecode(input) {
  let result = String(input)
  // Decode repeatedly until the string stops changing (handles double/triple encoding)
  // Limit iterations to prevent infinite loops on malformed input
  for (let i = 0; i < 10; i++) {
    try {
      const decoded = decodeURIComponent(result)
      if (decoded === result) break
      result = decoded
    } catch {
      break // Stop on decode error (malformed encoding)
    }
  }
  return result
}

export async function safeResolve(root, userPath) {
  // Fully decode any URL-encoded characters (handles double encoding)
  const decoded = fullyDecode(userPath)

  // Reject null bytes (used to bypass extension checks)
  if (decoded.includes('\0')) {
    throw new Error('Null bytes not allowed')
  }

  // Reject absolute paths immediately
  if (path.isAbsolute(decoded)) {
    throw new Error('Absolute paths not allowed')
  }

  // Reject Windows drive letters (e.g., C:, D:)
  if (/^[a-zA-Z]:/.test(decoded)) {
    throw new Error('Drive letters not allowed')
  }

  // Reject UNC paths (e.g., \\server\share or //server/share)
  if (decoded.startsWith('\\\\') || decoded.startsWith('//')) {
    throw new Error('UNC paths not allowed')
  }

  // Normalize the path and resolve against our root
  const resolved = path.resolve(root, decoded)

  // Resolve symlinks to prevent symlink-based escapes
  const real = await fs.realpath(resolved).catch(() => resolved)

  // Also resolve root to handle symlinks in the root path
  const realRoot = await fs.realpath(root).catch(() => path.resolve(root))

  // Use path.relative for robust containment check
  // This handles: Windows case-insensitivity, root edge cases (e.g., root === '/'),
  // and trailing slash variations
  const relative = path.relative(realRoot, real)

  // If relative path starts with '..' or is absolute, it's outside root
  // Empty string means they're the same path (accessing root itself is allowed)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Path traversal detected')
  }

  return real
}
```

### Understanding the Security Measures

Let's break down each security measure in our `safeResolve` function:

1. **Full Input Decoding**: The `fullyDecode` function handles URL-encoded characters in a loop, decoding repeatedly until the string stops changing. This catches double encoding attacks (`%252F` → `%2F` → `/`) and triple encoding. We limit to 10 iterations to prevent infinite loops on malicious input.

2. **Null Byte Rejection**: Null bytes (`\0`) are used in null byte injection attacks to truncate paths. For example, `valid.jpg\0../../etc/passwd` might pass extension checks but access different files. We reject these explicitly.

3. **Absolute Path Rejection**: `path.isAbsolute()` prevents attackers from specifying absolute paths like `/etc/passwd` directly.

4. **Windows Drive Letter Rejection**: Paths like `C:` or `D:` can escape to different drives on Windows. We reject these with a regex check.

5. **UNC Path Rejection**: UNC paths (`\\server\share` or `//server/share`) can access network resources. We block these to prevent network-based attacks.

6. **Path Resolution**: `path.resolve()` normalizes the path, handling `.` and `..` segments correctly. This converts relative paths to absolute paths and removes any path traversal sequences.

7. **Symlink Resolution**: `fs.realpath()` follows symbolic links to their actual destinations, preventing symlink-based escapes. An attacker could create a symlink inside the uploads directory pointing to sensitive files elsewhere - this prevents that attack. We also resolve the root path to handle symlinks in the root itself.

8. **Boundary Checking**: We use `path.relative()` to compute the relative path from root to the resolved path. If it starts with `..` or is absolute, the path is outside our root. This approach correctly handles: Windows case-insensitivity, edge cases when `root === '/'`, and trailing slash variations.

:::important[Why Both Resolve and Realpath?]
`path.resolve()` handles `..` sequences but doesn't follow symlinks. `fs.realpath()` follows symlinks but only works for paths that exist on disk - for non-existent paths, it throws an error (which we catch and fall back to the resolved path). Using both provides defense in depth - even if one has a subtle bug or edge case, the other provides protection. Note that symlink protection only applies to files that already exist.
:::

### Step 2: Secure Streaming Implementation

Now let's update our server to use this secure path resolution:

```js
import { createServer } from 'node:http'
import { open } from 'node:fs/promises'
import { pipeline } from 'node:stream/promises'
import path from 'node:path'
import { safeResolve } from './safe-resolve.js'

const ROOT = path.resolve(process.cwd(), 'uploads')

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.png') return 'image/png'
  if (ext === '.gif') return 'image/gif'
  if (ext === '.webp') return 'image/webp'
  return 'application/octet-stream'
}

const server = createServer(async (req, res) => {
  let fileHandle
  try {
    const url = new URL(req.url, `http://${req.headers.host}`)
    const rel = url.pathname.replace(/^\/images\//, '')

    // Safely resolve the user-provided path
    const imagePath = await safeResolve(ROOT, rel)

    // Open file handle immediately after validation to minimize TOCTOU window
    fileHandle = await open(imagePath, 'r')

    res.writeHead(200, { 'Content-Type': contentTypeFor(imagePath) })

    // Stream from the file handle, not the path
    const stream = fileHandle.createReadStream()
    await pipeline(stream, res)
  } catch (error) {
    // Don't expose internal error details to the client
    if (!res.headersSent) {
      res.writeHead(400)
    }
    res.end('Invalid path or image not found')

    // Log the actual error for debugging
    console.error('File serving error:', error.message)
  } finally {
    // Ensure the file handle is always closed
    await fileHandle?.close()
  }
})

server.listen(3000, () => {
  console.log('Secure image server running at http://localhost:3000')
})
```

### Why This Implementation is Secure

1. **Path Validation**: Uses our `safeResolve` function to validate all paths before file access.
2. **TOCTOU Mitigation**: Opens a file handle immediately after validation, minimizing the window for race condition attacks.
3. **Error Handling**: Provides generic error messages to avoid information leakage while logging details for debugging.
4. **Streaming with Pipeline**: Uses [`pipeline()`](/blog/reading-writing-files-nodejs/#stream-composition-and-processing) for proper backpressure handling and automatic cleanup.
5. **Resource Cleanup**: Uses `try/finally` to ensure file handles are always closed, even on errors.
6. **Immutable Root**: The `ROOT` constant is resolved once at startup and never modified.

:::tip[Why Pipeline Over Pipe?]
The `pipeline()` function from `node:stream/promises` is superior to `.pipe()` because it:
- Properly propagates errors from any stream in the chain
- Automatically cleans up streams on error or completion
- Returns a promise that resolves when streaming is complete
- Handles backpressure correctly across all streams

Learn more about streams in our [file operations guide](/blog/reading-writing-files-nodejs/#nodejs-streams-memory-efficient-file-processing) and our [stream consumer patterns article](/blog/node-js-stream-consumer/).
:::


## Additional Security Measures

### Defense in Depth

While our secure implementation addresses the primary vulnerability, security best practice demands multiple layers of protection:

1. **Input Validation**: Implement strict validation for allowed characters and patterns
2. **Allowlist Approach**: When possible, maintain an allowlist of permitted files
3. **Rate Limiting**: Prevent brute force attempts to discover files
4. **File Permissions**: Run your Node.js process with minimal filesystem permissions
5. **Containerization**: Use containers to limit filesystem access at the OS level

### Integration with Express.js

If you're using Express.js, here's how to integrate secure path resolution:

```js
import express from 'express'
import path from 'node:path'
import { safeResolve } from './safe-resolve.js'

const app = express()
const ROOT = path.resolve(process.cwd(), 'uploads')

app.get('/files/:filepath(*)', async (req, res) => {
  try {
    const safePath = await safeResolve(ROOT, req.params.filepath)
    res.sendFile(safePath)
  } catch (error) {
    console.error('Path validation failed:', error.message)
    res.status(400).send('Invalid path')
  }
})

app.listen(3000)
```

Note: Express's `res.sendFile()` has some built-in protections, but always validate paths yourself rather than relying on framework behavior.

### Implementing Input Validation

Add an extra layer of validation with strict filename rules:

```js
function validateFileName(fileName) {
  // Only allow alphanumeric characters, dots, hyphens, and underscores
  const validPattern = /^[a-zA-Z0-9._-]+$/

  if (!validPattern.test(fileName)) {
    throw new Error('Invalid filename')
  }

  // Reject files starting with a dot (hidden files)
  if (fileName.startsWith('.')) {
    throw new Error('Hidden files not allowed')
  }

  // Reject files with path separators
  if (fileName.includes('/') || fileName.includes('\\')) {
    throw new Error('Path separators not allowed')
  }

  return fileName
}
```

This validation layer catches attacks even before path resolution, providing defense in depth.

### Windows-Specific Considerations

Windows has unique path characteristics that require additional attention:

1. **Drive Letters**: Ensure paths can't escape to different drives (`C:\`, `D:\`)
2. **UNC Paths**: Block UNC paths like `\\server\share\file`
3. **Reserved Names**: Avoid Windows reserved names like `CON`, `PRN`, etc.
4. **Case Insensitivity**: Windows treats `File.txt` and `file.txt` as the same

```js
function isWindowsReservedName(name) {
  const reservedNames = [
    'CON', 'PRN', 'AUX', 'NUL',
    'COM0', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT0', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
    'CONIN$', 'CONOUT$'
  ]

  const baseName = path.basename(name, path.extname(name)).toUpperCase()
  return reservedNames.includes(baseName)
}

function isUNCPath(pathStr) {
  // UNC paths start with \\ or //
  return pathStr.startsWith('\\\\') || pathStr.startsWith('//')
}

function hasDriveLetter(pathStr) {
  // Check for C:, D:, etc.
  return /^[a-zA-Z]:/.test(pathStr)
}
```

:::warning[Platform-Specific Attacks]
Always test your security measures on the platforms you deploy to. A validator that works on Linux might fail on Windows due to path separator differences (`/` vs `\`) or case sensitivity.
:::

### Race Condition Protection (TOCTOU)

**Time-of-Check-Time-of-Use (TOCTOU)** attacks exploit the time gap between validating a path and actually accessing the file. For a deeper dive into race conditions in Node.js, see our [comprehensive guide on Node.js race conditions](/blog/node-js-race-conditions/). During this gap, an attacker might:
- Replace a safe file with a symlink to a sensitive file
- Swap directories to bypass validation

Our main server implementation above already mitigates this by opening a file handle immediately after path validation using `fs/promises.open()`. By streaming from the file handle rather than the path, we ensure the file being accessed is the same one that was validated.

:::note[TOCTOU in Practice]
While TOCTOU attacks are theoretically possible, they're difficult to exploit in practice with our `safeResolve` implementation because:
1. `realpath()` validates at access time, not just check time
2. The attack window is extremely small (microseconds)
3. The attacker needs write access to the uploads directory

However, defense in depth means we still minimize the risk by using file handles.
:::


## Testing Your Implementation

### Security Testing with Assertions

Always test your security implementations rigorously:

```js
import assert from 'node:assert'
import { safeResolve } from './safe-resolve.js'

async function testSafeResolve() {
  const root = '/app/uploads'

  // Valid paths should resolve correctly
  const validPath = await safeResolve(root, 'images/cat.jpg')
  assert(validPath.startsWith(root))
  console.log('✓ Valid path resolves correctly')

  // Traversal attempts should throw
  try {
    await safeResolve(root, '../../etc/passwd')
    assert.fail('Should have thrown for traversal attempt')
  } catch (error) {
    assert(error.message.includes('Path traversal detected'))
    console.log('✓ Basic traversal blocked')
  }

  // Absolute paths should be rejected
  try {
    await safeResolve(root, '/etc/passwd')
    assert.fail('Should have thrown for absolute path')
  } catch (error) {
    assert(error.message.includes('Absolute paths not allowed'))
    console.log('✓ Absolute paths rejected')
  }

  // URL-encoded traversal should be caught
  try {
    await safeResolve(root, '..%2F..%2Fetc%2Fpasswd')
    assert.fail('Should have thrown for encoded traversal')
  } catch (error) {
    assert(error.message.includes('Path traversal detected'))
    console.log('✓ Encoded traversal blocked')
  }

  // Double-encoded traversal should be caught
  try {
    await safeResolve(root, '..%252F..%252Fetc%252Fpasswd')
    assert.fail('Should have thrown for double-encoded traversal')
  } catch (error) {
    assert(error.message.includes('Path traversal detected'))
    console.log('✓ Double-encoded traversal blocked')
  }

  // Windows backslash traversal should be caught
  try {
    await safeResolve(root, '..\\..\\..\\windows\\system32\\config\\sam')
    assert.fail('Should have thrown for backslash traversal')
  } catch (error) {
    assert(error.message.includes('Path traversal detected'))
    console.log('✓ Windows backslash traversal blocked')
  }

  // Null byte injection should be rejected
  try {
    await safeResolve(root, 'valid.jpg\0../../etc/passwd')
    assert.fail('Should have thrown for null byte')
  } catch (error) {
    assert(error.message.includes('Null bytes not allowed'))
    console.log('✓ Null byte rejected')
  }

  // UNC paths should be rejected
  try {
    await safeResolve(root, '//server/share/sensitive.txt')
    assert.fail('Should have thrown for UNC path')
  } catch (error) {
    assert(error.message.includes('UNC paths not allowed'))
    console.log('✓ UNC paths rejected')
  }

  console.log('\n✓ All security tests passed!')
}

testSafeResolve().catch(console.error)
```

### Penetration Testing Checklist

Test your implementation against these attack scenarios:

- [ ] **Basic Traversal**: `../../../etc/passwd`
- [ ] **URL Encoding**: `..%2F..%2Fetc%2Fpasswd`
- [ ] **Double Encoding**: `..%252F..%252Fetc%252Fpasswd`
- [ ] **Unicode/UTF-8**: `..%c0%af..%c0%afetc%c0%afpasswd`
- [ ] **Null Bytes**: `valid.jpg%00../../etc/passwd`
- [ ] **Backslashes**: `..\..\..\windows\system32\config\sam`
- [ ] **Mixed Separators**: `..\/..\/etc/passwd`
- [ ] **Absolute Paths**: `/etc/passwd`, `C:\Windows\System32`
- [ ] **UNC Paths**: `\\server\share\sensitive.txt`
- [ ] **Long Paths**: Extremely long path strings (buffer overflow attempts)
- [ ] **Symlink Attacks**: Create symlink in uploads pointing outside

:::tip[Automated Security Testing]
Consider using tools like:
- **[Snyk](https://snyk.io/)** for dependency vulnerability scanning
- **[npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)** for known vulnerabilities in dependencies
- **[OWASP ZAP](https://www.zaproxy.org/)** for web application security testing
- **[Burp Suite](https://portswigger.net/burp)** for manual penetration testing
:::


## Monitoring and Incident Response

### Logging Suspicious Activity

Implement comprehensive logging to detect and respond to attacks:

```js
import { createWriteStream } from 'node:fs'

const securityLog = createWriteStream('security.log', { flags: 'a' })

function logSecurityEvent(event, details) {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    event,
    ...details
  }

  securityLog.write(JSON.stringify(logEntry) + '\n')
  console.error(`[SECURITY] ${event}:`, details)
}

// Usage in your server
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`)
    const rel = url.pathname.replace(/^\/images\//, '')

    const imagePath = await safeResolve(ROOT, rel)
    // ... serve file
  } catch (error) {
    logSecurityEvent('path_traversal_attempt', {
      path: rel,
      decoded: fullyDecode(rel),  // Using the fullyDecode helper from earlier
      userAgent: req.headers['user-agent'],
      ip: req.socket.remoteAddress,
      error: error.message
    })

    // Return generic error to client
    if (!res.headersSent) {
      res.writeHead(400)
    }
    res.end('Invalid path')
  }
})
```

### Detecting Attack Patterns

Monitor logs for suspicious patterns that might indicate an attack:

```js
const suspiciousPatterns = [
  /\.\./,           // Directory traversal
  /%2e%2e/i,        // Encoded dots
  /%252e/i,         // Double encoded
  /\0/,             // Null bytes
  /etc\/passwd/,    // Common target
  /\.env/,          // Environment files
  /\.ssh/,          // SSH keys
  /\/\.\./,         // Absolute traversal
]

function isSuspiciousPath(pathStr) {
  return suspiciousPatterns.some(pattern => pattern.test(pathStr))
}

// Enhanced logging
if (isSuspiciousPath(rel)) {
  logSecurityEvent('high_risk_path_detected', {
    path: rel,
    ip: req.socket.remoteAddress,
    timestamp: Date.now()
  })
}
```

### Incident Response Plan

If you detect a path traversal attack:

1. **Immediate Response**
   - Block the attacking IP address (temporarily or permanently)
   - Review recent logs for the same IP or user agent
   - Check if any sensitive files were actually accessed

2. **Investigation**
   - Analyze access logs for patterns and scope
   - Check file access timestamps for sensitive files
   - Review application logs for other suspicious activities
   - Determine if the attack was automated or targeted

3. **Remediation**
   - Patch the vulnerability immediately
   - Review and strengthen validation logic
   - Update security tests to prevent regression
   - Consider implementing Web Application Firewall (WAF) rules

4. **Post-Incident**
   - Document the incident and response
   - Update incident response procedures
   - Rotate any credentials that might have been exposed
   - Notify relevant stakeholders if data was compromised


## Best Practices Summary

### Secure Coding Checklist

- [ ] **Never Trust User Input** - Always validate and sanitize all user-provided data
- [ ] **Use Absolute Paths** - Work with resolved, canonical paths internally
- [ ] **Implement Boundary Checks** - Verify paths stay within allowed directories
- [ ] **Handle Errors Gracefully** - Don't expose internal details to users
- [ ] **Layer Your Defenses** - Multiple validation steps (defense in depth)
- [ ] **Decode Before Validation** - Handle URL encoding, double encoding, etc.
- [ ] **Follow Symlinks** - Use `realpath()` to prevent symlink-based escapes
- [ ] **Log Security Events** - Track suspicious activities for monitoring
- [ ] **Test Thoroughly** - Include security tests in your test suite

### Node.js Specific Recommendations

1. **Use Modern APIs**: Prefer `fs/promises` over callbacks for cleaner async code
2. **Stream Large Files**: Use [streams for memory efficiency](/blog/reading-writing-files-nodejs/#nodejs-streams-memory-efficient-file-processing)
3. **Handle Backpressure**: Use `pipeline()` for proper stream management
4. **Validate Early**: Check paths before any file system operation
5. **Consider Security Modules**: Use packages like `helmet` for HTTP security headers

### Operational Security

1. **Principle of Least Privilege**: Run your application with minimal filesystem permissions
2. **Regular Updates**: Keep Node.js and dependencies updated with security patches
3. **Security Audits**: Regularly audit code and dependencies (`npm audit`)
4. **Comprehensive Monitoring**: Implement logging and alerting for security events
5. **Incident Response Plan**: Have procedures ready for responding to security incidents
6. **Container Isolation**: Use Docker or similar to limit filesystem access at OS level


## Conclusion: Security is Not Optional

Path traversal vulnerabilities are deceptively simple to introduce but can have devastating consequences. A single missing validation can expose your entire filesystem to attackers.

**Key takeaways:**

1. **Never trust user input** - Validate, decode, and sanitize all user-provided paths
2. **Use canonical paths** - Resolve symlinks and normalize paths with `path.resolve()` and `fs.realpath()`
3. **Implement boundary checks** - Verify resolved paths stay within allowed directories
4. **Handle errors securely** - Don't leak internal details; log them server-side instead
5. **Layer your defenses** - Multiple validation steps provide protection even if one fails
6. **Test thoroughly** - Include security tests alongside functional tests

By incorporating these practices into your development workflow, you'll build Node.js applications that can withstand common attack vectors. Security isn't an afterthought - it's a fundamental aspect of writing reliable, professional code.

:::tip[Continue Learning]
This article builds on concepts from our [Node.js File Operations Guide](/blog/reading-writing-files-nodejs/). If you haven't read it yet, check it out to deepen your understanding of Node.js file handling with promises, streams, and file handles.
:::


## Additional Resources

### Essential Reading

1. **[OWASP Path Traversal](https://owasp.org/www-community/attacks/Path_Traversal)** - Comprehensive overview from OWASP
2. **[CWE-22: Improper Limitation of a Pathname](https://cwe.mitre.org/data/definitions/22.html)** - Common Weakness Enumeration entry
3. **[Node.js Security Best Practices](https://nodejs.org/en/learn/getting-started/security-best-practices)** - Official Node.js security guide
4. **[SANS Top 25 Software Errors](https://www.sans.org/top25-software-errors/)** - Industry-standard security issues

### Tools and Libraries

- **[@sindresorhus/is-path-inside](https://github.com/sindresorhus/is-path-inside)** - Utility to check if a path is inside another path
- **[path-type](https://github.com/sindresorhus/path-type)** - Check what a path is (file, directory, symlink)
- **[helmet](https://helmetjs.github.io/)** - Security HTTP headers for Express.js

### Further Learning

For a deeper dive into Node.js security, consider:

- **Node.js Design Patterns** - Our book covers security patterns and best practices throughout ([learn more](/))
- **[Liran Tal's Node.js Security](https://www.nodejs-security.com/)** - Comprehensive Node.js security resources
- **[Snyk's Node.js Security Guide](https://snyk.io/blog/nodejs-security-best-practices/)** - Modern security practices

Remember: **security is an ongoing process**, not a one-time fix. Stay informed about new vulnerabilities, regularly review your code, and always prioritize secure coding practices from the start.
