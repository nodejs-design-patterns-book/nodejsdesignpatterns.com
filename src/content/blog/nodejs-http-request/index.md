---
date: 2026-01-29T12:00:00
updatedAt: 2026-01-29T12:00:00
title: How to make an HTTP request in Node.js
slug: nodejs-http-request
description: Learn to make HTTP requests in Node.js using built-in fetch(), http/https modules. Covers POST, authentication, streaming, and testing with code examples.
authors: ['luciano-mammino']
tags: ['blog']
faq:
  - question: What is the easiest way to make an HTTP request in Node.js?
    answer: The easiest way is using the built-in fetch() API, available since Node.js 18. Simply call fetch(url) and await the response. No external packages are required.
  - question: Does Node.js have a built-in fetch function?
    answer: Yes, since Node.js 18, fetch() is available as a built-in global function. You don't need to install any packages like node-fetch or axios to make HTTP requests.
  - question: How do I make a POST request with JSON in Node.js?
    answer: Use fetch() with method set to POST, set the Content-Type header to application/json, and pass your data through JSON.stringify() in the body option.
  - question: When should I use http/https modules instead of fetch?
    answer: For most use cases, use fetch(). The http/https modules are primarily useful when (1) working with Node.js versions before 18, (2) maintaining legacy codebases, or (3) integrating with libraries that expect http.IncomingMessage or http.ClientRequest objects. Modern fetch() supports streaming too, so that's no longer a reason to prefer the older modules.
  - question: Do I need axios or got to make HTTP requests in Node.js?
    answer: No, modern Node.js (18+) includes a built-in fetch() API that handles most use cases. External libraries like axios or got are optional and mainly useful for advanced features like automatic retries, request interceptors, or progress events.
---

Making HTTP requests is one of the most common tasks in Node.js development. Whether you're calling a REST API, fetching data from an external service, or building a web scraper, you'll need to know how to make HTTP requests effectively.

The good news is that modern Node.js includes everything you need to make HTTP requests without installing any external packages. If you've done HTTP requests in the browser before, what you'll learn today will feel very familiar. In this guide, we'll explore the built-in options and when to use each one.

## Quick Answer: Use `fetch()`

I get it, you don't have time to become an expert on everything there's to know about making HTTP requests with Node.js, so here's the quick answer you might be looking for.

If you're using Node.js 18 or later, the simplest way to make an HTTP request is with the built-in `fetch()` function:

```javascript
const response = await fetch('https://api.example.com/data')
const data = await response.json()
console.log(data)
```

That's it. No packages to install, no complex setup. But if you ship this to production, you might run into problems: hanging requests, silent failures, memory leaks from unhandled streams, and more. Keep reading to learn the patterns that will give you confidence when shipping code that makes HTTP requests to production.

## Using the Built-in `fetch()` API

As we just said, `fetch()` is the recommended way to make HTTP requests in modern Node.js. Let's dive into the extra details you need to use it effectively.

Since Node.js 18, the `fetch()` API is available globally without any imports. This is the same `fetch()` you might know from browser JavaScript, making it familiar and easy to use.

### Basic GET Request

```javascript
// fetch-get.js
try {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts/1')

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  console.log('Post title:', data.title)
} catch (error) {
  console.error('Failed to fetch:', error.message)
}
```

A few important points about this example:

- `fetch()` returns a Promise that resolves to a Response object
- The promise only rejects on network errors, not on semantic HTTP errors (4xx, 5xx). This distinction matters: **network errors** mean the request couldn't be completed at all (DNS failures, connection refused, timeouts), while **semantic HTTP errors** mean the request reached the server and got a valid HTTP response, but that response indicates something went wrong, either a client error (4xx) or a server error (5xx)
- Always check `response.ok` to handle semantic HTTP errors
- Use `.json()`, `.text()`, or `.blob()` to parse the response body and load it into memory

:::tip[Why does fetch require two steps?]
Some HTTP libraries hide this complexity and give you the full response body in one call, so why does fetch make you do it in two steps? This is because the HTTP protocol splits responses into headers and body.

The first `fetch()` call establishes the connection, sends the request, and parses **only the headers**. At this point, you can check the status code and decide whether to continue reading from the underlying socket. If the status is bad, you can stop right there and save bandwidth.

The body might be huge (think _downloading_ a video file or an AI model file!), so you get to choose how to read it:
- **Stream the response in chunks** (e.g. to a file), ideal for large response bodies
- **Load as binary, text, or JSON** for small responses (a few MBs max)
:::


### POST Request with JSON Body

POST requests are used when you need to attach data to your request. The request will have a body containing your payload, and the encoding depends on what the server expects. You tell the server how your data is encoded using the `Content-Type` header.

In this example, we use JSON (`application/json`), which is the most common format for APIs. Other common content types include:
- `multipart/form-data` for file uploads
- `application/x-www-form-urlencoded` for traditional HTML form submissions

```javascript
// fetch-post.js
try {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'My New Post',
      body: 'This is the content of my post.',
      userId: 1,
    }),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  console.log('Created post:', data)
} catch (error) {
  console.error('Failed to create post:', error.message)
}
```

### Adding Headers and Authentication

In the previous section, we already saw how to add headers to specify the content type. But there are other important use cases for headers, especially authentication.

```javascript
// fetch-auth.js
const token = process.env.API_TOKEN

try {
  const response = await fetch('https://api.example.com/protected', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'X-Custom-Header': 'custom-value',
    },
  })

  if (response.status === 401) {
    throw new Error('Unauthorized: Check your API token')
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  console.log(data)
} catch (error) {
  console.error('Request failed:', error.message)
}
```

The `Authorization: Bearer <token>` pattern shown above is called Bearer token authentication, defined in [RFC 6750](https://datatracker.ietf.org/doc/html/rfc6750). It's the most common authentication method for REST APIs.

Some services like AWS use more complex authentication schemes. For example, [AWS Signature V4](https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-auth-using-authorization-header.html) uses special headers like `Credential`, `SignedHeaders`, and `Signature` to sign requests.

In the snippet above you might be wondering what the `Accept` header is for. The `Accept` header tells the server what response format you prefer. For instance, some servers can return data as JSON, XML, or plain text depending on this header. For example, this is particularly useful when working with LLM-optimized APIs and websites. Without the right Accept header, they might default to verbose HTML format, making you burn precious tokens. Learn more about the [Accept header on MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Accept).

### Setting Timeouts

It's good practice not to let requests hang forever. This is especially important when HTTP requests are on the critical path of your workflows, a hanging request can slow down everything downstream.

Modern Node.js provides a simple way to add timeouts using `AbortSignal.timeout()`:

```javascript
// fetch-timeout.js
try {
  const response = await fetch('https://api.example.com/data', {
    signal: AbortSignal.timeout(5000), // Abort after 5 seconds
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  console.log(data)
} catch (error) {
  if (error.name === 'TimeoutError') {
    console.error('Request timed out')
  } else {
    console.error('Request failed:', error.message)
  }
}
```

`AbortSignal.timeout()` is available since Node.js 17.3 (or 16.14 LTS).

### Handling Different Response Types

Remember the two-step process we discussed earlier? Here are some shorthand approaches for common scenarios:

```javascript
// fetch-response-types.js

// JSON response
const jsonData = await fetch(url).then(res => res.json())

// Text response (HTML, plain text)
const textData = await fetch(url).then(res => res.text())

// Binary data (images, files)
const blobData = await fetch(url).then(res => res.blob())
const arrayBuffer = await fetch(url).then(res => res.arrayBuffer())

// Get response headers
const response = await fetch(url)
console.log('Content-Type:', response.headers.get('Content-Type'))
console.log('All headers:', Object.fromEntries(response.headers))
```

The `.then()` syntax is equivalent to a second `await`, but it allows you to write concise one-liners when you don't need to check the response status first.

### Streaming Requests and Responses

When dealing with large request bodies (like uploading a video file) or large response bodies (like downloading a dataset), you don't want to load everything into memory at once. Loading large payloads into memory can slow down your process or even crash it when it runs out of memory. For reliable systems, you want to keep memory usage constant and predictable regardless of the payload size. Streaming lets you process data in chunks as it flows through, using only a small buffer at any given time.

#### Streaming Uploads

To upload a large file without loading it entirely into memory, you can stream the file directly as the request body:

```javascript
// fetch-stream-upload.js
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'

async function uploadLargeFile(url, filePath) {
  const fileStats = await stat(filePath)
  const fileStream = createReadStream(filePath)

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Length': fileStats.size.toString(),
    },
    body: fileStream,
    duplex: 'half', // Required for streaming request bodies
  })

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`)
  }

  return response.json()
}

// Usage
await uploadLargeFile('https://api.example.com/upload', './large-video.mp4')
```

The `duplex: 'half'` option is required when using a stream as the request body. It tells fetch that we're sending data in one direction while potentially receiving data in the other.

#### Streaming Downloads

For large responses, you might want to process data as it arrives rather than waiting for the entire response. The `response.body` property gives you access to a `ReadableStream`:

```javascript
// fetch-stream.js
const response = await fetch('https://example.com/large-file')

if (!response.ok) {
  throw new Error(`HTTP error! status: ${response.status}`)
}

// response.body is a ReadableStream
const reader = response.body.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break

  const chunk = decoder.decode(value, { stream: true })
  process.stdout.write(chunk)
}
```

This approach is useful for processing [NDJSON streams](https://en.wikipedia.org/wiki/JSON_streaming), [Server-Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events), or any large response where you want to show progress or process data incrementally. For more advanced patterns, check out our guide on [JavaScript Async Iterators](/blog/javascript-async-iterators/).

For downloading files, you can pipe the response directly to disk using `Readable.fromWeb()`:

```javascript
// fetch-download.js
import { createWriteStream } from 'node:fs'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

const response = await fetch('https://example.com/large-file.zip')

if (!response.ok) {
  throw new Error(`HTTP error! status: ${response.status}`)
}

const nodeStream = Readable.fromWeb(response.body)
await pipeline(nodeStream, createWriteStream('./download.zip'))
console.log('Download complete!')
```

## Making Multiple Concurrent Requests

When you need to make multiple HTTP requests, you can run them concurrently for better performance:

```javascript
// concurrent-requests.js
async function fetchMultipleUsers(userIds) {
  const requests = userIds.map(id =>
    fetch(`https://jsonplaceholder.typicode.com/users/${id}`)
      .then(res => res.json())
  )

  // Wait for all requests to complete
  const users = await Promise.all(requests)
  return users
}

// Usage
const users = await fetchMultipleUsers([1, 2, 3, 4, 5])
console.log(`Fetched ${users.length} users`)
users.forEach(user => console.log(`- ${user.name}`))
```

If some requests might fail but you want to continue with the successful ones, use `Promise.allSettled()`:

```javascript
// concurrent-requests-settled.js
async function fetchMultipleWithFallback(urls) {
  const requests = urls.map(url =>
    fetch(url).then(res => res.json())
  )

  const results = await Promise.allSettled(requests)

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return { url: urls[index], data: result.value, error: null }
    } else {
      return { url: urls[index], data: null, error: result.reason.message }
    }
  })
}
```

When dealing with a large number of items (hundreds or thousands), firing all requests at once can overwhelm the server or exhaust your system's resources. In these cases, you need **limited concurrency**: running requests concurrently but with a maximum number of requests in flight at any given time. In **[Node.js Design Patterns](/)**, we dedicate multiple chapters to this topic, showing how to implement these patterns using callbacks, promises, and async/await. You might also want to read about [Node.js Race Conditions](/blog/node-js-race-conditions/) to understand common concurrency pitfalls.

## Handling Common Scenarios

### Retrying Failed Requests

Network requests can fail for many transient reasons: the server might be temporarily overloaded, a network blip might interrupt the connection, you might hit a rate limit, or a downstream service might be restarting. These failures are often temporary, and the same request might succeed if you just try again.

Implementing a retry mechanism is good practice for most HTTP requests, especially for critical operations. Here's a simple retry helper:

```javascript
// fetch-retry.js
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let lastError

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      lastError = error
      console.log(`Attempt ${attempt} failed: ${error.message}`)

      if (attempt < maxRetries) {
        // Exponential backoff: wait longer between retries
        const delay = Math.pow(2, attempt) * 100
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`)
}
```

This `fetchWithRetry` helper wraps `fetch()` and automatically retries failed requests up to `maxRetries` times. It uses exponential backoff between attempts (200ms, 400ms, 800ms...), giving the server time to recover. Both network errors and non-OK HTTP responses trigger a retry.

Note that this example is opinionated: it always parses the response as JSON and treats any non-OK status code as an error worth retrying. For a more flexible approach, you could return the raw response and let the caller decide how to parse it, or add logic to only retry on specific status codes (like 429 Too Many Requests or 503 Service Unavailable).

### Form Data and File Uploads

The earlier [Streaming Uploads](#streaming-uploads) section shows how to stream a file as raw bytes, where the entire request body is just the file content. That approach works when the API accepts a raw binary body, but most real-world APIs expect the `multipart/form-data` format instead. This format follows web standards (it's the same encoding used by HTML forms with `enctype="multipart/form-data"`) and lets you include metadata fields like descriptions, tags, or user IDs alongside the file.

To send `multipart/form-data` requests, use the `FormData` API:

```javascript
// fetch-upload.js
import { readFile } from 'node:fs/promises'

async function uploadFile(url, filePath) {
  const fileContent = await readFile(filePath)

  const formData = new FormData()
  formData.append('file', new Blob([fileContent]), 'upload.txt')
  formData.append('description', 'My uploaded file')

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    // Note: Don't set Content-Type header - fetch will set it automatically
    // with the correct boundary for multipart/form-data
  })

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`)
  }

  return await response.json()
}
```

:::caution[Memory usage warning]
This example uses `readFile()` which loads the entire file into memory before uploading. This works fine for small files (a few megabytes), but will cause problems with large files. Your process might slow down or crash if you try to upload a multi-gigabyte video this way.

For large file uploads, see the streaming approach below.
:::

#### Streaming Large Files with FormData

To avoid loading large files into memory while still using `multipart/form-data`, you can create a file-like object with a `stream()` method:

```javascript
// fetch-upload-stream-formdata.js
import { createReadStream } from 'node:fs'
import { basename } from 'node:path'

async function uploadLargeFileWithFormData(url, filePath, metadata) {
  const fileName = basename(filePath)

  const formData = new FormData()

  // Add metadata fields alongside the file
  formData.append('description', metadata.description)
  formData.append('category', metadata.category)

  // Add the file as a stream (not loaded into memory)
  formData.append('file', {
    [Symbol.toStringTag]: 'File',
    name: fileName,
    stream: () => createReadStream(filePath),
  })

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`)
  }

  return response.json()
}

// Usage
await uploadLargeFileWithFormData(
  'https://api.example.com/videos',
  './large-video.mp4',
  { description: 'My vacation video', category: 'travel' }
)
```

The trick here is creating a file-like object with a `stream()` method that returns a readable stream. Node.js's `fetch()` (powered by undici) recognizes this pattern and streams the file content instead of loading it into memory. The `[Symbol.toStringTag]: 'File'` property makes FormData accept the object as a valid file.

:::note
This technique is specific to Node.js and relies on how undici handles file-like objects. It won't work in browsers, which have their own `File` API.
:::

### Handling URL Query Parameters

When building URLs with query parameters, it's tempting to concatenate strings manually: `` `${baseUrl}?query=${userInput}` ``. This is dangerous. If `userInput` contains special characters like `&`, `=`, or `#`, your URL will break or behave unexpectedly. Worse, if the input comes from users, attackers could inject additional parameters or manipulate the URL structure.

Always use the `URL` and `URLSearchParams` APIs to build URLs safely. They handle encoding automatically:

```javascript
// fetch-query-params.js
function buildUrl(baseUrl, params) {
  const url = new URL(baseUrl)

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value)
    }
  }

  return url.toString()
}

// Usage
const url = buildUrl('https://api.example.com/search', {
  query: 'node.js',
  page: 1,
  limit: 20,
  sort: 'date',
})

console.log(url)
// https://api.example.com/search?query=node.js&page=1&limit=20&sort=date

const response = await fetch(url)
```

The `buildUrl` helper creates a `URL` object and uses `searchParams.append()` to add each parameter. This automatically encodes special characters. For example, a query like `"c++ & c#"` becomes `c%2B%2B%20%26%20c%23`, ensuring the URL remains valid and secure. The helper also skips `undefined` and `null` values, which is useful when some parameters are optional.

## Testing with Mocked HTTP Requests

When writing unit tests for code that makes HTTP requests, you don't want to hit real APIs. Mocking lets you control responses, test error scenarios, and run tests quickly without network dependencies.

Node.js's `fetch()` is powered by [undici](https://undici.nodejs.org/), which provides `MockAgent` for intercepting requests. While undici powers the built-in `fetch()`, the mocking utilities aren't exposed as globals. You need to install undici as a dependency to access them:

```bash
npm install undici --save-dev
```

:::important
Even though `fetch()` is built into Node.js, the `MockAgent` and other testing utilities come from the undici package, which you must install separately.
:::

Combined with the built-in test runner, you can write effective unit tests without external mocking libraries.

### Basic Mocking with MockAgent

Let's say you have a function that fetches user data:

```javascript
// user-service.js
export async function getUser(id) {
  const response = await fetch(`https://api.example.com/users/${id}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.status}`)
  }

  return response.json()
}
```

Here's how to test it with mocked responses:

```javascript
// user-service.test.js
import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { MockAgent, setGlobalDispatcher } from 'undici'
import { getUser } from './user-service.js'

describe('getUser', () => {
  let mockAgent

  beforeEach(() => {
    mockAgent = new MockAgent()
    setGlobalDispatcher(mockAgent)
  })

  it('returns user data for valid id', async () => {
    const mockUser = { id: 1, name: 'Alice', email: 'alice@example.com' }

    mockAgent
      .get('https://api.example.com')
      .intercept({ path: '/users/1', method: 'GET' })
      .reply(200, mockUser)

    const user = await getUser(1)

    assert.deepEqual(user, mockUser)
  })

  it('throws an error when user not found', async () => {
    mockAgent
      .get('https://api.example.com')
      .intercept({ path: '/users/999', method: 'GET' })
      .reply(404, { error: 'Not found' })

    await assert.rejects(
      () => getUser(999),
      { message: 'Failed to fetch user: 404' }
    )
  })
})
```

Let's break down what's happening in this test file. We import `describe`, `it`, and `beforeEach` from Node.js's built-in test runner (`node:test`), along with `assert` for assertions. In the `beforeEach` hook, we create a fresh `MockAgent` and register it as the global dispatcher using `setGlobalDispatcher()`. This tells undici (and therefore `fetch()`) to route all requests through our mock.

Each test then uses `mockAgent.get()` to target a specific origin, `.intercept()` to match a path and method, and `.reply()` to define the mocked response. When our `getUser()` function calls `fetch()`, it gets the mocked response instead of making a real network request.

Run the test with:

```bash
node --test user-service.test.js
```

### Mocking POST Requests

You can mock POST requests the same way. This is useful for testing functions that create or update resources:

```javascript
// api-client.test.js
it('creates a new post', async () => {
  const newPost = { title: 'Hello', body: 'World', userId: 1 }
  const createdPost = { id: 42, ...newPost }

  mockAgent
    .get('https://api.example.com')
    .intercept({ path: '/posts', method: 'POST' })
    .reply(201, createdPost)

  const response = await fetch('https://api.example.com/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newPost),
  })

  const data = await response.json()
  assert.equal(data.id, 42)
})
```

## Best Practices

Now that we've covered the mechanics of making HTTP requests, let's consolidate the key practices that will help you write reliable, maintainable code. These guidelines apply whether you're using `fetch()` or any other HTTP library.

1. **Always handle errors**: Network requests can fail. Use try/catch and check response status codes.

2. **Set timeouts**: Don't let requests hang indefinitely. Use AbortController or library timeout options.

3. **Validate responses**: Don't assume the response structure. Validate before accessing properties.

4. **Use environment variables for URLs and tokens**: Never hardcode API keys or sensitive URLs.

5. **Consider rate limiting**: Respect API rate limits. Implement backoff strategies for retries.

6. **Log requests in development**: Add logging to debug issues, but be careful not to log sensitive data.

Here's an example wrapper function that demonstrates these practices:

```javascript
// Example: Wrapper with best practices
async function apiRequest(endpoint, options = {}) {
  // [Practice #4] Load sensitive values from environment variables
  const baseUrl = process.env.API_BASE_URL
  const token = process.env.API_TOKEN

  // [Practice #1] Wrap in try/catch to handle errors
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      signal: AbortSignal.timeout(10000), // [Practice #2] Set 10s timeout
      headers: {
        'Authorization': `Bearer ${token}`, // [Practice #4] Use env var for token
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    // [Practice #1] Check response status and handle errors
    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`API error ${response.status}: ${errorBody}`)
    }

    // [Practice #3] Parse response (caller should validate structure)
    return await response.json()
  } catch (error) {
    // [Practice #2] Handle timeout specifically
    if (error.name === 'TimeoutError') {
      throw new Error(`Request to ${endpoint} timed out`)
    }

    throw error
  }
}
```

## When to Use External Libraries

While Node.js built-ins handle most use cases, external libraries like [axios](https://axios-http.com/), [got](https://github.com/sindresorhus/got), or [ky](https://github.com/sindresorhus/ky) offer additional features:

- **Automatic retries** with configurable strategies
- **Request/response interceptors** for logging, auth token refresh
- **Progress events** for large uploads/downloads
- **Built-in timeout handling** without AbortController boilerplate
- **Proxy support** out of the box
- **Request cancellation** with simpler APIs

For simple applications, stick with built-in `fetch()`. Consider external libraries when you need their specific features or want to reduce boilerplate in complex applications.

## Using the `http` and `https` Modules

The examples above all use `fetch()`, which is the recommended approach for modern Node.js. However, you may encounter or need to use the lower-level `http`/`https` modules in these scenarios:

- **Working with Node.js versions before 18** where `fetch()` isn't available
- **Integrating with libraries** that expect `http.IncomingMessage` or `http.ClientRequest` objects
- **Migrating legacy codebases** gradually to modern patterns
- **Advanced use cases** requiring direct access to the underlying socket or connection

The `node:http` and `node:https` modules have been part of Node.js since its early days, and you'll still encounter them in many codebases. These are lower-level APIs that give you direct access to the request and response streams.

What's the difference between the two? The `http` module is for plain HTTP connections (typically port 80), while `https` is for encrypted TLS/SSL connections (typically port 443). For most real-world APIs, you'll use `https` since modern services require encrypted connections.

### Basic GET Request with `https`

```javascript
// http-get.js
import https from 'node:https'

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return resolve(httpsGet(response.headers.location))
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP error! status: ${response.statusCode}`))
        response.resume() // Consume response to free up memory
        return
      }

      const chunks = []

      response.on('data', (chunk) => chunks.push(chunk))

      response.on('end', () => {
        const body = Buffer.concat(chunks).toString()
        resolve(JSON.parse(body))
      })

      response.on('error', reject)
    }).on('error', reject)
  })
}

// Usage
const data = await httpsGet('https://jsonplaceholder.typicode.com/posts/1')
console.log('Post title:', data.title)
```

This approach requires more code than `fetch()`, but it gives you access to the raw stream and complete control over how data is processed.

### POST Request with `http.request()`

For POST requests and more control, use `http.request()`:

```javascript
// http-post.js
import https from 'node:https'

function httpsPost(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const postData = JSON.stringify(data)

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    }

    const req = https.request(options, (response) => {
      const chunks = []

      response.on('data', (chunk) => chunks.push(chunk))

      response.on('end', () => {
        const body = Buffer.concat(chunks).toString()

        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(JSON.parse(body))
        } else {
          reject(new Error(`HTTP ${response.statusCode}: ${body}`))
        }
      })
    })

    req.on('error', reject)

    // Set timeout
    req.setTimeout(10000, () => {
      req.destroy(new Error('Request timed out'))
    })

    // Write data and end request
    req.write(postData)
    req.end()
  })
}

// Usage
const newPost = await httpsPost('https://jsonplaceholder.typicode.com/posts', {
  title: 'My Post',
  body: 'Content here',
  userId: 1,
})
console.log('Created:', newPost)
```

### Streaming with `http`/`https`

The `http`/`https` modules provide direct access to Node.js streams. While `fetch()` also supports streaming (as shown earlier), you may encounter this pattern in older codebases:

```javascript
// http-stream.js
import https from 'node:https'
import { createWriteStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'

async function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    https.get(url, async (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`))
        response.resume()
        return
      }

      const fileStream = createWriteStream(destPath)

      try {
        await pipeline(response, fileStream)
        console.log(`Downloaded to ${destPath}`)
        resolve()
      } catch (error) {
        reject(error)
      }
    }).on('error', reject)
  })
}

// Usage
await downloadFile(
  'https://nodejs.org/dist/v22.0.0/node-v22.0.0.tar.gz',
  './node-source.tar.gz'
)
```

For more on streaming and file operations, check out our guide on [Reading and Writing Files in Node.js](/blog/reading-writing-files-nodejs/).

## Summary

Modern Node.js provides excellent built-in options for making HTTP requests:

| Method | Best For | Node.js Version |
|--------|----------|-----------------|
| `fetch()` | Most use cases: GET, POST, streaming, file downloads | 18+ (recommended) |
| `http.request()` | Unencrypted HTTP connections, legacy codebases | All versions |
| `https.request()` | Encrypted HTTPS connections, legacy codebases | All versions |

For most developers, **`fetch()` is the recommended choice**. It's familiar from browser JavaScript, promise-based, supports streaming, and requires no external dependencies.

The `http.request()` and `https.request()` functions are lower-level alternatives available in all Node.js versions. The key difference between them is that you must explicitly choose the protocol: `http.request()` for unencrypted connections and `https.request()` for encrypted ones. If you need a unified abstraction that handles both protocols, you'll need to build it yourself or use `fetch()`, which handles this automatically based on the URL.

:::tip[Ready to Master Node.js?]
HTTP requests are just the beginning. **Node.js Design Patterns** covers async patterns, streams, scalable architectures, and more - everything you need to build production-grade Node.js applications.

[Get a FREE chapter →](/#free-chapter)
:::

## Frequently Asked Questions

### What is the easiest way to make an HTTP request in Node.js?

The easiest way is using the built-in `fetch()` API, available since Node.js 18. Simply call `fetch(url)` and await the response. No external packages are required.

### Does Node.js have a built-in fetch function?

Yes, since Node.js 18, `fetch()` is available as a built-in global function. You don't need to install any packages like node-fetch or axios to make HTTP requests.

### How do I make a POST request with JSON in Node.js?

Use `fetch()` with `method` set to `'POST'`, set the `Content-Type` header to `'application/json'`, and pass your data through `JSON.stringify()` in the `body` option.

### When should I use http/https modules instead of fetch?

For most use cases, you should use `fetch()`. The `http`/`https` modules are primarily useful when:

1. You're working with Node.js versions before 18
2. You're maintaining legacy codebases
3. You're integrating with libraries that expect `http.IncomingMessage` or `http.ClientRequest` objects

Modern `fetch()` supports streaming too, so that's no longer a reason to prefer the older modules.

### Do I need axios or got to make HTTP requests in Node.js?

No, modern Node.js (18+) includes a built-in `fetch()` API that handles most use cases. External libraries like axios or got are optional and mainly useful for advanced features like automatic retries, request interceptors, or progress events.
