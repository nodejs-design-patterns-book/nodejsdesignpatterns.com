---
date: 2025-10-12T23:40:00
updatedAt: 2026-01-29T12:00:00
title: Reading and Writing Files in Node.js - The Complete Modern Guide
slug: reading-writing-files-nodejs
description: Learn the modern way to read and write files in Node.js using promises, streams, and file handles. Master memory-efficient file operations for production applications.
authors: ['luciano-mammino']
tags: ['blog']
---

File operations are at the heart of most Node.js applications. Whether you're building a web server that serves static assets, processing CSV files, handling user uploads, or working with configuration files, knowing how to efficiently read and write files is absolutely essential.

There are several ways to handle file operations in Node.js (callback-based APIs, synchronous methods, and promise-based approaches). While callback and sync methods are still valid and occasionally useful, they're being used less and less these days. The Node.js ecosystem has shifted toward more ergonomic patterns, moving away from callback hell and blocking operations in favor of cleaner `async/await` syntax and non-blocking promise-based APIs.

In this comprehensive guide, we'll focus on the modern approaches to file handling in Node.js. We'll start with the simplest methods using promises, then dive into more advanced techniques like using file handles and streaming: a clever approach that can handle massive files without breaking your application.

Let's dive in and master file operations in Node.js!

:::note[Code examples]
All the code examples in this article can be found on [GitHub](https://github.com/lmammino/reading-and-writing-files-with-nodejs-examples).
:::

## Reading and Writing Files with Node.js Promises (fs/promises)

The most straightforward way to work with files in modern Node.js is using the `node:fs/promises` module with functions like `readFile()` and `writeFile()`. This gives us a clean, promise-based API that works beautifully with `async/await`.

Both `readFile()` and `writeFile()` return promises, and when we use `await`, we give control back to the event loop while the asynchronous file operation completes. When the operation finishes successfully, the event loop gives back control to our code and the execution moves to the next line of code. If the operation fails, the promise rejects and throws an error (which we can handle with a `try/catch` block). This non-blocking behavior is what makes Node.js so efficient at handling I/O operations in highly concurrent environments.

But enough theory, let's see this in action!

### Reading Files with fs/promises

Here's how you can read a file using the modern promise-based approach:

```javascript {5}
// read-promises.js
import { readFile } from 'node:fs/promises'

try {
  const data = await readFile('config.json', 'utf8')
  const config = JSON.parse(data)
  console.log('Configuration loaded:', config)
} catch (error) {
  console.error('Failed to read config file:', error.message)
}
```

The `readFile()` function loads the entire file content into memory and returns it as a string (when you specify an encoding like 'utf8') or as a Buffer (when no encoding is specified).

:::tip[Handling errors when reading files]
Notice how we wrapped our file operation in a `try/catch` block? File operations can fail for many reasons:

- **ENOENT**: File or directory doesn't exist
- **EACCES**: Permission denied (can't read the file)
- **EISDIR**: Tried to read a directory as a file
- **EMFILE**: Too many open files
- **JSON parsing errors**: If you're reading JSON, `JSON.parse()` can throw (e.g. if the file content isn't valid JSON)

Always handle these errors gracefully to prevent your application from crashing. The error object includes a `code` property that helps you identify the specific issue and respond appropriately.
:::

### Writing Files with fs/promises

Now that we've mastered reading files, what about creating them? Writing files is just as straightforward. This example takes a JavaScript object, converts it to JSON, and saves it to a file:

```javascript {9}
// write-promises.js
import { writeFile } from 'node:fs/promises'

try {
  const jsonData = JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
  })
  await writeFile('user-data.json', jsonData, 'utf8')
  console.log('User data saved successfully!')
} catch (error) {
  console.error('Failed to save user data:', error.message)
  throw error
}
```

This example demonstrates the fundamental `writeFile()` operation: we're taking all our data (in this case, a JSON string) and flushing it to a file in a single atomic operation. The `writeFile()` function creates the file if it doesn't exist, or completely overwrites it if it does. The entire string content is written to disk at once, making this approach perfect for situations where you have all your data ready and want to persist it quickly.

:::tip[Handling errors when writing files]
Notice we're using `try/catch` here as well, because file write operations can fail for various reasons:

- **EACCES**: Permission denied (can't write to the directory)
- **ENOSPC**: No space left on device (disk full)
- **EROFS**: Read-only file system
- **EISDIR**: Trying to write to a directory instead of a file
- **ENOTDIR**: Part of the path is not a directory
  :::

### Reading and Writing Binary Files

So far, we've been working with text files, but what happens when you need to handle images, videos, or audio files? Not all files are text-based, and Node.js handles binary data just as elegantly. Here's a more advanced example showing how to work with binary data by creating and reading WAV audio files:

#### Writing Binary Data - Generate a WAV file

```javascript {75}
// write-wav-beep.js
import { writeFile } from 'node:fs/promises'

// Encode a PCM16 WAV buffer from interleaved Int16 samples
function encodeWavPcm16(samples, sampleRate = 44100, numChannels = 1) {
  const bytesPerSample = 2
  const blockAlign = numChannels * bytesPerSample
  const byteRate = sampleRate * blockAlign
  const dataSize = samples.length * bytesPerSample

  const buf = Buffer.alloc(44 + dataSize)
  let o = 0

  // RIFF header
  buf.write('RIFF', o)
  o += 4
  buf.writeUInt32LE(36 + dataSize, o)
  o += 4 // file size minus 8
  buf.write('WAVE', o)
  o += 4

  // "fmt " chunk (PCM)
  buf.write('fmt ', o)
  o += 4
  buf.writeUInt32LE(16, o)
  o += 4 // chunk size for PCM
  buf.writeUInt16LE(1, o)
  o += 2 // audioFormat = 1 (PCM)
  buf.writeUInt16LE(numChannels, o)
  o += 2
  buf.writeUInt32LE(sampleRate, o)
  o += 4
  buf.writeUInt32LE(byteRate, o)
  o += 4
  buf.writeUInt16LE(blockAlign, o)
  o += 2
  buf.writeUInt16LE(16, o)
  o += 2 // bitsPerSample

  // "data" chunk
  buf.write('data', o)
  o += 4
  buf.writeUInt32LE(dataSize, o)
  o += 4

  for (let i = 0; i < samples.length; i++, o += 2) {
    buf.writeInt16LE(samples[i], o)
  }
  return buf
}

// Make a mono sine wave (Int16 samples)
function makeSine(
  durationSec,
  freq = 1000,
  sampleRate = 44100,
  numChannels = 1,
  amp = 0.3,
) {
  const frames = Math.floor(durationSec * sampleRate)
  const samples = new Int16Array(frames * numChannels)
  for (let i = 0; i < frames; i++) {
    const x = Math.sin(2 * Math.PI * freq * (i / sampleRate)) * amp
    const s = Math.max(-1, Math.min(1, x))
    const v = Math.round(s * 32767)
    for (let c = 0; c < numChannels; c++) samples[i * numChannels + c] = v
  }
  return { samples, sampleRate, numChannels }
}

async function createBeepWav() {
  try {
    const { samples, sampleRate, numChannels } = makeSine(1.0, 1000, 44100, 1)
    const wavBuf = encodeWavPcm16(samples, sampleRate, numChannels)
    await writeFile('beep.wav', wavBuf)
    console.log('Wrote beep.wav')
  } catch (error) {
    console.error('Failed to create WAV file:', error.message)
    throw error
  }
}

// Usage
await createBeepWav()
```

This example demonstrates several key concepts for binary file manipulation in Node.js. The `encodeWavPcm16()` function creates a complete WAV file structure by constructing both the header and audio data sections. The WAV header contains metadata like file size, audio format, sample rate, and number of channels, while the data section contains the actual audio samples.

The `makeSine()` function creates audio samples using a sine wave mathematical formula, generating a pure tone at the specified frequency. Each sample represents the amplitude of the sound wave at a specific point in time, and when played back at the correct sample rate, these digital values recreate the original analog sound.

Don't worry too much about the specifics of this example dealing with the WAV binary format! What matters here is learning that we can put arbitrary binary data into a buffer and write it into a file using `writeFile()`. The key takeaway is that Node.js treats all file operations the same way, whether you're writing text, JSON, images, audio, or any other type of data.

When working with binary data like this, we use the Node.js [Buffer](https://nodejs.org/api/buffer.html) object to organize and manipulate the binary data. A Buffer is a fixed-size sequence of bytes that provides a way to work with binary data directly. It's similar to an array of integers, but specifically designed for handling raw binary data efficiently. In our WAV example, we use `Buffer.alloc()` to create a buffer of the required size, then use methods like `writeUInt32LE()` and `writeInt16LE()` to write specific data types at specific positions in little-endian format.

:::note[WAV Binary File Structure]
If you are curious to find out more about the binary structure of a WAV file, you can check out this excellent page on [Wikipedia](https://en.wikipedia.org/wiki/WAV).
:::

#### Reading Binary Data - Parse WAV file header

In this example, we're going to read a WAV file to determine its duration in milliseconds. This requires reading the file content as binary data and then performing binary data processing based on our knowledge of the WAV file structure. We'll parse the WAV header to extract information like sample rate and data size, then calculate the duration using the formula: `(dataSize / byteRate) * 1000`.

```javascript {51}
// read-wav-duration.js
import { readFile } from 'node:fs/promises'

function decodeWavHeader(buffer) {
  if (
    buffer.toString('ascii', 0, 4) !== 'RIFF' ||
    buffer.toString('ascii', 8, 12) !== 'WAVE'
  ) {
    throw new Error('Not a RIFF/WAVE file')
  }

  let offset = 12 // after RIFF size + WAVE
  let fmt = null
  let dataOffset = null
  let dataSize = null

  while (offset + 8 <= buffer.length) {
    const id = buffer.toString('ascii', offset, offset + 4)
    const size = buffer.readUInt32LE(offset + 4)
    const payload = offset + 8

    if (id === 'fmt ') {
      fmt = {
        audioFormat: buffer.readUInt16LE(payload + 0),
        numChannels: buffer.readUInt16LE(payload + 2),
        sampleRate: buffer.readUInt32LE(payload + 4),
        byteRate: buffer.readUInt32LE(payload + 8),
        blockAlign: buffer.readUInt16LE(payload + 12),
        bitsPerSample: buffer.readUInt16LE(payload + 14),
      }
    } else if (id === 'data') {
      dataOffset = payload
      dataSize = size
      break // found PCM payload
    }

    // Chunks are padded to even byte boundaries
    offset = payload + size + (size % 2)
  }

  if (!fmt || dataOffset == null) throw new Error('Missing fmt or data chunk')
  return { ...fmt, dataOffset, dataSize }
}

async function getWavDuration(filePath) {
  if (!filePath) {
    throw new Error('File path is required')
  }

  try {
    const buf = await readFile(filePath)
    const hdr = decodeWavHeader(buf)

    // duration (ms) = (dataSize / byteRate) * 1000
    const durationMs = Math.round((hdr.dataSize / hdr.byteRate) * 1000)
    console.log(`Duration: ${durationMs}ms`)
    return durationMs
  } catch (error) {
    console.error('Failed to read WAV file:', error.message)
    throw error
  }
}

// Usage (file path must be provided)
const filePath = process.argv[2]
if (!filePath) {
  console.error('Usage: node read-wav-duration.js <wav-file-path>')
  process.exit(1)
}
await getWavDuration(filePath)
```

This example showcases the reverse process - reading and parsing binary data from an existing WAV file. The `decodeWavHeader()` function demonstrates how to extract specific information from binary data by reading bytes at predetermined positions within the file structure.

The function uses Buffer methods like `readUInt32LE()` and `readUInt16LE()` to interpret raw bytes as specific data types. For example, bytes 22-23 contain the number of channels, bytes 24-27 contain the sample rate, and bytes 40-43 contain the size of the audio data. By knowing the WAV file format specification, we can locate and extract these values.

The duration calculation combines several pieces of metadata: we divide the total audio data size by the byte rate (bytes per second) to get the duration in seconds, then multiply by 1000 to convert to milliseconds. This demonstrates how understanding both the file format and basic math allows us to derive meaningful information from binary data.

:::note[Binary file complexity]
This is a very simple example showing basic binary manipulation using only Node.js built-ins. We can handle the WAV format manually here because we're creating a minimal, single-channel PCM file with known parameters.

For real-world audio applications, you'd typically want to use a comprehensive library like [Howler.js](https://howlerjs.com/) that handles the complexity of multiple audio formats and advanced audio features. The same principle applies to other binary formats - use specialized libraries when available, but understanding the underlying binary operations helps you debug issues and work with custom formats.
:::

### Concurrent File Operations with Promises

Reading and writing single files is useful, but what if you need to process multiple files? Should you handle them one by one, or is there a faster way? One of the great advantages of promise-based file operations is the ability to read and write multiple files concurrently. Here's how you can do it:

#### Reading Multiple Files Concurrently

```javascript {15, 19-20}
// read-multiple-files.js
import { readFile } from 'node:fs/promises'

const configFiles = [
  'config/database.json',
  'config/api.json',
  'config/logging.json',
  'config/feature-flags.json',
]

try {
  // Read all files concurrently and parse JSON
  // Note that we are not using await here, so the reads happen concurrently
  const promises = configFiles.map((file) =>
    readFile(file, 'utf8').then(JSON.parse),
  )

  // Here we are using await, so we wait for all reads to complete before proceeding
  const [databaseConfig, apiConfig, loggingConfig, featureFlagsConfig] =
    await Promise.all(promises)

  console.log('Successfully loaded config files', {
    databaseConfig,
    apiConfig,
    loggingConfig,
    featureFlagsConfig,
  })
} catch (error) {
  console.error('Failed to read config files:', error.message)
}
```

This example demonstrates the power of promise chaining combined with concurrent operations. We start by mapping over an array of file names to create an array of promises. Each promise represents the complete operation of reading a file and parsing its JSON content.

The key insight here is how we use `.then(JSON.parse)` — which is a shorthand for `.then(content => JSON.parse(content))` — to chain operations. First, `readFile(filename, 'utf8')` returns a promise that resolves to the raw file content as a string. Then, we chain `.then(JSON.parse)` to that promise, which creates a new promise that will resolve to the file content parsed from JSON into a JavaScript value (likely an object). In other words, this chaining transforms our original "read file" promise into a "read and parse JSON file" promise.

:::important[Concurrent vs Sequential Operations]
This concurrent approach provides a significant performance improvement. If we used multiple `await` statements (one for each file read), we would be processing the files sequentially. If each file read takes 10ms, we wouldn't be completing the operation in less than 40ms. With concurrent reads - by starting all promises first and then awaiting all of them with `Promise.all()` - we'll most likely be able to read all four files in around 10ms (roughly the time of the slowest individual read).
:::

#### Writing Multiple Files Concurrently

```javascript {26-29}
// write-multiple-files.js
import { mkdir, writeFile } from 'node:fs/promises'

async function generateReports(data) {
  const reports = [
    {
      filename: 'reports/daily-summary.json',
      content: JSON.stringify(data.daily, null, 2),
    },
    {
      filename: 'reports/weekly-summary.json',
      content: JSON.stringify(data.weekly, null, 2),
    },
    {
      filename: 'reports/monthly-summary.json',
      content: JSON.stringify(data.monthly, null, 2),
    },
    {
      filename: 'reports/yearly-summary.json',
      content: JSON.stringify(data.yearly, null, 2),
    },
  ]

  try {
    // Write all files concurrently
    const promises = reports.map(({ filename, content }) =>
      writeFile(filename, content, 'utf8'),
    )
    await Promise.all(promises)

    console.log(`Successfully generated ${reports.length} report files`)
  } catch (error) {
    console.error('Failed to write report files:', error.message)
    throw error
  }
}

// Usage
const reportData = {
  daily: { sales: 1000, visitors: 250 },
  weekly: { sales: 7000, visitors: 1750 },
  monthly: { sales: 30000, visitors: 7500 },
  yearly: { sales: 365000, visitors: 91250 },
}

await mkdir('reports', { recursive: true }) // Ensure reports directory exists
await generateReports(reportData)
```

This example mirrors the concurrent reading pattern but for writing operations. We create an array of report objects, each containing a filename and content, then use `.map()` to transform this into an array of `writeFile()` promises. The key pattern here is the same: we start all write operations simultaneously (when we create the promises array) and then use `Promise.all()` to wait for all of them to complete.

:::tip[JavaScript Promises are Eager]
It's important to remember that JavaScript promises are eager: once they are created, the underlying computation starts immediately. In this case, this means that once we call `writeFile()`, it will create a promise and start to write into the file immediately. We don't need to `await` the promise for the file operation to begin; the `await` only determines when our code waits for the operation to complete.
:::

This approach is particularly useful for generating multiple related files, such as reports, logs, or configuration files. All files are written concurrently, which significantly improves performance compared to writing them one by one. If any write operation fails, the entire batch fails, which is often the desired behavior for related files that should be created as a unit.

:::tip[Promise.all() vs Promise.allSettled() - Choose the Right Tool]
In these examples, we use `Promise.all()` because if any config file fails to load or any report fails to write, we can't continue - all operations are required for the application to function properly.

However, if you can tolerate one or more errors (like loading optional config files or processing a batch of user uploads), it's much better to use `Promise.allSettled()`.

**Key differences:**

- **`Promise.all()`**: Fails fast - rejects immediately when any promise rejects
- **`Promise.allSettled()`**: Waits for all promises to complete, regardless of whether they succeed or fail

Learn more: [Promise.all() on MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all) | [Promise.allSettled() on MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)
:::

### Working with Directories

In the latest example we used the `mkdir()` function to create a directory before writing files into it. This is a common pattern because files don't exist in isolation, they live in directories. What if you need to process all files in a folder, or create directories dynamically? Let's see a more complete example that combines several file system operations:

```javascript {8,11,14,15,17}
// process-directory.js
import { mkdir, readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'

async function processDirectory(dirPath) {
  try {
    // Create directory if it doesn't exist
    await mkdir('processed', { recursive: true })

    // Read directory contents
    const files = await readdir(dirPath)

    for (const file of files) {
      const filePath = join(dirPath, file)
      const stats = await stat(filePath)

      if (stats.isFile()) {
        console.log(`Processing file: ${file} (${stats.size} bytes)`)
        // Process file here...
      }
    }
  } catch (error) {
    console.error('Directory processing failed:', error.message)
    throw error
  }
}

// Usage
await processDirectory('./uploads')
```

This example demonstrates several important Node.js file system operations working together. Let's break down what each function does:

- **`mkdir('processed', { recursive: true })`** creates a new directory called "processed". The `recursive: true` option means it will create any missing parent directories in the path, similar to `mkdir -p` in Unix systems. If the directory already exists, this won't throw an error. By the way, if you used the [`mkdirp`](https://www.npmjs.com/package/mkdirp) package in the past, you can now use this built-in functionality instead.

- **`readdir(dirPath)`** reads the contents of a directory and returns an array of file and directory names. This is the asynchronous equivalent of `ls` or `dir` commands, giving you a list of everything in the specified directory.

- **`stat(filePath)`** retrieves detailed information about a file or directory, including size, creation time, modification time, and whether it's a file or directory. The returned stats object provides methods like `isFile()`, `isDirectory()`, and properties like `size`.

- **`join(dirPath, file)`** from the `path` module safely combines directory and file names into a complete path, handling path separators correctly across different operating systems (Windows uses `\`, Unix-like systems use `/`).

The `for...of` loop processes each item in the directory sequentially. If you wanted to process files concurrently for better performance, you could replace this with `Promise.all()` and `files.map()` as we showed in earlier examples.

#### Referencing Files Relative to Your Script

When working with files in your Node.js applications, you often need to reference files relative to your current script's location. Modern Node.js provides `import.meta.dirname` (similar to the old `__dirname`) to get the directory of the current module:

```javascript {8-9,19-20}
// read-config-relative.js
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

async function loadConfig() {
  try {
    // Read config.json from the same directory as this script
    const configPath = join(import.meta.dirname, 'config.json')
    const configData = await readFile(configPath, 'utf8')
    return JSON.parse(configData)
  } catch (error) {
    console.error('Failed to load config:', error.message)
    throw error
  }
}

async function loadTemplate() {
  // Read template from a subdirectory relative to this script
  const templatePath = join(import.meta.dirname, 'templates', 'email.html')
  return await readFile(templatePath, 'utf8')
}

// Usage
const config = await loadConfig()
const emailTemplate = await loadTemplate()
```

This approach is much more reliable than using relative paths like `'./config.json'` because `import.meta.dirname` always refers to the directory containing your script file, regardless of where the Node.js process was started from. This prevents the common issue where your script works when run from its own directory but fails when run from elsewhere.

### Async vs Sync File Operations: When to Use Which

We've been using async operations throughout this guide, but you might be wondering: "Are there simpler, synchronous alternatives?" The answer is yes, but when should you use them? Before diving into more advanced file handling techniques, let's compare the promise-based approaches we've seen with the synchronous alternatives Node.js provides.

Node.js also offers synchronous versions of file operations like `readFileSync()` and `writeFileSync()`:

```javascript {6,17}
// sync-file-operations.js
import { readFileSync, writeFileSync } from 'node:fs'

// Synchronous file reading
try {
  const data = readFileSync('config.json', 'utf8')
  const config = JSON.parse(data)
  console.log('Configuration loaded:', config)
} catch (error) {
  console.error('Failed to read config file:', error.message)
}

// Synchronous file writing
try {
  const userData = { name: 'John Doe', email: 'john@example.com' }
  const jsonData = JSON.stringify(userData)
  writeFileSync('user-data.json', jsonData, 'utf8')
  console.log('User data saved successfully!')
} catch (error) {
  console.error('Failed to save user data:', error.message)
}
```

Notice that when using `readFileSync()` and `writeFileSync()` we are not using `await`. This is because these functions are synchronous: they block the event loop until the operation is completed, which means no other JavaScript code is executed while the file read/write operation is in progress.

**My recommendation: I generally prefer to avoid synchronous file functions entirely and always go for the async approach for consistency.** This keeps your codebase uniform and prevents accidentally blocking the event loop in unexpected places. This makes even more sense since for a few years Node.js has added support for **top-level await** (being able to use `await` outside an async function), so using asynchronous file operations is just as easy as using synchronous ones.

However, if you care about extreme performance, there are specific cases where you might prefer the sync methods. Sync methods can occasionally be slightly faster because they don't need to give back control to the event loop and, for example in the case of reading a file, the content of the file is immediately available once the filesystem operation completes without having to wait for the event loop to capture the event and give back control to our code. One case that comes to mind is when writing **non-concurrent CLI apps or scripts** that need to read or write a file before continuing with the next operation.

:::note[Always run your benchmarks!]
If you are wondering how much faster sync methods are compared to async ones, the answer is: _it depends!_ The only way to know for sure is to run benchmarks in your specific environment and use case. Factors like filesystem speed, file size, and system load can all impact performance. With that being said, we do expect the difference to be negligible in most cases, which is one more reason to prefer async methods for consistency.
:::

:::warning[Never Use Sync Methods in Concurrent Environments]
**Do not use sync methods in concurrent environments such as web servers.** While you read or write a file synchronously, you will be blocking the event loop, which means that no other user requests will be processed during that time.

This can cause noticeable delays for users - if a file operation takes 100ms, every user trying to access your server during that time will experience a 100ms delay. In a web application, this is unacceptable.

**Safe for sync methods:**

- CLI tools and scripts
- Build processes
- Non-concurrent applications

**Never use sync methods in:**

- Web servers (Express, Fastify, etc.)
- Real-time applications
- Any concurrent environment
  :::

## Working with Large Files

The promise-based approaches we've covered work brilliantly for everyday files - but what happens when you need to process a massive CSV file, or a multi-gigabyte log file? The promise-based approach we've seen so far is perfect for small to medium-sized files. However, there's a significant limitation: **everything gets loaded into memory at once**.

Imagine you're trying to read a 2GB log file using `readFile()`. Your Node.js process will attempt to load all 2GB into memory simultaneously. This can lead to several problems:

1. **Out of memory errors** - Your application might crash
2. **Poor performance** - High memory usage affects other operations

### Understanding Memory Considerations for Large Files

While modern Node.js has significantly increased buffer limits (the theoretical maximum is now around 9 petabytes, compared to the original limits of ~1GB on 32-bit and ~2GB on 64-bit architectures), this doesn't mean we should load massive files into memory all at once. You can check the current buffer limits on your system:

```javascript
// check-buffer-limits.js
import buffer from 'node:buffer'

// Check the maximum buffer size
console.log('Max buffer size:', buffer.constants.MAX_LENGTH)
console.log('Max string length:', buffer.constants.MAX_STRING_LENGTH)

// Convert to more readable format
const maxSizeGB = (buffer.constants.MAX_LENGTH / (1024 * 1024 * 1024)).toFixed(
  2,
)
console.log(`That's approximately ${maxSizeGB} GB`)
```

Even though Node.js can theoretically handle extremely large buffers, attempting to read huge files into memory can cause practical problems:

```javascript
// handle-large-file-memory.js
import { readFile } from 'node:fs/promises'

try {
  // Even if this doesn't hit buffer limits, it might cause memory issues
  console.log('Attempting to read large file...')
  const hugeFile = await readFile('massive-dataset.csv', 'utf8')
  console.log('File loaded successfully!')
} catch (error) {
  if (error.code === 'ERR_FS_FILE_TOO_LARGE') {
    console.log('File exceeds buffer limits!')
  } else if (error.code === 'ENOMEM') {
    console.log('Not enough memory available!')
  } else {
    console.log('Error loading file:', error.message)
  }
}
```

The key insight is that loading massive files into memory all at once is rarely a good idea, even when technically possible. It can lead to memory pressure, slower performance, and poor user experience. Instead, we should process large files incrementally using streams or file handles!

## Advanced Node.js File Operations with File Handles

So how do we handle those massive files without running out of memory? When you need more control over file operations, Node.js provides lower-level APIs using file handles. This approach allows you to read and write files incrementally, giving you fine-grained control over memory usage.

If you have ever read data from a file or written data into a file in a low-level language such as C, this approach will seem familiar.

### Opening and Working with File Handles

```javascript {9,18,40}
// read-file-chunks.js
import { open } from 'node:fs/promises'

async function readFileInChunks(filePath) {
  let fileHandle

  try {
    // Open the file for reading
    fileHandle = await open(filePath, 'r')

    const chunkSize = 1024 // Read 1KB at a time
    const buffer = Buffer.alloc(chunkSize)
    let position = 0
    let totalBytesRead = 0

    while (true) {
      // Read a chunk from the current position
      const result = await fileHandle.read(buffer, 0, chunkSize, position)

      if (result.bytesRead === 0) {
        // End of file reached
        break
      }

      // Process the chunk
      const chunk = buffer.subarray(0, result.bytesRead)
      console.log(`>>> Read ${result.bytesRead} bytes:`, chunk.toString('utf8'))

      position += result.bytesRead
      totalBytesRead += result.bytesRead
    }

    console.log(`>>> Total bytes read: ${totalBytesRead}`)
  } catch (error) {
    console.error('Error reading file:', error.message)
    throw error
  } finally {
    // Always close the file handle
    if (fileHandle) {
      await fileHandle.close()
    }
  }
}

// Usage
await readFileInChunks('large-file.txt')
```

This example demonstrates the core concepts of working with file handles in Node.js. The `open()` function creates a file handle that represents our connection to the file, similar to how you would open a file in C or other low-level languages. We pass `'r'` as the second parameter to indicate we want to open the file for reading.

The `read()` method allows us to read a specific number of bytes from a specific position in the file. In our loop, we read 1KB chunks at a time, processing each chunk before moving to the next. This approach keeps memory usage low and predictable, regardless of the file size.

Most importantly, we need to make sure we clean up resources, which is why we use a `finally` block. This way, the cleanup code (calling `fileHandle.close()`) is executed whether everything goes well or if there's an error. This allows us to retain a clean state and lets Node.js reclaim resources that aren't needed anymore.

:::warning[Always Close File Handles]
Failing to close file handles can lead to resource leaks and eventually cause your application to run out of available file descriptors.
:::

### Writing Files Incrementally

Suppose we need a file with one million unique voucher codes for a later print run. Preloading them all in memory would be wasteful, so we stream the work: generate codes in small batches and append each batch to the file.

```javascript {20,42,56}
// generate-voucher-codes.js
import { open } from 'node:fs/promises'

// This is for demonstration purposes only.
// Ideally, voucher codes should be generated using a secure random generator
function generateVoucherCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

async function generateVoucherFile(filePath, totalVouchers) {
  let fileHandle

  try {
    // Open file for writing (creates if doesn't exist)
    fileHandle = await open(filePath, 'w')

    const chunkSize = 1000 // Generate 1000 vouchers per chunk
    let position = 0
    let vouchersGenerated = 0

    while (vouchersGenerated < totalVouchers) {
      // Generate a chunk of voucher codes
      const vouchersInThisChunk = Math.min(
        chunkSize,
        totalVouchers - vouchersGenerated,
      )
      const vouchers = []

      for (let i = 0; i < vouchersInThisChunk; i++) {
        vouchers.push(generateVoucherCode())
      }

      // Convert to buffer and write to file
      const chunk = vouchers.join('\n') + '\n'
      const buffer = Buffer.from(chunk, 'utf8')

      const result = await fileHandle.write(buffer, 0, buffer.length, position)

      position += result.bytesWritten
      vouchersGenerated += vouchersInThisChunk

      console.log(`Generated ${vouchersGenerated}/${totalVouchers} vouchers`)
    }

    console.log(`Successfully generated ${totalVouchers} voucher codes!`)
  } catch (error) {
    console.error('Error generating voucher file:', error.message)
    throw error
  } finally {
    if (fileHandle) {
      await fileHandle.close()
    }
  }
}

// Usage - Generate 1 million voucher codes
await generateVoucherFile('voucher-codes.txt', 1_000_000)
```

This example shows how to efficiently generate and write large amounts of data without overwhelming memory. The `open()` function creates a file handle with the `'w'` flag, which opens the file for writing (creating it if it doesn't exist, or truncating it if it does).

The `write()` method takes a buffer and writes it to the file at a specific position. In our example, we keep track of the position manually and increment it after each write operation. This ensures that each chunk of voucher codes is written sequentially to the file without overwriting previous data.

The beauty of this approach is that we only keep 1,000 voucher codes in memory at any given time, regardless of whether we're generating 1 million or 10 million codes. This keeps memory usage constant and predictable.

Just like with reading, we use a `finally` block to ensure the file handle is properly closed with `fileHandle.close()`, preventing resource leaks and allowing Node.js to clean up the file descriptor.

### Why File Handles Are Low-Level

While file handles give you precise control, they require you to manage a lot of details manually:

- **Buffer management** - You need to allocate and manage buffers
- **Position tracking** - You must keep track of read/write positions
- **Error handling** - More complex error scenarios to handle
- **Resource cleanup** - You must remember to close file handles

This low-level approach is powerful but verbose. For most use cases, there's a better solution: **Node.js streams**.

## Node.js Streams: Memory-Efficient File Processing

File handles give us control, but they require a lot of manual work. Is there a middle ground that gives us memory efficiency without all the complexity? Absolutely! Streams provide the memory efficiency of low-level file operations with a much more ergonomic API. They're perfect for processing large files without loading everything into memory.

:::tip[Want to Master Node.js Streams (for FREE)?]
We're giving away for free an entire chapter from our book ["Node.js Design Patterns"](/) entirely dedicated to learning Streams!

**Chapter 6: Coding with Streams** - 80 pages packed with practical examples, real-world insights, and powerful design patterns to help you write faster, leaner, and more scalable Node.js code.

In this chapter, you'll learn:

- How streams fit into the Node.js philosophy
- The anatomy of readable, writable, and transform streams
- How to handle backpressure and avoid memory issues
- Real-world streaming patterns for composability and performance
- Tips for error handling, concurrency, and combining streams effectively

[Get your free chapter here →](/#free-chapter)
:::

### Understanding Stream Advantages

Streams offer several key benefits:

1. **Memory efficiency** - Process data piece by piece
2. **Composability** - Chain multiple operations together
3. **Backpressure handling** - Automatically manage fast producers and slow consumers
4. **Event-driven** - React to data as it becomes available

### Reading Files with Streams

Ready to see the magic of streams in action? Let's build a CLI utility that takes a text file of arbitrary size and counts the number of characters and lines in it, all while barely using any memory.

```javascript {5-7,12,20,26}
// process-large-file-stream.js
import { createReadStream } from 'node:fs'

async function processLargeFile(filePath) {
  const readStream = createReadStream(filePath, {
    encoding: 'utf8',
  })

  let lineCount = 0
  let charCount = 0

  readStream.on('data', (chunk) => {
    // Process chunk as it arrives
    charCount += chunk.length
    lineCount += (chunk.match(/\n/g) || []).length

    console.log(`Processed chunk: ${chunk.length} characters`)
  })

  readStream.on('end', () => {
    console.log(`File processing complete!`)
    console.log(`Total characters: ${charCount}`)
    console.log(`Total lines: ${lineCount}`)
  })

  readStream.on('error', (error) => {
    console.error('Stream error:', error.message)
  })
}

// Usage
await processLargeFile('huge-log-file.txt')
```

This example demonstrates the elegance of stream-based file processing. We create a readable stream with `createReadStream()` and set up event handlers to process the data as it flows through.

The key advantage here is that we're processing the file incrementally - each chunk is handled as soon as it's read, without waiting for the entire file to load into memory. This makes it possible to process files of any size using a constant, predictable amount of memory. The stream emits three important events: `data` (when a chunk is available), `end` (when the entire file has been read), and `error` (if something goes wrong).

This pattern is perfect for analyzing log files, processing CSV data, or any scenario where you need to examine file content without loading everything into memory at once.

:::tip[UTF-8 Encoding and Multibyte Character Handling]
By specifying `encoding: 'utf8'`, the stream takes care of processing multibyte UTF-8 characters for us automatically. Here's why this matters: chunking data into arbitrary windows of bytes (64KB by default) might happen to truncate a multibyte character between chunks. For example, a 2-byte character might have the first byte at the end of one chunk and the second byte at the beginning of the following chunk.

This can be problematic because if you print chunks without stitching them together, you might end up with broken characters displayed between chunks. Thankfully, Node.js takes care of doing the stitching for us - it will move the incomplete multibyte character from one chunk to the following chunk, so every chunk is guaranteed to contain a valid UTF-8 string (assuming the source file contains valid UTF-8 text).
:::

### Writing Files with Streams

Now let's flip the script and see streams in action for writing! Remember our voucher code generator that could create millions of codes? Let's revisit that example using streams for a more ergonomic and manageable approach. We'll build the same voucher generator but with cleaner, simpler code that's easier to understand and maintain.

```javascript {17,23,45-48, 56} collapse={8-13}
// generate-voucher-codes-stream.js
import { once } from 'node:events'
import { createWriteStream } from 'node:fs'

// This is for demonstration purposes only.
// Ideally, voucher codes should be generated using a secure random generator
function generateVoucherCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

async function generateVoucherFile(filePath, totalVouchers) {
  const writeStream = createWriteStream(filePath)

  const chunkSize = 1000 // Generate 1000 vouchers per chunk
  let vouchersGenerated = 0
  let hasError = false

  writeStream.on('error', (err) => {
    console.error('Error writing to file:', err)
    hasError = true
  })

  while (vouchersGenerated < totalVouchers && !hasError) {
    // Generate a chunk of voucher codes
    const vouchersInThisChunk = Math.min(
      chunkSize,
      totalVouchers - vouchersGenerated,
    )
    const vouchers = []

    for (let i = 0; i < vouchersInThisChunk; i++) {
      vouchers.push(generateVoucherCode())
    }

    // Convert to buffer and write to file
    const chunk = `${vouchers.join('\n')}\n`
    const buffer = Buffer.from(chunk, 'utf8')

    // Write and handle backpressure
    const canContinue = writeStream.write(buffer)
    if (!canContinue) {
      await once(writeStream, 'drain')
    }

    vouchersGenerated += vouchersInThisChunk

    console.log(`Generated ${vouchersGenerated}/${totalVouchers} vouchers`)
  }

  console.log(`Successfully generated ${totalVouchers} voucher codes!`)
  writeStream.end()
}

// Usage - Generate 1 million voucher codes
await generateVoucherFile('voucher-codes.txt', 1_000_000)
```

This stream-based approach transforms our file generation process into a more ergonomic operation. The `createWriteStream()` function creates a writable stream that we can feed data to incrementally. Unlike our earlier file handle approach, we don't need to manually track file positions - the stream automatically advances its internal cursor for us after each write.

Notice how we handle errors differently here - instead of using try/catch blocks, we set up an error event handler that sets the `hasError` flag. This event-driven approach lets the stream manage error propagation naturally.

The `canContinue` variable captures an important concept: **backpressure handling**. When `writeStream.write()` returns `false`, it means the internal buffer is full and we should pause until the 'drain' event fires. This prevents memory buildup when we're generating data faster than it can be written to disk.

Compare this to our file handle version: we've eliminated manual position tracking, simplified the control flow, and gained automatic buffering. While this example could still be greatly simplified using higher-level stream utilities, it's already much simpler than using file handles directly. The stream manages the underlying file operations, letting us focus on generating data.

### Stream Composition and Processing

Now let's see the true power of streams by creating a much more elegant version of our voucher generator. One of the most powerful features of streams is their composability - you can combine different streams to create sophisticated data processing pipelines:

```javascript {17-27,30,31,34} collapse={9-14}
// stream-composition.js
import { createWriteStream } from 'node:fs'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

// This is for demonstration purposes only.
// Ideally, voucher codes should be generated using a secure random generator
function generateVoucherCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

class VoucherGeneratorStream extends Readable {
  constructor(options) {
    super({ ...options, objectMode: true })
  }

  _read(_size) {
    const chunk = `${generateVoucherCode()}\n`
    this.push(chunk)
  }
}

const totalVouchers = 1_000_000
const sourceStream = new VoucherGeneratorStream().take(totalVouchers) // Generate 1 million vouchers
const destinationStream = createWriteStream('voucher-codes.txt')

try {
  await pipeline(sourceStream, destinationStream)
  console.log(`Successfully generated ${totalVouchers} voucher codes!`)
} catch (err) {
  console.error('Pipeline failed:', err)
}
```

This example is functionally equivalent to our previous voucher generator but offers a much more concise and readable implementation. Let's break down what makes this approach so powerful:

**Custom Readable Stream**: We create a `VoucherGeneratorStream` class that extends Node.js's `Readable` stream. The `_read()` method is called whenever the stream needs more data - it generates one voucher code per call and pushes it to the stream. Notice we use `objectMode: true` in the constructor, which tells the stream to treat each voucher string as an individual chunk rather than trying to buffer multiple strings together.

**Endless Stream with Limits**: Our `VoucherGeneratorStream` is essentially endless - it would keep generating voucher codes forever. That's where the `.take(totalVouchers)` utility function comes in. This stream method limits our endless stream to exactly 1 million vouchers, automatically ending the stream once that limit is reached.

**Automatic Pipeline Management**: The `pipeline()` function is where the magic happens. It connects our voucher generator stream to the file write stream, automatically handling data flow, backpressure, and error propagation. When the generator produces data faster than the file can be written, `pipeline()` automatically pauses the generator until the file stream catches up. No manual `canContinue` checks or `drain` event handling needed!

The beauty of this approach is its declarative nature - we describe _what_ we want (generate vouchers and write them to a file) rather than _how_ to manage the low-level details. The stream infrastructure handles buffering, backpressure, and coordination for us.

:::tip[Learn More About Streams]
There are many stream details we've glossed over here - transform streams, duplex streams, and advanced composition patterns. For a deep dive into Node.js streams, check out the [FREE streams chapter from our Node.js Design Patterns book](/#free-chapter).

If you need to consume an entire stream into memory (for small files), check out our article on [Node.js stream consumer utilities](/blog/node-js-stream-consumer/).
:::

:::tip[Using pipeline() with Generators]
It's worth noting that the `pipeline()` function also supports **iterables** and **async iterables** (including **generator functions**), which can allow us to make the code even more concise.

<details>
  <summary>Alternative implementation using an async Generator Function (click to expand)</summary>

```javascript {5,14,22}
// stream-composition-gen.js
import { createWriteStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'

function* voucherCodesGen() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  while (true) {
    // This is for demonstration purposes only.
    // Ideally, voucher codes should be generated using a secure random generator
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    yield `${result}\n`
  }
}

const totalVouchers = 1_000_000 // Generate 1 million vouchers
const destinationStream = createWriteStream('voucher-codes.txt')

try {
  await pipeline(voucherCodesGen().take(totalVouchers), destinationStream)
  console.log(`Successfully generated ${totalVouchers} voucher codes!`)
} catch (err) {
  console.error('Pipeline failed:', err)
}
```

</details>

If you want to learn more about JavaScript iteration protocols, including iterables, async iterables, and generator functions, check out our article dedicated to [JavaScript Async Iterators](/blog/javascript-async-iterators) where we cover these concepts in detail.

:::

### When to Use Streams

So, to summarize, when should you reach for streams?

Streams are the best choice when:

- **Processing large files** (anything over 100MB)
- **Real-time data processing** (logs, live data feeds)
- **Memory is limited** (cloud functions, containers)
- **You need composability** (multiple processing steps)
- **Handling unknown file sizes** (user uploads, network data)

## Node.js File Operations: Best Practices Summary

We've covered a comprehensive range of file operation techniques in Node.js, from simple promise-based methods to advanced streaming patterns. Here are the key principles and some extra tips to guide your decisions when choosing the right approach for your specific use case:

1. **Choose the right approach for your use case**:
   - **Small files (< 100MB)**: Use `fs/promises` with `readFile()` and `writeFile()`
   - **Large files or unknown sizes**: Use streams with `createReadStream()` and `createWriteStream()`
   - **Need precise control**: Use file handles with `open()` and manual read/write operations
   - **CLI tools and scripts**: Sync methods (`readFileSync()`, `writeFileSync()`) are acceptable
   - **Web servers and concurrent apps**: Never use sync methods - always use async approaches

2. **Leverage concurrency for better performance**:
   - Use `Promise.all()` when all operations must succeed
   - Use `Promise.allSettled()` when you can tolerate partial failures
   - Read/write multiple files concurrently when possible

3. **Handle specific errors**:

   It's good practice to handle specific error codes to provide meaningful feedback to the user or take specific corrective action:

   ```javascript
   // error-handling-example.js
   try {
     // File operation
   } catch (error) {
     if (error.code === 'ENOENT') {
       console.log('File not found')
     } else if (error.code === 'EACCES') {
       console.log('Permission denied')
     } else if (error.code === 'ENOSPC') {
       console.log('No space left on device')
     } else {
       console.log('Unexpected error:', error.message)
     }
   }
   ```

4. **Use appropriate buffer sizes for streams**:

   Stream objects will load data in chunks into an internal buffer. The default chunk size is 64KB (or 16 objects if using object mode), which is a good balance for most use cases. However, you can adjust the `highWaterMark` option when creating streams to optimize performance based on your specific needs. When processing large amounts of data, if you can tolerate allocating more memory, increasing the chunk size can reduce the number of I/O operations and improve throughput.

   ```javascript
   // stream-buffer-size.js
   // For large files, use bigger chunks
   const stream = createReadStream(path, {
     highWaterMark: 128 * 1024, // 128KB chunks
   })
   ```

5. **Always clean up resources**:

   When using file handles or streams, ensure you properly close them to avoid resource leaks. Use `finally` blocks or event handlers to guarantee cleanup even in the face of errors.

   ```javascript
   // resource-cleanup.js
   // File handles
   try {
     const handle = await open(path, 'r')
     // Use handle...
   } finally {
     await handle?.close()
   }

   // Streams (or use pipeline())
   stream.on('error', () => stream.destroy())
   ```

   When using `pipeline()`, it automatically handles cleanup for you, so prefer it when possible.

   ```javascript
   // pipeline-example.js
   // Better error handling and cleanup
   await pipeline(source, transform, destination)
   ```

6. **Use modern JavaScript patterns**:
   - Array destructuring for concurrent operations
   - Promise chaining for data transformation
   - Proper error handling with `try/catch` blocks

## Summary and Conclusion

The key to mastering file operations in Node.js is understanding these trade-offs and choosing the right approach for your specific use case. Start with the simple promise-based methods for most scenarios, leverage concurrency when processing multiple files, and move to streams when you need better performance and memory efficiency for large files.

Remember that file operations are often I/O bound, so proper error handling and resource management are crucial for building robust applications. Whether you're building web servers, processing user uploads, analyzing log files, or creating CLI tools, these patterns will serve you well in your Node.js journey.

## Frequently Asked Questions

Still have questions about Node.js file operations? You're not alone! Here are the most common questions developers ask when mastering file handling in Node.js:

### What's the difference between sync and async file operations in Node.js?

Synchronous file operations like `readFileSync()` block the event loop until the operation completes, meaning no other JavaScript code can execute during that time. Asynchronous operations like `readFile()` don't block the event loop, allowing other code to run while the file operation happens in the background. Always use async operations in web servers and concurrent applications to avoid blocking other requests.

### How do I handle large files efficiently in Node.js?

For large files (over 100MB), avoid `readFile()` and `writeFile()` as they load everything into memory. Instead, use streams (`createReadStream()`, `createWriteStream()`) or file handles with manual chunking. Streams are generally the best choice as they provide automatic backpressure handling and composability.

### When should I use streams vs promises for file operations?

Use promises (`fs/promises`) for small to medium files where you need the entire content at once (JSON configs, small text files). Use streams for large files, real-time processing, or when you need memory efficiency. Streams are also better when you need to transform data or chain multiple operations together.

### What error codes should I handle in Node.js file operations?

Common error codes include: `ENOENT` (file doesn't exist), `EACCES` (permission denied), `EISDIR` (tried to read directory as file), `ENOSPC` (disk full), `EMFILE` (too many open files). You should handle these specifically rather than just catching generic errors.

### Can I use top-level await with Node.js file operations?

Yes! Modern Node.js supports top-level await in ES modules, so you can use `await readFile()` directly without wrapping it in an async function. This makes async file operations as convenient as sync ones, which is another reason to prefer the async approach.

### How do I process multiple files concurrently in Node.js?

Use `Promise.all()` or `Promise.allSettled()` with an array of promises to process multiple files simultaneously. For example: `await Promise.all(filenames.map(name => readFile(name)))`. This is much faster than processing files sequentially, especially for I/O-bound operations. If you are processing large files, you might want to consider using streams. You can create multiple stream pipelines and run them concurrently.

---

## Take Your Node.js Skills to the Next Level

Congratulations! You've just mastered one of the most fundamental aspects of Node.js development. But this is just the beginning of your journey to becoming a Node.js expert.

If you found value in this comprehensive guide to file operations, you'll love **Node.js Design Patterns** - the definitive resource designed to elevate Node.js developers from junior to senior level.

This book dives deep into the patterns, techniques, and best practices that separate good Node.js code from great Node.js code. From fundamental concepts like the ones covered in this article to advanced architectural patterns for building scalable applications, it provides the knowledge you need to write professional, maintainable Node.js code.

**Ready to master Node.js?** Visit our [homepage](/) to discover how Node.js Design Patterns can accelerate your development journey and help you build better applications with confidence.
