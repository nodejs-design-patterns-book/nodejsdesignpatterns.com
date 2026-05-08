---
date: 2026-05-08T10:00:00
updatedAt: 2026-05-08T10:00:00
title: What's new in Node.js 26
slug: whats-new-in-nodejs-26
description: Node.js 26 ships the Temporal API by default, Map upsert helpers, Iterator.concat, V8 14.6 and Undici 8. A code-heavy tour with practical examples.
authors: ['luciano-mammino']
tags: ['blog']
faq:
  - question: When was Node.js 26 released?
    answer: Node.js 26 was released on May 5, 2026. It enters Long Term Support (LTS) in October 2026, after a six-month period on the "Current" release line.
  - question: Why did Node.js skip version 25?
    answer: Node.js jumped from v24 straight to v26 so the major version number aligns with the underlying Chromium release (Chromium 146 / V8 14.6). Expect this even-numbered alignment to continue going forward.
  - question: Is the Temporal API stable in Node.js 26?
    answer: Yes. Temporal is enabled by default and considered stable for production use. It is the recommended replacement for the legacy Date object when working with dates, times, and time zones.
  - question: Should I upgrade existing projects to Node.js 26?
    answer: For production, wait until Node.js 26 enters LTS in October 2026. The Current line is great for new projects, prototypes, and library authors who want to validate compatibility before LTS.
  - question: Are there breaking changes in Node.js 26?
    answer: Yes. The private `_stream_*` modules are removed, `http.Server.prototype.writeHeader()` is gone (use `writeHead()`), `--experimental-transform-types` is removed, and `module.register()` is now runtime-deprecated. Most crypto changes only affect advanced key handling.
---

Node.js 26 landed on May 5, 2026, and it might be one of the more exciting majors in recent memory. After years of waiting, the **Temporal API is stable and enabled by default**, V8 jumped to 14.6 (which brings some genuinely useful new built-ins), Undici got a major version bump, and a long list of legacy APIs finally retired.

If you noticed that we went from v24 straight to v26: that is not a typo. Node.js skipped version 25 so the major number now matches the bundled Chromium release (146). Expect the version cadence to keep aligning with Chromium going forward.

In this article we will tour the highlights, **starting from the coolest, most code-relevant features and moving down to migration concerns**. Every section shows you what the new API looks like and, where useful, what the same code used to look like in older Node.js versions so you can see exactly what these changes unlock.

:::note[Prerequisites]
The examples below use **top-level `await`** and ESM imports. To run them, either set `"type": "module"` in your `package.json` or use the `.mjs` file extension. All snippets target Node.js 26 unless noted.
:::

## Quick Answer: the headlines

If you only have a minute, here is what matters in Node.js 26:

1. **Temporal is stable**. The modern, immutable, time-zone-aware date API is now a global.
2. **`Map.getOrInsert` and `Map.getOrInsertComputed`** kill the get-or-set boilerplate forever.
3. **`Iterator.concat()`** lets you compose iterators without building intermediate arrays.
4. **Crypto raw-key support** plus Ed25519 context strings make signing protocols simpler.
5. **V8 14.6 and Undici 8** bring runtime and `fetch()` performance improvements.
6. **Cleanup**: legacy `_stream_*` modules, `writeHeader()`, and `--experimental-transform-types` are gone.

Here is a 4-line teaser of what code in Node.js 26 can look like:

```javascript
const tomorrow = Temporal.Now.plainDateISO().add({ days: 1 })
const cache = new Map()
const value = cache.getOrInsertComputed('user:42', () => fetchUser(42))
console.log(`Refreshing on ${tomorrow}, value =`, await value)
```

If you have not yet upgraded, [check your current Node.js version](/blog/checking-node-js-version/) before trying any of the snippets below.

## Temporal API, finally stable

Working with dates in JavaScript has been famously painful. The legacy `Date` object is mutable, months are 0-indexed, time zone behavior depends on the host machine, and parsing is unreliable across implementations. After many years in proposal and a long stay behind a flag, **the Temporal API is enabled by default in Node.js 26** as a top-level global.

Temporal is immutable, type-safe (you cannot accidentally mix a date with a date-and-time), and time-zone-aware by design.

### Today, tomorrow, and a month from now

```javascript
// temporal-basics.mjs
const today = Temporal.Now.plainDateISO()
const tomorrow = today.add({ days: 1 })
const inOneMonth = today.add({ months: 1 })
const lastFridayOfMonth = today.with({ day: today.daysInMonth }).subtract({
  days: (today.with({ day: today.daysInMonth }).dayOfWeek + 2) % 7,
})

console.log({
  today: today.toString(),
  tomorrow: tomorrow.toString(),
  inOneMonth: inOneMonth.toString(),
  lastFridayOfMonth: lastFridayOfMonth.toString(),
})
```

Notice how `add({ months: 1 })` does the right thing across month boundaries. If today is January 31, you get February 28 or 29 depending on the year, no manual clamping required.

In Node.js 24 and earlier, the same calculation looked like this and was riddled with footguns:

```javascript
// Node.js 24 and earlier, the painful way
const today = new Date()
const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1) // mutates in place

const inOneMonth = new Date(today)
inOneMonth.setMonth(inOneMonth.getMonth() + 1) // Jan 31 + 1 month = March 3 (!)

console.log({
  today: today.toISOString().slice(0, 10),
  tomorrow: tomorrow.toISOString().slice(0, 10),
  inOneMonth: inOneMonth.toISOString().slice(0, 10),
})
```

That `Jan 31 + 1 month = March 3` overflow is a classic bug that Temporal simply does not have.

### Time zones that just work

Time zones are where Temporal really shines. `Temporal.ZonedDateTime` carries its IANA time zone with it, so DST transitions, offsets, and conversions all behave correctly without you having to think about UTC offsets.

```javascript
// temporal-timezones.mjs
const meeting = Temporal.ZonedDateTime.from({
  year: 2026,
  month: 10,
  day: 24,
  hour: 9,
  minute: 0,
  timeZone: 'Europe/Dublin',
})

const sameInstantInTokyo = meeting.withTimeZone('Asia/Tokyo')
const sameInstantInNewYork = meeting.withTimeZone('America/New_York')

console.log(`Dublin:    ${meeting.toPlainDateTime()} (${meeting.timeZoneId})`)
console.log(`Tokyo:     ${sameInstantInTokyo.toPlainDateTime()}`)
console.log(`New York:  ${sameInstantInNewYork.toPlainDateTime()}`)
```

The big win is that arithmetic respects DST. Adding 24 hours and adding 1 day are now genuinely different operations:

```javascript
// temporal-dst.mjs
const before = Temporal.ZonedDateTime.from('2026-03-28T20:00[Europe/Dublin]')

const plus24Hours = before.add({ hours: 24 })
const plus1Day = before.add({ days: 1 })

console.log(`Start:        ${before.toPlainDateTime()}`)
console.log(`+24 hours:    ${plus24Hours.toPlainDateTime()}`) // 2026-03-29T21:00 (DST jump)
console.log(`+1 day:       ${plus1Day.toPlainDateTime()}`) // 2026-03-29T20:00 (calendar day)
```

If you have ever shipped a "remind me in one day" feature that drifted by an hour twice a year, you know exactly how valuable this is.

### Durations and comparisons

Temporal has dedicated `Temporal.Duration` and `Temporal.Instant` types. You can subtract two dates and get a properly-typed duration, then format it however you want:

```javascript
// temporal-duration.mjs
const start = Temporal.PlainDate.from('2026-05-08')
const end = Temporal.PlainDate.from('2026-12-15')

const duration = start.until(end, { largestUnit: 'months' })
console.log(`${duration.months} months and ${duration.days} days`)

// Order comparison, no `getTime()` dance required
if (Temporal.PlainDate.compare(start, end) < 0) {
  console.log('start is before end')
}
```

The `Temporal.PlainDate.compare` helper returns `-1`, `0`, or `1`, which makes it perfect for sorting:

```javascript
const dates = ['2026-12-15', '2026-05-08', '2026-08-01'].map(
  Temporal.PlainDate.from,
)
dates.sort(Temporal.PlainDate.compare)
console.log(dates.map(String))
// [ '2026-05-08', '2026-08-01', '2026-12-15' ]
```

:::caution[Migrating from polyfills]
If your codebase already uses the `@js-temporal/polyfill` package, you can now drop the dependency on Node.js 26 and use the global `Temporal` directly. The API surface is identical. Just be careful that any libraries you depend on do not still import the polyfill internally.
:::

## `Map.getOrInsert` and `getOrInsertComputed`

V8 14.6 brings the new `Map.prototype.getOrInsert()` and `Map.prototype.getOrInsertComputed()` methods (and the same pair on `WeakMap`). These are tiny, but they make a hugely common pattern much cleaner.

### The classic memoization pattern

Every codebase has a function like this somewhere: cache a result keyed by some identifier, compute it lazily, return the cached value next time.

In Node.js 24 and earlier, you would write something like:

```javascript
// Node.js 24 - manual get-or-set, with double lookup
const userCache = new Map()

function getUser(id) {
  if (!userCache.has(id)) {
    userCache.set(id, expensivelyLoadUser(id))
  }
  return userCache.get(id)
}
```

That works, but it does two map lookups per call (`has` then `get`), and the `expensivelyLoadUser` reference appears far from the `userCache.set` call, which makes the intent fuzzy.

In Node.js 26, we can write the same thing as a single, atomic, single-lookup expression:

```javascript
// Node.js 26
const userCache = new Map()

function getUser(id) {
  return userCache.getOrInsertComputed(id, expensivelyLoadUser)
}
```

The callback only runs if the key is not already present. Once it runs, its return value is stored and returned, and every subsequent call gets the cached entry.

### Grouping and counting

`getOrInsertComputed` is also great for the "group items by key" pattern, which usually involves the same `if (!map.has(...))` boilerplate:

```javascript
// group-orders.mjs
const orders = [
  { customerId: 1, total: 19.9 },
  { customerId: 2, total: 5.0 },
  { customerId: 1, total: 42.0 },
  { customerId: 3, total: 7.25 },
  { customerId: 2, total: 11.0 },
]

const byCustomer = new Map()
for (const order of orders) {
  byCustomer.getOrInsertComputed(order.customerId, () => []).push(order)
}

console.log(byCustomer)
// Map(3) { 1 => [...], 2 => [...], 3 => [...] }
```

The `getOrInsert` variant takes a value directly (not a factory), which is handy when the default is cheap to construct:

```javascript
const counts = new Map()
for (const word of ['apple', 'banana', 'apple', 'cherry', 'banana', 'apple']) {
  counts.set(word, counts.getOrInsert(word, 0) + 1)
}
console.log(counts) // Map(3) { 'apple' => 3, 'banana' => 2, 'cherry' => 1 }
```

### Per-instance metadata with `WeakMap`

`WeakMap` got the same pair of helpers, which is a big quality-of-life improvement when you attach metadata to objects you do not own:

```javascript
// weakmap-metadata.mjs
const metadata = new WeakMap()

function tag(obj, key, value) {
  const entry = metadata.getOrInsertComputed(obj, () => ({}))
  entry[key] = value
}

const req = { url: '/orders' }
tag(req, 'startedAt', performance.now())
tag(req, 'requestId', crypto.randomUUID())

console.log(metadata.get(req))
```

Because `WeakMap` keys are held weakly, the metadata is collected automatically when the original object goes out of scope, no manual cleanup required.

## `Iterator.concat()` for composable pipelines

The other goodie that came with V8 14.6 is `Iterator.concat()`. It takes any number of iterables and returns a single iterator that yields from each of them in order, lazily, without ever building an intermediate array.

### Combining generators

```javascript
// iterator-concat.mjs
function* range(start, end) {
  for (let i = start; i < end; i++) yield i
}

const combined = Iterator.concat(range(1, 4), range(10, 13), range(100, 102))

for (const n of combined) {
  console.log(n)
}
// 1, 2, 3, 10, 11, 12, 100, 101
```

In Node.js 24 and earlier, you had two options, and neither was great. Either materialize everything into an array:

```javascript
// Node.js 24 - eager materialization, doubles memory
const combined = [...range(1, 4), ...range(10, 13), ...range(100, 102)]
for (const n of combined) console.log(n)
```

Or hand-write a wrapper generator:

```javascript
// Node.js 24 - lazy but boilerplate-heavy
function* concat(...iterables) {
  for (const it of iterables) yield* it
}
const combined = concat(range(1, 4), range(10, 13), range(100, 102))
```

`Iterator.concat()` is the second one, baked in.

### Paginated APIs without buffering

The pattern shines when you are streaming pages of data from a remote API and want to expose the whole stream as one iterator:

```javascript
// paginated.mjs
async function* fetchPage(page) {
  const res = await fetch(`https://api.example.com/items?page=${page}`)
  const { items } = await res.json()
  for (const item of items) yield item
}

const allItems = Iterator.concat(fetchPage(1), fetchPage(2), fetchPage(3))

for await (const item of allItems) {
  console.log(item.id)
  // process one item at a time, without ever holding all 3 pages in memory
}
```

You can also chain `Iterator.concat()` with the helpers introduced earlier (`map`, `filter`, `take`) to build expressive lazy pipelines:

```javascript
const firstFiveEven = Iterator.concat(range(0, 100), range(200, 300))
  .filter((n) => n % 2 === 0)
  .take(5)
  .toArray()

console.log(firstFiveEven) // [0, 2, 4, 6, 8]
```

## Crypto: raw keys and Ed25519 context

The `node:crypto` module picked up two practical additions: support for **raw key formats** and **Ed25519 context strings** for domain separation.

### Importing a raw Ed25519 key

Before, importing a 32-byte raw Ed25519 private key meant wrapping it in PKCS#8 DER yourself, which is the kind of code nobody wants to write or maintain:

```javascript
// Node.js 24 - the PKCS#8 dance
import { createPrivateKey } from 'node:crypto'

const rawSeed = Buffer.from(
  '9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60',
  'hex',
)

// We have to manually prepend the PKCS#8 header for Ed25519
const pkcs8Header = Buffer.from('302e020100300506032b657004220420', 'hex')
const pkcs8 = Buffer.concat([pkcs8Header, rawSeed])

const key = createPrivateKey({ key: pkcs8, format: 'der', type: 'pkcs8' })
console.log(key.asymmetricKeyType) // 'ed25519'
```

In Node.js 26, the same thing is one call:

```javascript
// Node.js 26 - just give it the raw bytes
import { createPrivateKey } from 'node:crypto'

const rawSeed = Buffer.from(
  '9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60',
  'hex',
)

const key = createPrivateKey({ key: rawSeed, format: 'raw', type: 'ed25519' })
console.log(key.asymmetricKeyType) // 'ed25519'
```

The same `format: 'raw'` option is available on `createPublicKey()` and on `generateKeyPair()`'s export options.

### Ed25519 with a context string

Ed25519 signatures now accept an optional context string, which is the standard way to do **domain separation**: the same key can sign in multiple "domains" (login tokens, file uploads, audit logs, etc.) without a signature from one domain being valid in another.

```javascript
// ed25519-context.mjs
import { generateKeyPairSync, sign, verify } from 'node:crypto'

const { privateKey, publicKey } = generateKeyPairSync('ed25519')
const message = Buffer.from('transfer 100 USD')

const loginSig = sign(null, message, { key: privateKey, context: 'login-v1' })
const auditSig = sign(null, message, { key: privateKey, context: 'audit-v1' })

// Each signature only verifies inside its own context
console.log(
  verify(null, message, { key: publicKey, context: 'login-v1' }, loginSig),
) // true
console.log(
  verify(null, message, { key: publicKey, context: 'audit-v1' }, loginSig),
) // false
console.log(
  verify(null, message, { key: publicKey, context: 'audit-v1' }, auditSig),
) // true
```

Before, doing domain separation correctly required hashing the context into the message yourself, with all the protocol pitfalls that implies. Now it is a single option.

## V8 14.6 and Undici 8

Two more under-the-hood updates worth a quick mention:

- **V8 14.6.202.33** (from Chromium 146) is the engine. Beyond the new `Map`, `WeakMap`, and `Iterator` methods covered above, you also benefit from across-the-board JIT and GC improvements.
- **Undici 8.0.2** is the HTTP client that powers the built-in `fetch()`. The bump brings performance and feature improvements with no API change required on your side. If you want to dig into modern HTTP usage, our guide on [making HTTP requests in Node.js](/blog/nodejs-http-request/) is up to date with current best practices.

If you maintain native add-ons, note that **`NODE_MODULE_VERSION` is now 147**, so any prebuilt binaries will need a fresh build for v26.

## Heads-up: breaking changes when upgrading

Node.js 26 cleaned up a long list of legacy APIs. Most apps will not feel any of these, but it is worth scanning the list before you bump the version in CI.

### Stream private modules removed

The undocumented `_stream_readable`, `_stream_writable`, `_stream_duplex`, `_stream_transform`, `_stream_passthrough`, and `_stream_wrap` modules are gone. If your code (or, more likely, a transitive dependency) does this:

```javascript
// no longer works in Node.js 26
import { Readable } from 'node:_stream_readable'
```

switch to the public exports:

```javascript
import { Readable } from 'node:stream'
```

### `http.Server.prototype.writeHeader()` removed

The misnamed alias `writeHeader()` was removed. Use the documented `writeHead()` instead:

```javascript
// before
res.writeHeader(200, { 'Content-Type': 'text/plain' })

// now
res.writeHead(200, { 'Content-Type': 'text/plain' })
```

### `--experimental-transform-types` removed

The flag that enabled TypeScript-style type stripping with on-the-fly transforms is gone. Plain type stripping (`--experimental-strip-types`, on by default for `.ts` files) is still here, but if you relied on enum, namespace, or decorator transforms via the `--experimental-transform-types` flag, you will need a real build step (`tsc`, `tsx`, `swc`, or similar).

### `module.register()` runtime-deprecated

The customization-hooks loader API is now runtime-deprecated. It still works in v26, but you will see a `DeprecationWarning` and it is on the path out. Library authors maintaining custom loaders should track the [Module Customization Hooks](https://nodejs.org/api/module.html#customization-hooks) docs for the replacement story.

### `localStorage` returns `undefined` without a backing file

Browser-style `localStorage` no longer silently keeps in-memory state when the runtime has no persistence file configured. It now returns `undefined`, which is a breaking semantic change for anyone who was relying on the old behavior in tests.

### Platform support

- **Dropped**: Power 8 (AIX/IBM i) and z13.
- **New minimums**: GCC 13.2 to build from source, Windows 11 SDK on Windows.

:::warning[Upgrade checklist]
Before bumping a real project to Node.js 26:

1. Run `pnpm install` (or `npm install`) and rebuild any native add-ons. `NODE_MODULE_VERSION` changed.
2. Search your codebase and `node_modules` for `_stream_` imports and `writeHeader(`.
3. If you use `module.register()` for custom loaders, check whether your loader still works without warnings.
4. If you have a TypeScript-heavy project that relied on `--experimental-transform-types`, switch to a real compiler.
5. Check that all your dependencies have a release that lists Node.js 26 as supported (or at least that they pass their own test suites against it).
   :::

## Should you upgrade today?

Node.js 26 is on the **Current** release line. It enters **LTS in October 2026**.

For new projects, prototypes, and library authors who want to validate compatibility ahead of the LTS handoff: yes, jump in now and enjoy Temporal and the new collection helpers.

For production services on a stable v22 or v24 LTS: there is no rush. Upgrade to v26 when it goes LTS in October, when you have time to roll out the breaking-change checklist above carefully, or when you have a specific feature (Temporal is a strong candidate) that you really want.

:::tip[Want to write modern, production-ready Node.js?]
Our book **Node.js Design Patterns** keeps a tight focus on the patterns that survive every release: streams, async control flow, modules, and scalable architectures. The fundamentals do not change, but seeing them through the lens of modern Node.js makes a real difference.

[Get a FREE chapter →](/#free-chapter)
:::

## Wrapping up

Node.js 26 is a release that pulls a lot of long-running threads into the present: Temporal goes from "behind a flag" to "the recommended way to handle dates", common Map and Iterator patterns finally get first-class methods, and the runtime sheds a layer of legacy. If you only try one thing today, start by replacing a `new Date()` call with a `Temporal.Now.plainDateISO()` and see how much cleaner your date-handling code becomes.

For deeper dives, you might enjoy our pieces on [making HTTP requests in Node.js](/blog/nodejs-http-request/) and on [checking your Node.js version](/blog/checking-node-js-version/).

See you in the next article!

## Frequently Asked Questions

### When was Node.js 26 released?

Node.js 26 was released on May 5, 2026. It enters Long Term Support (LTS) in October 2026, after a six-month period on the "Current" release line.

### Why did Node.js skip version 25?

Node.js jumped from v24 straight to v26 so the major version number aligns with the underlying Chromium release (Chromium 146 / V8 14.6). Expect this even-numbered alignment to continue going forward.

### Is the Temporal API stable in Node.js 26?

Yes. Temporal is enabled by default and considered stable for production use. It is the recommended replacement for the legacy `Date` object when working with dates, times, and time zones.

### Should I upgrade existing projects to Node.js 26?

For production, wait until Node.js 26 enters LTS in October 2026. The Current line is great for new projects, prototypes, and library authors who want to validate compatibility before LTS.

### Are there breaking changes in Node.js 26?

Yes. The private `_stream_*` modules are removed, `http.Server.prototype.writeHeader()` is gone (use `writeHead()`), `--experimental-transform-types` is removed, and `module.register()` is now runtime-deprecated. Most crypto changes only affect advanced key handling.
