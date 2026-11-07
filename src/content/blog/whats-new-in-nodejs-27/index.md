---
date: 2026-11-06T10:08:00
updatedAt: 2026-11-06T10:08:00
title: What's new in Node.js 27
slug: whats-new-in-nodejs-27
description: Node.js 27 brings V8 15.6 with Iterator.zip, Iterator.zipKeyed, Math.sumPrecise, net/promises, an unflagged node:vfs, and a 4 GB default heap limit.
authors: ['luciano-mammino']
tags: ['blog']
faq:
  - question: Why did Node.js 27 start with an Alpha release in October 2026?
    answer: Node.js 27 is the first version under the new Node.js release schedule. Instead of two major releases per year, Node.js now ships one major release every April, preceded by a six-month Alpha testing phase starting in October.
  - question: Will Node.js 27 become an LTS release even though 27 is an odd number?
    answer: Yes. Under the new release schedule, the old odd/even rule is gone and every yearly major release becomes LTS. Node.js 27 will enter Current in April 2027, move to LTS in October 2027, and be supported until April 2030.
  - question: What are the biggest JavaScript features in Node.js 27?
    answer: Thanks to V8 15.6, Node.js 27 ships Iterator.zip(), Iterator.zipKeyed(), Iterator.prototype.join(), Iterator.prototype.includes(), Math.sumPrecise(), and Intl.Locale.prototype.variants enabled by default.
  - question: How did the default memory limit change in Node.js 27?
    answer: When --max-old-space-size is not set, V8 now defaults to half of physical memory clamped between 256 MB and 4 GB (meaning an 8 GB machine gets a 4 GB heap instead of 2 GB). Additionally, memory held by Buffer and ArrayBuffer instances now counts toward the heap limit.
  - question: Should I run Node.js 27 Alpha in production?
    answer: No. The Alpha phase (October 2026 to March 2027) is designed for library authors, CI pipelines, and early experimentation so breaking changes can be caught early. Wait until Node.js 27 enters Current in April 2027 or LTS in October 2027 for production workloads.
---

On October 29, 2026, the Node.js team published [`v27.0.0-alpha.0.0.0`](https://nodejs.org/en/blog/release/v27.0.0-alpha.0.0.0). If you have been using Node.js for a few years, that version string alone probably made you do a double take. Where is the usual October `v27.0.0` Current release?

Welcome to the new Node.js release era! Node.js 27 is the very first release to follow the **new annual release schedule**: instead of dropping a full major release in October that would die six months later without ever reaching Long Term Support (LTS), October now kicks off a six-month **Alpha phase** leading up to the official `27.0.0` Current release in **April 2027**, followed by **LTS promotion in October 2027**.

:::note[Wait, an odd-numbered Node.js release becoming LTS?]
Yes! Under the new model, the old odd/even split is gone forever. Version numbers now match the calendar year (**27** in **2027**), there is **one major release per year**, and **every release becomes LTS**. If you missed the announcement, we broke down the whole timeline and reasoning in [Node.js is changing its release schedule and version numbers](/blog/nodejs-release-schedule-changes/). Because Node.js 27 is currently in its Alpha window, we will keep updating this article as new builds land on the way to April 2027.
:::

Even in this very first Alpha cut, Node.js 27 is already packed with genuinely exciting additions. V8 jumped a full major version from 14.6 to **15.6** (bringing `Iterator.zip()`, `Iterator.zipKeyed()`, `Iterator.prototype.join()`, `Iterator.prototype.includes()`, and `Math.sumPrecise()`), `node:net` finally got a first-class **promises API** (plus async-iterable TCP servers!), the **Virtual File System (`node:vfs`) is now unflagged**, the Permission Model gained **`--allow-env`**, and some long-standing HTTP and memory defaults got a much-needed refresh.

In this article we will tour the highlights, **starting from the most enjoyable day-to-day JavaScript and Node.js APIs and moving down to runtime internals and breaking changes**. As usual, we will compare the new APIs with what the equivalent code looked like in older Node.js versions so you can immediately feel the difference.

:::note[Code samples]
Every snippet in this article is also available, ready to run, in the companion repo [`lmammino/nodejs-27-examples`](https://github.com/lmammino/nodejs-27-examples) on GitHub.
:::

## Quick Answer: what's new in Node.js 27

If you only have a minute, here is what matters in Node.js 27 so far:

1. **New `Iterator` helpers (`zip`, `zipKeyed`, `join`, `includes`)** make lazy data pipelines dramatically more expressive.
2. **`Math.sumPrecise()`** sums any iterable of numbers without floating-point rounding drift.
3. **`node:net/promises` and async-iterable `net.Server`** bring clean `async`/`await` ergonomics to TCP servers and sockets.
4. **Virtual File System (`node:vfs`) is unflagged**, making in-memory file systems and `--vfs-load` available without `--experimental-vfs`.
5. **Core upgrades across `fs`, permissions, test runner, and `http`**, including atomic temp files with `fs.mkstemp()`, `--allow-env`, Jest-style mock helpers, and a 65-second HTTP `keepAliveTimeout`.
6. **V8 15.6, OpenSSL 4.1, and a 4 GB heap default** modernize memory limits, sorting, and cryptography under the hood.

Here is a 6-line teaser of what code in Node.js 27 looks like:

```js title="00-quick-answer/teaser.js"
const items = ['Keyboard', 'Mouse', 'Monitor']
const prices = [129.99, 49.99, 349.95]

const lines = Iterator.zipKeyed({ item: items, price: prices })
  .map(({ item, price }) => `${item} ($${price.toFixed(2)})`)
  .join(', ')

console.log(`${lines} -> Total: $${Math.sumPrecise(prices)}`)
// Keyboard ($129.99), Mouse ($49.99), Monitor ($349.95) -> Total: $529.93
```

If you want to experiment locally, [check your current Node.js version](/blog/checking-node-js-version/) before running the snippets below.

## New Iterator superpower: `zip`, `zipKeyed`, `join`, and `includes`

If you know me, you know this is the bit of the release that I am most excited about. When it comes to streams, iterators, generators, and similar lazy abstractions, somehow I always love getting deep in the weeds and having fun seeing how far we can push them! (If you haven't read our deep dive on [JavaScript async iterators](/blog/javascript-async-iterators/), you will quickly see what I mean.)

In [What's new in Node.js 26](/blog/whats-new-in-nodejs-26/), we looked at how `Iterator.concat()` let us stitch multiple iterables together sequentially, one after another. Node.js 27 (via V8 15.6) solves the complementary problem: **what if you want to consume multiple iterables side by side, in lockstep?**

### Pairing sequences lazily with `Iterator.zip()`

Suppose you are checking a weather forecast against the temperatures recorded over the same four days. The predictions come from your model, while the actual values come from observations. To calculate each day's error, you need to pair the values at the same position. Both sequences must cover the same days in the same order.

In Node.js 26 and earlier, if both sequences were arrays, you would typically use `.map()` with an index lookup:

```js title="01-iterators/iterator-zip-old.js"
// Node.js 26 and earlier
const predicted = [18, 21, 20, 23]
const actual = [19, 20, 22, 21]

const errors = predicted.map((prediction, i) => actual[i] - prediction)
console.log(errors) // [1, -1, 2, -2]
```

That works well for arrays. But what if observations come from a generator, or your model returns an iterator of predictions? Index lookups won't work on those inputs, and converting them to arrays means loading both sequences into memory first.

In Node.js 27, `Iterator.zip()` takes an iterable of iterables and returns a lazy iterator of pairs. We can calculate the errors with the same pipeline whether the inputs are arrays or iterators:

```js title="01-iterators/iterator-zip.js"
const predicted = [18, 21, 20, 23]
const actual = [19, 20, 22, 21]

const errors = Iterator.zip([predicted, actual])
  .map(([prediction, observation]) => observation - prediction)
  .toArray()

console.log(errors) // [1, -1, 2, -2]
```

Each pair contains a prediction and its corresponding observation. A positive error means the day was warmer than predicted; a negative error means it was cooler. The pairing and mapping happen one item at a time. Only the final `.toArray()` collects the errors into an array so we can print them together.

Another common use is the **dot product** of two vectors: multiply matching components, then add the products. This operation appears in graphics, machine learning, and numerical computing:

```js title="01-iterators/iterator-zip-dot-product.js"
const a = [1, 2, 3]
const b = [4, 5, 6]

const dotProduct = Iterator.zip([a, b], { mode: 'strict' })
  .map(([x, y]) => x * y)
  .reduce((sum, product) => sum + product, 0)

console.log(dotProduct) // 32 (1 * 4 + 2 * 5 + 3 * 6)
```

Here we never collect the pairs or products into an intermediate array. We also use `mode: 'strict'` because a dot product requires vectors of equal length: silently ignoring extra components would hide an input error.

:::tip[Handling mismatched lengths with `mode`]
By default, `Iterator.zip()` uses `{ mode: 'shortest' }`: it stops when the shortest input finishes and closes the remaining open iterators. For the forecast example, that means comparing only the days available in both sequences. Use `{ mode: 'strict' }` if a missing prediction or observation should instead throw a `TypeError`. Or pass `{ mode: 'longest', padding: [null, 0] }` to continue until the longest input finishes, using the corresponding padding value when an input runs out.
:::

### Combining endless iterators: solar generation and household consumption

So far, our inputs have been arrays. But `Iterator.zip()` also works with iterators that have no end. Imagine a home with two power meters: one measures solar generation, and the other measures household consumption. Each meter gives us its current reading in watts whenever we poll it. Subtracting consumption from generation tells us whether the house has surplus power to export or needs to import power from the grid (assuming there is no battery).

We can wrap each meter in an endless generator. Here we simulate the readings with random values so the example runs without hardware:

```js title="01-iterators/iterator-zip-power-meters.js"
function* powerReadings(readWatts) {
  while (true) {
    yield readWatts()
  }
}

// Simulated meters: each call produces a fresh reading in watts.
const solar = powerReadings(() => Math.round(Math.random() * 4000))
const household = powerReadings(() => Math.round(Math.random() * 3000))

const netPower = Iterator.zip([solar, household]).map(
  ([generation, consumption]) => generation - consumption,
)

for (const watts of netPower.take(5)) {
  if (watts > 0) {
    console.log(`Exporting ${watts} W`)
  } else if (watts < 0) {
    console.log(`Importing ${-watts} W`)
  } else {
    console.log('Generation matches consumption')
  }
}
```

Neither generator reads anything until we request a value from `netPower`. Each request polls both meters once and calculates the difference. Both input iterators can keep producing readings forever, but `.take(5)` limits this demo to five pairs. Collecting either input with `[...solar]` or `.toArray()` would never finish and would eventually exhaust memory.

These are synchronous, on-demand readings: the two meters are polled sequentially, close together, rather than at exactly the same instant. The loop takes five readings immediately; `zip()` does not add a polling interval. With real hardware, the callbacks would read the meters instead of generating random numbers.

### Turning columns into objects with `Iterator.zipKeyed()`

Tuple arrays like `[prediction, observation]` are easy to read for two or three items, but once you have four or five parallel sources, positional destructuring gets easy to mix up.

That is where `Iterator.zipKeyed()` comes in. Instead of passing an array of iterables and getting back positional tuples, you pass an **object whose values are iterables**, and each step yields a neatly labeled object with those exact keys:

```js title="01-iterators/iterator-zip-keyed.js"
const columns = {
  id: [101, 102, 103],
  user: ['alice', 'bob', 'charlie'],
  role: ['admin', 'editor', 'viewer'],
}

const rows = Iterator.zipKeyed(columns)

for (const row of rows) {
  console.log(`${row.user} (#${row.id}) has role: ${row.role}`)
}
// alice (#101) has role: admin
// bob (#102) has role: editor
// charlie (#103) has role: viewer
```

If an API returns each field as a separate array, like user IDs, names, and roles, `Iterator.zipKeyed()` lets you process them together as a lazy sequence of row objects. The arrays must describe the same records in the same order.

### Finishing pipelines with `Iterator.prototype.join()` and `includes()`

Until Node.js 26, if you built a lazy iterator pipeline using `.map()` and `.filter()` and wanted to format the result as a string, you had to call `.toArray().join(', ')` at the end. That final `.toArray()` meant allocating an array holding every single string just so `.join()` could concatenate them and throw the array away.

V8 15.6 adds two terminal helpers directly onto `Iterator.prototype`:

- **`Iterator.prototype.join(separator)`**: consumes the iterator and joins items into a string directly.
- **`Iterator.prototype.includes(value)`**: consumes the iterator until it finds a matching value (using `SameValueZero` equality, just like `Array.prototype.includes()`) and short-circuits immediately.

Let's see them combined with `Iterator.zipKeyed()` to generate a CSV report lazily:

```js title="01-iterators/iterator-join-includes.js"
const rawLogs = {
  service: ['auth', 'payments', 'search', 'notifications'],
  status: [200, 503, 200, 500],
  latencyMs: [12, 450, 28, 310],
}

// 1. Check if any service returned a 503 (short-circuits on the 2nd item!)
const hasServiceUnavailable = rawLogs.status.values().includes(503)
console.log('Any 503 errors?', hasServiceUnavailable) // true

// 2. Build a CSV of failing endpoints without ever allocating an array
const failingCsv = Iterator.zipKeyed(rawLogs)
  .filter((entry) => entry.status >= 500)
  .map((entry) => `${entry.service},${entry.status},${entry.latencyMs}ms`)
  .join('\n')

console.log(failingCsv)
// payments,503,450ms
// notifications,500,310ms
```

Because `Iterator.zipKeyed()`, `.filter()`, `.map()`, and `.join()` all operate on the iterator protocol one item at a time, not a single intermediate array is created in that entire pipeline.

## Goodbye `0.30000000000000004`: `Math.sumPrecise()`

Every JavaScript developer has a story about the day they first met IEEE-754 double-precision floating-point math:

```js title="02-math-sum-precise/sum-old.js"
// Node.js 26 and earlier - floating-point drift in action
const cartPrices = [129.99, 49.99, 349.95]
const naiveTotal = cartPrices.reduce((sum, price) => sum + price, 0)

console.log(naiveTotal)
// 529.9300000000001 (!)

// Even worse: catastrophic cancellation when large and small numbers mix
const ledger = [1e20, 0.1, -1e20]
console.log(ledger.reduce((sum, n) => sum + n, 0))
// 0 (the 0.1 completely vanished!)
```

When you sum numbers with `.reduce((a, b) => a + b, 0)`, each addition rounds its intermediate result to the nearest representable 64-bit float. Over dozens or thousands of additions, those tiny rounding errors accumulate. Worse, if you add a small number (`0.1`) to a huge number (`1e20`) and later add `-1e20`, the `0.1` is lost completely during the first addition because a 64-bit float doesn't have enough mantissa bits to hold both magnitudes at once.

In Node.js 27, V8 15.6 enables **`Math.sumPrecise()`** by default. It accepts any iterable of numbers, computes the sum using an internal high-precision accumulator, and rounds only once at the very end:

```js title="02-math-sum-precise/sum-precise.js"
const cartPrices = [129.99, 49.99, 349.95]
console.log(Math.sumPrecise(cartPrices))
// 529.93

const ledger = [1e20, 0.1, -1e20]
console.log(Math.sumPrecise(ledger))
// 0.1 (no precision lost!)
```

And here is a neat detail that connects back to the previous section: **`Math.sumPrecise()` takes any iterable, not just an array**. That means you can pipe a lazy iterator `.map()` directly into `Math.sumPrecise()` without calling `.toArray()` first:

```js title="02-math-sum-precise/sum-iterator.js"
const orderLines = [
  { item: 'USB-C Hub', qty: 2, unitPrice: 39.99 },
  { item: 'Mouse', qty: 1, unitPrice: 49.99 },
  { item: 'Monitor', qty: 1, unitPrice: 249.95 },
]

const total = Math.sumPrecise(
  orderLines.values().map((line) => line.qty * line.unitPrice),
)

console.log(`Order total: $${total}`) // Order total: $379.92
```

:::caution[When you still need integer cents or decimal libraries]
`Math.sumPrecise()` eliminates intermediate rounding drift when _summing_ IEEE-754 floats, and it is far more accurate than `.reduce()`. However, remember that individual inputs like `0.1` are still binary floating-point approximations under the hood. For strict accounting, tax calculations, or multi-currency arithmetic with division and multiplication rules, storing integer minor units (like cents) or using a dedicated decimal library is still best practice.
:::

## `node:net/promises` and async-iterable TCP servers

Wait, didn't I promise more iterator goodness? Here it comes, and in a place you might not expect: the core `node:net` module!

For years, `node:fs`, `node:dns`, `node:stream`, `node:timers`, and `node:readline` have all had `.promises` sub-modules. Yet `node:net` remained purely callback- and event-driven. If you wanted to spin up a TCP server on an ephemeral port in a test or connect a client socket using `async`/`await`, you had to wrap `'listening'`, `'connect'`, and `'error'` events by hand.

In Node.js 26 and earlier, setting up a TCP server and client with `async`/`await` looked like this:

```js title="03-net-promises/net-old.js"
// Node.js 26 and earlier - manual event-to-promise wiring
import { createServer, createConnection } from 'node:net'
import { once } from 'node:events'

const server = createServer((socket) => {
  socket.end('Hello from TCP server\n')
})
server.listen(0, '127.0.0.1')
await once(server, 'listening')

const { port } = server.address()
const client = createConnection({ port, host: '127.0.0.1' })
await once(client, 'connect')

for await (const chunk of client) {
  console.log('Received:', chunk.toString().trim())
}
server.close()
```

Node.js 27 introduces the experimental **`node:net/promises`** module with two action-oriented helpers, **`listen()`** and **`connect()`**, and makes **`net.Server` itself an async iterable**:

```js title="03-net-promises/net-promises.js"
import { connect, listen } from 'node:net/promises'

const ac = new AbortController()
const server = await listen({
  port: 0,
  host: '127.0.0.1',
  signal: ac.signal,
})

// Consume incoming connections with for await...of!
const serverLoop = (async () => {
  for await (const socket of server) {
    socket.end('Hello from async-iterable TCP server!\n')
    ac.abort() // close server after serving one connection
  }
})()

const client = await connect({
  port: server.address().port,
  host: '127.0.0.1',
})

for await (const chunk of client) {
  console.log('Received:', chunk.toString().trim())
}

await serverLoop
```

There are two really nice design choices here:

1. **`listen()` and `connect()` return Promises for the one-shot lifecycle moments** (binding the port and establishing the connection), and both support an `AbortSignal` out of the box. If binding or connecting fails, the underlying server or socket is cleaned up and the Promise rejects cleanly.
2. **`for await (const socket of server)` turns incoming TCP connections into an async iterable stream**, matching the ergonomics we explored in [JavaScript async iterators](/blog/javascript-async-iterators/). If your loop body awaits some async work, incoming connections continue to arrive and can buffer without bound. Set `server.maxConnections` explicitly to limit concurrent connections when handling them sequentially.

## Virtual File System (`node:vfs`) is now unflagged

Have you ever written a unit test for a function that reads or writes configuration files, and found yourself either mocking `node:fs` awkwardly or creating and deleting temporary directories on disk? Or wished you could bundle static assets or templates into a single archive and let your code read them through standard `node:fs` calls?

The new **`node:vfs` (Virtual File System)** module was originally introduced behind `--experimental-vfs`, and in Node.js 27 **it is unflagged and available out of the box** (though still marked Experimental Stability 1 while the API settles).

With `node:vfs`, you can create an isolated, in-memory file system with `vfs.create()`, populate it using standard `fs`-style methods, and even **mount** it so regular `node:fs` operations (and `import` / `require()`) can read from it directly! Better yet, `VirtualFileSystem` supports Explicit Resource Management (`using`), so it automatically unmounts when it goes out of scope:

```js title="04-vfs/vfs-mount.js"
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import vfs from 'node:vfs'

async function loadAppConfig(configDir) {
  const raw = await readFile(join(configDir, 'app.json'), 'utf8')
  return JSON.parse(raw)
}

// Create an in-memory VFS that automatically unmounts at the end of the block
{
  using memoryFs = vfs.create()
  memoryFs.mkdirSync('/etc/myapp', { recursive: true })
  memoryFs.writeFileSync(
    '/etc/myapp/app.json',
    JSON.stringify({ env: 'test', featureFlags: ['vfs'] }),
  )

  // Mount into Node's reserved virtual namespace (e.g. /dev/null/vfs/1)
  const mountPoint = memoryFs.mount()

  // Regular node:fs functions can now read from the mounted path!
  const config = await loadAppConfig(join(mountPoint, 'etc/myapp'))
  console.log('Loaded from VFS:', config)
}
// memoryFs is automatically unmounted here!
```

Notice that `memoryFs.mount()` mounts the virtual file system under a reserved namespace (`path.join(os.devNull, 'vfs')`, such as `/dev/null/vfs/1` on POSIX), so a virtual mount can never accidentally shadow or overwrite real files on your disk. If you want to compare this with working on real files, check out our guide on [reading and writing files in Node.js](/blog/reading-writing-files-nodejs/).

Unflagging `node:vfs` also unlocks **`--vfs-load`** on the CLI without needing an experimental flag:

```bash
node --vfs-load=bundle.zip
```

That command mounts `bundle.zip` (or a directory) via `node:vfs` and runs your application's `package.json` `"main"` or `index.js` entry point straight out of the ZIP archive. And if you use Single Executable Applications (SEA), `vfsArchive` is now mounted at layer 0 and automatically available inside Worker threads too.

## More Node.js Core upgrades: `fs`, Permissions, Test Runner, and HTTP

Beyond the headline modules above, Node.js 27 lands a great set of quality-of-life improvements across the standard library. Let's tour the most practical ones.

### Atomic temporary files with `fs.mkstemp()` and native `fs.glob()`

Until now, if you needed a temporary file in Node.js, your safest built-in option was `fs.mkdtemp()` to create a temporary _directory_, and then opening a file inside it. Creating a random filename yourself and calling `fs.open()` was error-prone and required a retry loop in case of collisions.

Node.js 27 exposes POSIX `mkstemp(3)` via **`fs.mkstemp()`**, **`fs.mkstempSync()`**, and **`fsPromises.mkstemp()`**. It atomically generates a unique filename (appending six random characters to your prefix) and opens the file in a single step, returning both the `path` and the open `FileHandle` (or file descriptor `fd`):

```js title="05-core-upgrades/fs-mkstemp.js"
import { mkstemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const prefix = join(tmpdir(), 'export-')
const { path, handle } = await mkstemp(prefix)

try {
  await handle.writeFile('id,status\n1,ok\n', 'utf8')
  console.log(`Wrote temporary report to ${path}`)
} finally {
  await handle.close()
  await rm(path)
}
```

The built-in **`fs.glob()`** (introduced in Node.js 22) was ported from JavaScript to native C++ in Node.js 27. The [maintainers' benchmarks](https://github.com/nodejs/node/pull/65392#issuecomment-5443229793) show substantial speedups for some workloads, but gains vary by API and options, and one synchronous exclude-pattern workload regressed. Benchmark your own patterns before assuming a speedup.

### Permission Model gets `--allow-env`

As we covered in our guide to [environment variables in Node.js](/blog/nodejs-environment-variables/), `process.env` is where most applications keep their most sensitive secrets (API keys, database URLs, signing tokens). It is also the very first place a compromised dependency looks when trying to exfiltrate credentials.

Node.js 27 adds **`--allow-env`** to the Permission Model (`--permission`). When `--permission` is enabled, **every environment variable not explicitly matched by `--allow-env` is scrubbed at process startup** before any JavaScript runs (except safe runtime defaults like `PATH`, `HOME`, `LANG`, and `NODE_OPTIONS`, plus variables explicitly loaded via `--env-file`):

```bash
# Only allow variables starting with PUBLIC_ or APP_
SECRET_KEY=super-secret APP_PORT=3000 \
  node --permission --allow-env='PUBLIC_*,APP_*' server.js
```

Even better, Node.js scrubs the disallowed variables from the underlying OS environment block (and blocks reads to `/proc/self/environ` on Linux), so native add-ons or FFI calls cannot sneak around `process.env` to read them either. You can also drop access to an environment variable at runtime right after reading it using `process.permission.drop()`.

### Built-in Test Runner: stable watch mode and Jest-style mock helpers

If you have been using the built-in `node:test` runner, Node.js 27 brings three nice upgrades:

- **Watch mode (`node --test --watch`) is now officially stable** (Stability 2).
- **`--test-forbid-only`** fails the test run if any test is marked with `{ only: true }` or `test.only()`, which is great for catching accidental `.only` commits in CI.
- **Shorthand methods on mocks**: instead of wrapping simple return values or promises inside `fn.mock.mockImplementation(() => ...)`, `MockFunctionContext` now has **`mockReturnValue()`**, **`mockResolvedValue()`**, **`mockRejectedValue()`**, and **`mockThrownValue()`**:

```js title="05-core-upgrades/test-mocks.js"
import { test, mock } from 'node:test'
import assert from 'node:assert/strict'

test('mock shorthand helpers in Node.js 27', async () => {
  const getDiscount = mock.fn()
  getDiscount.mock.mockReturnValue(0.15)
  assert.strictEqual(getDiscount(), 0.15)

  const fetchUser = mock.fn()
  fetchUser.mock.mockResolvedValue({ id: 42, name: 'Luciano' })
  assert.deepStrictEqual(await fetchUser(), { id: 42, name: 'Luciano' })

  const failSync = mock.fn()
  failSync.mock.mockThrownValue(new Error('Invalid token'))
  assert.throws(() => failSync(), /Invalid token/)
})
```

### Smarter HTTP & HTTP/2 defaults

Three HTTP changes in Node.js 27 deserve a special callout because they directly affect production web servers:

1. **`http.Server` `keepAliveTimeout` increased from 5 seconds to 65 seconds**:
   If you have ever run a Node.js HTTP server behind an AWS Application Load Balancer (ALB), Nginx, or Cloudflare, you may have been bitten by intermittent `502 Bad Gateway` errors under load. Why? Because most reverse proxies default to a 60-second idle keep-alive timeout, while Node.js historically defaulted to just **5 seconds** (`5000` ms). If Node.js closed an idle socket at 5.001 seconds right as the load balancer reused it to forward a request, the request failed with a 502. Bumping Node's default `keepAliveTimeout` to **65 seconds** (`65000` ms) puts it above a 60-second proxy timeout out of the box. Check your proxy's actual idle timeout and configure Node's timeout to exceed it; 65 seconds does not cover every proxy configuration.
2. **`req.headers` and `req.trailers` now have a `null` prototype**:
   Incoming request headers (`Object.getPrototypeOf(req.headers) === null`) no longer inherit from `Object.prototype`. This prevents prototype-pollution edge cases when looking up header names like `req.headers['toString']` or `req.headers['constructor']` and matches `req.headersDistinct`. (See the breaking changes section below if your code calls `req.headers.hasOwnProperty(...)`!)
3. **Larger HTTP/2 window sizes**:
   `node:http2` increased its default flow-control window sizes and trimmed per-request callback overhead, improving throughput on high-bandwidth HTTP/2 connections without manual tuning.

## Under the hood: V8 15.6, the 4 GB Heap Default, and OpenSSL 4.1

Beyond new APIs, several big engine and dependency upgrades landed in Node.js 27:

- **Default Heap Limit up to 4 GB on mid-sized machines**:
  When `--max-old-space-size` is not specified, V8 now sets the default old-generation heap limit to **half of physical memory (or container cgroup memory), clamped between 256 MB and 4 GB**. Previously, machines with less than 15 GB of RAM were capped at 2 GB. That means on a very common **8 GB container or VM**, your Node.js process can now use up to **4 GB** of heap by default instead of crashing with an Out-Of-Memory error at 2 GB (and on a 6 GB machine, 3 GB instead of 2 GB).
- **`Buffer` and `ArrayBuffer` memory counts toward the heap limit**:
  Memory held by `Buffer` and `ArrayBuffer` instances is now included in V8's global allocation limit. If your app allocates large off-heap buffers (for example, image processing or large file buffers), garbage collection will trigger more proactively to keep total memory bounded.
- **V8 15.6 performance improvements**:
  - `Array.prototype.sort()` now uses **PowerSort** instead of TimSort for large arrays (still stable, with better performance on tricky input distributions).
  - `await` on an already-fulfilled Promise incurs fewer microtasks and allocates less, and async generators are around 6% faster on file-system benchmarks.
  - `Intl.Locale.prototype.variants` is now available to inspect locale variants (for example, `new Intl.Locale('sl-rozaj-biske').variants` returns `'biske-rozaj'`).
- **OpenSSL 4.1.0, Undici 8.12, SQLite 3.54, and npm 12.1.0**:
  Node.js 27 upgrades its bundled cryptography to **OpenSSL 4.1.0**, strips out all legacy OpenSSL 1.x compatibility shims and engine APIs, bumps `npm` to **12.1.0**, and updates **`NODE_MODULE_VERSION` to 153**.

## Heads-up: Node.js 27 breaking changes

Because Node.js 27 is currently in its Alpha window, catching breaking changes early is the whole point of the release. Most applications won't hit these, but there are a few subtle behavior shifts worth checking in your codebase and dependencies.

### 1. `req.headers` has a `null` prototype

Because `req.headers` and `req.trailers` in `node:http` are now created with `Object.create(null)`, calling `Object.prototype` methods directly on `req.headers` will throw a `TypeError`:

```js title="05-core-upgrades/http-headers.js"
// Throws in Node.js 27: TypeError: req.headers.hasOwnProperty is not a function
if (req.headers.hasOwnProperty('authorization')) {
  // ...
}

// Safe in all modern Node.js versions:
if (Object.hasOwn(req.headers, 'authorization')) {
  // ...
}
```

### 2. Memory limits for multi-process deployments

If you run multiple Node.js processes on a 6 GB or 8 GB machine and relied on the old implicit 2 GB heap cap to keep them from starving each other, **pass `--max-old-space-size=2048` explicitly**. Similarly, if your application holds hundreds of megabytes of `Buffer` data in memory alongside a large JS heap, be aware that `Buffer` allocations now count toward V8's heap limit.

### 3. V8 serialization format and larger heap snapshots

- **`v8.serialize()`, `structuredClone()`, and `postMessage()`** use a new V8 serialization format (which adds support for TypedArrays and resizable `ArrayBuffer`s larger than 4 GB in `structuredClone()` and `postMessage()`). Node.js 27 can still read data serialized by older Node.js versions, but **older Node.js versions cannot deserialize payloads produced by `v8.serialize()` in Node.js 27**. Watch out if you store `v8.serialize()` blobs in Redis or a database shared across mixed Node.js versions during a rolling upgrade!
- **Heap snapshots are ~2x larger and include full script source**: `v8.writeHeapSnapshot()` and `v8.getHeapSnapshot()` now always include internal objects, numeric values, and the complete source code of scripts (instead of truncating at 1024 characters). As always, treat `.heapsnapshot` files as sensitive data because they may contain secrets present in your source or memory.

### 4. Deprecations, removals, and platform changes

- **`node:domain` is now runtime-deprecated**: Importing or using `node:domain` emits a runtime deprecation warning (and its internals have been ported to `AsyncLocalStorage`).
- **Private `_http_*` modules deprecated and `_tls_*` removed**: Undocumented internal modules (`_http_agent`, `_http_client`, `_http_common`, `_http_incoming`, `_http_outgoing`, `_http_server`) are deprecated, and `_tls_common` / `_tls_wrap` have reached End-of-Life. Always import from `node:http` and `node:tls`.
- **OpenSSL engines and OpenSSL 1.x dropped**: Building from source requires OpenSSL 3.0 or newer (bundled binary builds ship OpenSSL 4.1.0), and custom OpenSSL engine APIs (`clientCertEngine`, `privateKeyEngine`, `crypto.setEngine()`) are gone.
- **Calling `Hmac.digest()` multiple times is runtime-deprecated**.
- **`--no-experimental-websocket` removed**: The global `WebSocket` client is permanent and can no longer be disabled via CLI flag.
- **Intel macOS (`darwin-x64`) downgraded to experimental**: Apple Silicon (`darwin-arm64`) remains Tier 1, while Intel macOS support is now experimental.

:::warning[Upgrade checklist for Node.js 27]
When testing your project or library against Node.js 27:

1. Search your codebase for `req.headers.hasOwnProperty` or `req.trailers.hasOwnProperty` and replace them with `Object.hasOwn(...)`.
2. Check if you persist `v8.serialize()` output across processes or in Redis/databases that might be read by Node.js 24 or 26 instances.
3. Explicitly set `--max-old-space-size` in production if your container sizing assumed a 2 GB default ceiling on hosts with more than 4 GB and less than 15 GB of memory, or if you hold huge `Buffer` pools.
4. Grep for legacy `_http_*`, `_tls_*`, or `node:domain` imports in your codebase and dependencies.
5. Rebuild native C++ add-ons (`NODE_MODULE_VERSION` is 153, and `node::ObjectWrap` is now officially deprecated in favor of Node-API / `napi.h`).
   :::

## Should you use Node.js 27 today?

Because Node.js 27 is currently in its **Alpha phase** (October 2026 to March 2027), the answer depends entirely on what hat you are wearing today:

- **For production workloads**: **No, not yet.** Keep running Node.js 24 LTS or Node.js 26 LTS in production. Node.js 27 will enter **Current in April 2027** and become **LTS in October 2027** (with support all the way to April 2030).
- **For open-source library and framework authors**: **Yes, add it to your CI now!** As we talked about in [our article on the new release schedule](/blog/nodejs-release-schedule-changes/), the Alpha channel exists specifically so maintainers can catch breaking changes (like `null`-prototype `req.headers`, V8 15.6 changes, or native add-on ABI updates) months before users upgrade. Note that the Node.js team even patched `npm` engines checks in this Alpha so your CI won't trip over the `-alpha` prerelease tag.
- **For local experimentation and learning**: **Absolutely!** Trying out `Iterator.zipKeyed()`, `Math.sumPrecise()`, `node:net/promises`, and `node:vfs` on side projects is the best way to stay ahead of the curve.

If you want to install the Alpha side by side with your stable LTS runtime without messing up your system setup, check out our guide on [5 ways to install Node.js](/blog/5-ways-to-install-node-js/) using version managers like `fnm` or `nvm`.

:::tip[Want to write modern, production-ready Node.js?]
Our book **Node.js Design Patterns** keeps a tight focus on the patterns that survive every release: streams, iterators, async control flow, modules, and scalable architectures. Runtimes evolve every year, but mastering the underlying patterns is what makes your code last.

[Get a FREE chapter →](/#free-chapter)
:::

## Wrapping up

Node.js 27 is a milestone release in more ways than one. It inaugurates the new, much saner annual release schedule where every major version eventually becomes LTS, and it uses the new Alpha runway to land a huge V8 15.6 upgrade alongside long-requested core features like `node:net/promises`, an unflagged `node:vfs`, `fs.mkstemp()`, and `--allow-env`.

If you only try one thing from this release, take `Iterator.zipKeyed()` and `Iterator.prototype.join()` for a spin on a data-transformation script and see how satisfying it is to transform parallel collections lazily without a single intermediate array.

For the full list of commits and low-level details, check out the [official Node.js 27.0.0-alpha.0.0.0 release notes](https://nodejs.org/en/blog/release/v27.0.0-alpha.0.0.0) and the companion post on [Notable V8 changes from Node.js 26 to 27 (Alpha)](https://nodejs.org/en/blog/announcements/notable-v8-changes-from-node-js-26-to-27-alpha).

And as always, a huge thank you to the Node.js releasers, V8 maintainers, and every contributor who worked on this first Alpha and the new release schedule. Making a runtime this size both faster for developers and more sustainable for maintainers is no small feat. 😉

See you in the next article!

## Frequently Asked Questions

### Why did Node.js 27 start with an Alpha release in October 2026?

Node.js 27 is the first version under the new Node.js release schedule. Instead of two major releases per year, Node.js now ships one major release every April, preceded by a six-month Alpha testing phase starting in October.

### Will Node.js 27 become an LTS release even though 27 is an odd number?

Yes. Under the new release schedule, the old odd/even rule is gone and every yearly major release becomes LTS. Node.js 27 will enter Current in April 2027, move to LTS in October 2027, and be supported until April 2030.

### What are the biggest JavaScript features in Node.js 27?

Thanks to V8 15.6, Node.js 27 ships `Iterator.zip()`, `Iterator.zipKeyed()`, `Iterator.prototype.join()`, `Iterator.prototype.includes()`, `Math.sumPrecise()`, and `Intl.Locale.prototype.variants` enabled by default.

### How did the default memory limit change in Node.js 27?

When `--max-old-space-size` is not set, V8 now defaults to half of physical memory clamped between 256 MB and 4 GB (meaning an 8 GB machine gets a 4 GB heap instead of 2 GB). Additionally, memory held by `Buffer` and `ArrayBuffer` instances now counts toward the heap limit.

### Should I run Node.js 27 Alpha in production?

No. The Alpha phase (October 2026 to March 2027) is designed for library authors, CI pipelines, and early experimentation so breaking changes can be caught early. Wait until Node.js 27 enters Current in April 2027 or LTS in October 2027 for production workloads.
