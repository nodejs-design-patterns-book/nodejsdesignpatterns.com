---
date: 2026-05-10T16:15:00
updatedAt: 2026-05-10T16:15:00
title: What's new in Node.js 26
slug: whats-new-in-nodejs-26
description: Node.js 26 ships the Temporal API by default, Map upsert helpers, Iterator.concat, V8 14.6 and Undici 8. A code-heavy tour with practical examples.
authors: ['luciano-mammino']
tags: ['blog']
faq:
  - question: When was Node.js 26 released?
    answer: Node.js 26 was released on May 5, 2026. It enters Long Term Support (LTS) in October 2026, after a six-month period on the "Current" release line.
  - question: What happened to Node.js 25?
    answer: Node.js 25 was released in October 2025 as a "Current" line release. Per the standard Node.js release cycle, odd-numbered majors do not get LTS and reach end-of-life when the next major ships. v25 was superseded by v26 in May 2026.
  - question: Is the Temporal API stable in Node.js 26?
    answer: Yes. Temporal is enabled by default and considered stable for production use. It is the recommended replacement for the legacy Date object when working with dates, times, and time zones.
  - question: Should I upgrade existing projects to Node.js 26?
    answer: For production, wait until Node.js 26 enters LTS in October 2026. The Current line is great for new projects, prototypes, and library authors who want to validate compatibility before LTS.
  - question: Are there breaking changes in Node.js 26?
    answer: Yes. The private `_stream_*` modules are removed, `http.Server.prototype.writeHeader()` is gone (use `writeHead()`), `--experimental-transform-types` is removed, and `module.register()` is now runtime-deprecated. Most crypto changes only affect advanced key handling.
---

Node.js 26 landed on May 5, 2026. At first glance, this release doesn't look like it's adding a ton, and you'd be forgiven for skimming past it. But look a little closer and the additions are genuinely interesting and useful, the kind of small upgrades that quietly polish your day-to-day development experience.

The big ones: the **Temporal API is stable and enabled by default**, V8 jumped to 14.6 (which brings some genuinely useful new methods), Undici got a major version bump, and a long list of legacy APIs finally retired.

Node.js 26 is on the **Current** release line and will enter LTS in October 2026. If you've been on a v24 LTS deployment for a while, note that v25 was the previous Current release (October 2025) and is now end-of-life as v26 takes over the Current slot, which is the standard cadence for odd-numbered Node.js majors.

In this article we'll tour the highlights, **starting from the coolest, most code-relevant features and moving down to migration concerns**. Every section shows you what the new API looks like and, where useful, what the same code used to look like in older Node.js versions so you can see exactly what these changes unlock.

:::note[Code samples]
Every snippet in this article is also available, ready to run, in the companion repo [`lmammino/nodejs-26-examples`](https://github.com/lmammino/nodejs-26-examples) on GitHub.
:::

## Quick Answer: what's new in Node.js 26

If you only have a minute, here's what matters in Node.js 26:

1. **Temporal is stable**. The modern, immutable, time-zone-aware date API is now a global.
2. **`Map.getOrInsert` and `Map.getOrInsertComputed`** kill the get-or-set boilerplate forever.
3. **`Iterator.concat()`** lets you compose iterators without building intermediate arrays.
4. **Crypto raw-key support** for Ed25519 (plus a handy `context` option on signatures).
5. **V8 14.6 and Undici 8** bring runtime and `fetch()` performance improvements.
6. **Cleanup**: legacy `_stream_*` modules, `writeHeader()`, and `--experimental-transform-types` are gone.

Here's a 4-line teaser of what code in Node.js 26 can look like:

```js title="05-quick-answer/teaser.js"
const tomorrow = Temporal.Now.plainDateISO().add({ days: 1 })
const cache = new Map()
const slug = cache.getOrInsertComputed(42, buildArticleSlug)
console.log(`Refreshing on ${tomorrow}, slug =`, slug)
```

If you haven't upgraded yet, [check your current Node.js version](/blog/checking-node-js-version/) before trying any of the snippets below.

## Temporal API, finally stable

Working with dates in JavaScript has been famously painful. The legacy `Date` object is mutable, months are 0-indexed, time zone behavior depends on the host machine, and parsing is unreliable across implementations. After many years in proposal and a long stay behind a flag, **the Temporal API is enabled by default in Node.js 26** as a top-level global.

Temporal is immutable, type-safe (you cannot accidentally mix a date with a date-and-time), and time-zone-aware by design.

For years I reached for external libraries whenever I had to do anything non-trivial with dates, times, or time zones. Back in the day it was [Moment.js](https://momentjs.com/) (and `moment-timezone` for IANA support), and more recently [Luxon](https://moment.github.io/luxon/) or [date-fns](https://date-fns.org/) for a leaner, immutable-friendly API. They're all genuinely good libraries and they served me well over the years, but I'm always happy to drop a dependency, and you should be too.

It's the same story you might recognise from our guide to [making HTTP requests in Node.js](/blog/nodejs-http-request/): now that the platform ships modern primitives like `fetch()` (and now `Temporal`), the features we used to install from npm keep getting absorbed into the runtime, which is great news for the long-term health of any codebase.

### Today, tomorrow, and a month from now

```js title="01-temporal/temporal-basics.js"
const today = Temporal.Now.plainDateISO()
const tomorrow = today.add({ days: 1 })
const inOneMonth = today.add({ months: 1 })

const lastDayOfMonth = today.with({ day: today.daysInMonth })
// dayOfWeek: Monday=1 ... Sunday=7. Friday=5.
// How many days back from the last day of the month to reach the latest Friday?
const daysToSubtract = (lastDayOfMonth.dayOfWeek - 5 + 7) % 7
const lastFridayOfMonth = lastDayOfMonth.subtract({ days: daysToSubtract })

console.log({
  today: today.toString(),
  tomorrow: tomorrow.toString(),
  inOneMonth: inOneMonth.toString(),
  lastFridayOfMonth: lastFridayOfMonth.toString(),
})
```

Notice how `add({ months: 1 })` does the right thing across month boundaries. If today is January 31, you get February 28 or 29 depending on the year, no manual clamping required.

In Node.js 24 and earlier, the same calculation looked like this and was riddled with footguns:

```js title="01-temporal/temporal-basics-old.js"
// Node.js 24 and earlier, the painful way
const today = new Date('2026-01-31')
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

That `Jan 31 + 1 month = March 3` overflow is a classic bug that Temporal simply doesn't have.

### Time zones that just work

Time zones are where Temporal really shines. `Temporal.ZonedDateTime` carries its IANA time zone with it, so DST transitions, offsets, and conversions all behave correctly without you having to think about UTC offsets.

```js title="01-temporal/temporal-timezones.js"
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

The big win is that arithmetic respects **DST (Daylight Saving Time)**. On a DST transition day, "the same wall-clock time tomorrow" and "exactly 24 hours from now" produce different answers, because the day itself is either 23 or 25 hours long, not 24. With Temporal those are genuinely different operations, and the code has to say which one you actually meant:

```js title="01-temporal/temporal-dst.js"
const before = Temporal.ZonedDateTime.from('2026-03-28T20:00[Europe/Dublin]')

const plus24Hours = before.add({ hours: 24 })
const plus1Day = before.add({ days: 1 })

console.log(`Start:        ${before.toPlainDateTime()}`)
console.log(`+24 hours:    ${plus24Hours.toPlainDateTime()}`) // 2026-03-29T21:00 (DST jump)
console.log(`+1 day:       ${plus1Day.toPlainDateTime()}`) // 2026-03-29T20:00 (calendar day)
```

With the legacy `Date`, this distinction simply didn't exist. Both `setDate(d.getDate() + 1)` and `new Date(d.getTime() + 24 * 3600 * 1000)` were available, but the code couldn't say which of the two behaviours you actually wanted, so you'd reach for whichever happened to work in your time zone at the time and rediscover the bug twice a year. Temporal forces you to spell out what you mean, which is exactly the kind of "the design steers you into the right call" win that makes a release genuinely useful.

I've been bitten by this kind of bug more times than I'd care to admit. If you've ever shipped a "remind me in one day" feature that drifted by an hour twice a year, you know exactly how valuable this distinction is.

### Durations and comparisons

Temporal has dedicated `Temporal.Duration` and `Temporal.Instant` types. You can subtract two dates and get a properly-typed duration, then format it however you want:

```js title="01-temporal/temporal-duration.js"
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

```js title="01-temporal/temporal-sort.js"
const dates = ['2026-12-15', '2026-05-08', '2026-08-01'].map((s) =>
  Temporal.PlainDate.from(s),
)
dates.sort(Temporal.PlainDate.compare)
console.log(dates.map(String))
// [ '2026-05-08', '2026-08-01', '2026-12-15' ]
```

:::note[Migrating from polyfills]
If your codebase already uses the [`@js-temporal/polyfill`](https://www.npmjs.com/package/@js-temporal/polyfill) package, you can now drop the dependency on Node.js 26 and use the global `Temporal` directly. The API surface is identical. Just be aware that if any of your dependencies still relies on this polyfill, you might end up keeping it in your dependency tree anyway. That's actually a great opportunity to reach out to those maintainers and help them transition to the native `Temporal`.
:::

## `Map.getOrInsert` and `getOrInsertComputed`

V8 14.6 brings the new `Map.prototype.getOrInsert()` and `Map.prototype.getOrInsertComputed()` methods (and the same pair on `WeakMap`). These are tiny, but they make a hugely common pattern much cleaner.

### The classic memoization pattern

Every codebase has a function like this somewhere: cache a result keyed by some identifier, compute it lazily, return the cached value next time.

In Node.js 24 and earlier, you would write something like:

```js title="02-map-getorinsert/memoize-old.js"
// Node.js 24 - manual get-or-set, with double lookup
const profileCache = new Map()

function getProfile(id) {
  if (!profileCache.has(id)) {
    profileCache.set(id, computeProfileScore(id))
  }
  return profileCache.get(id)
}
```

That works, but it does two map lookups per call (`has` then `get`), and the `computeProfileScore` reference appears far from the `profileCache.set` call, which makes the intent fuzzy.

In Node.js 26, we can write the same thing as a single, atomic, single-lookup expression:

```js title="02-map-getorinsert/memoize.js"
const profileCache = new Map()

function getProfile(id) {
  return profileCache.getOrInsertComputed(id, computeProfileScore)
}
```

The callback only runs if the key is not already present. Once it runs, its return value is stored and returned, and every subsequent call gets the cached entry.

:::caution[`getOrInsertComputed` is synchronous]
The factory runs immediately and its return value is exactly what gets stored. If the factory returns a Promise (e.g., from an `async` function), the **Promise** is what lives in the Map, not the resolved value. That's sometimes desirable: caching the in-flight Promise lets concurrent callers for the same key share a single async operation instead of each kicking off their own. This is the **Asynchronous Request Batching and Caching** pattern we cover in depth in Chapter 11 of [Node.js Design Patterns](/), a genuinely underused technique that can deliver serious performance gains in services that handle many concurrent requests in production. Just make that choice deliberately rather than assuming the cache "awaits" for you.
:::

A lot of other languages have had this for years (Python's `dict.setdefault` and Rust's `HashMap::entry().or_insert_with(...)`, I'm looking at you!) and every time I bounced between languages I'd think how nice it would be to have this in JavaScript too. Well, now we do, and we get to use it in Node.js too. Hooray!

### Grouping and counting

`getOrInsertComputed` is also great for the "group items by key" pattern, which usually involves the same `if (!map.has(...))` boilerplate:

```js title="02-map-getorinsert/group-orders.js"
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

```js title="02-map-getorinsert/word-counts.js"
const counts = new Map()
for (const word of ['apple', 'banana', 'apple', 'cherry', 'banana', 'apple']) {
  counts.set(word, counts.getOrInsert(word, 0) + 1)
}
console.log(counts) // Map(3) { 'apple' => 3, 'banana' => 2, 'cherry' => 1 }
```

### Per-instance metadata with `WeakMap`

`WeakMap` got the same pair of helpers, which is a big quality-of-life improvement when you attach metadata to objects you do not own:

```js title="02-map-getorinsert/weakmap-metadata.js"
const metadata = new WeakMap()

function tag(obj, key, value) {
  const entry = metadata.getOrInsert(obj, {})
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

```js title="03-iterator-concat/iterator-concat.js"
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

```js title="03-iterator-concat/iterator-concat-old-eager.js"
// Node.js 24 - eager materialization, doubles memory
const combined = [...range(1, 4), ...range(10, 13), ...range(100, 102)]
for (const n of combined) console.log(n)
```

This works, but it eagerly pulls every value from every iterable into memory before you can read the first one. For tiny ranges it doesn't matter, but as soon as you're composing larger or infinite sequences (or remote pages, as we'll see in a moment), materializing everything upfront defeats the point of using iterators in the first place.

Or hand-write a wrapper generator:

```js title="03-iterator-concat/iterator-concat-old-generator.js"
// Node.js 24 - lazy but boilerplate-heavy
function* concat(...iterables) {
  for (const it of iterables) yield* it
}
const combined = concat(range(1, 4), range(10, 13), range(100, 102))
```

That's correct and lazy, but it's boilerplate you write once and then copy-paste forever, and the result is a plain generator that you can't immediately chain helpers (`.map`, `.filter`, `.take`) on without an extra layer.

`Iterator.concat()` is essentially that wrapper baked in, except the result is a proper `Iterator` instance with the standard helpers attached, so you can compose lazy pipelines directly.

### Composing multiple iterables

`Iterator.concat()` shines whenever you have several lazy data sources and want to expose them as a single one. A realistic example is reading lines from multiple log files without concatenating their contents into one giant string first:

```js title="03-iterator-concat/merge-logs.js"
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function* lines(name) {
  for (const line of readFileSync(
    join(import.meta.dirname, name),
    'utf8',
  ).split('\n')) {
    if (line) yield line
  }
}

const allLines = Iterator.concat(
  lines('access.log'),
  lines('error.log'),
  lines('audit.log'),
)

for (const line of allLines) {
  console.log(line)
}
```

The result is a proper `Iterator` instance, so all the standard helpers (`.map`, `.filter`, `.take`, etc.) are available on it (more on that in a moment).

Wondering why we're reading those files **synchronously**? Good question. In real production code you'd much rather stream them (so you don't pre-load each file into memory in one go) or read them concurrently. The example is a little contrived on purpose, because here's the catch: `Iterator.concat()` is **synchronous only**. If you need to combine async iterables (paginated HTTP responses, streams, async cursors, and so on), it won't help you directly. The in-progress TC39 [Async Iterator Helpers](https://github.com/tc39/proposal-async-iterator-helpers) proposal will eventually fill that gap, but until then a one-line helper does the job:

```js
async function* concatAsync(...iterables) {
  for (const it of iterables) yield* it
}
```

For a production-friendlier version of the log-merging example, streaming each file with `node:readline` and stitching them together with `concatAsync`, see [`03-iterator-concat/merge-logs-async.js`](https://github.com/lmammino/nodejs-26-examples/blob/main/03-iterator-concat/merge-logs-async.js) in the companion repo.

But back to `Iterator.concat()`. You can also chain it with the helpers introduced earlier (`map`, `filter`, `take`) to build expressive lazy pipelines:

```js title="03-iterator-concat/lazy-pipeline.js"
const firstFiveEven = Iterator.concat(range(0, 100), range(200, 300))
  .filter((n) => n % 2 === 0)
  .take(5)
  .toArray()

console.log(firstFiveEven) // [0, 2, 4, 6, 8]
```

The `take(5)` is what keeps the pipeline genuinely lazy: only the first five matching values are pulled from the upstream iterators, and the resulting 5-element array is just the convenience landing for `console.log`.

## Crypto: raw Ed25519 keys

This is probably the least exciting addition for most readers, since it's not the kind of code you write every day. Most of us go entire careers without ever touching raw key material directly.

But every so often, you do find yourself down here. The last time I was, it was implementing OIDC token verification, and I can tell you that when you're elbow-deep in signature formats and key encodings, the difference between "the standard library has me covered" and "now I have to pick which of these five lightly-maintained npm crypto packages to trust" is enormous. Crypto is exactly the kind of thing you want from the platform itself, not from a transitive dependency you're hoping is still being looked after.

So while these updates are niche, they're exactly the kind of additions I'm always glad to see land in the runtime. The main one is support for **raw key formats**, which removes a lot of incidental ceremony around working with Ed25519 keys directly.

### Importing a raw Ed25519 key

Before, importing a 32-byte raw Ed25519 private key meant wrapping it in PKCS#8 DER yourself, which is the kind of code nobody wants to write or maintain:

```js title="04-crypto/ed25519-raw-key-old.js"
// Node.js 24 - the PKCS#8 dance
import { createPrivateKey } from 'node:crypto'

// RFC 8032 test vector — not a real key. Never reuse this seed.
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

```js title="04-crypto/ed25519-raw-key.js"
// Node.js 26 - just give it the raw bytes
import { createPrivateKey } from 'node:crypto'

// RFC 8032 test vector — not a real key. Never reuse this seed.
const rawSeed = Buffer.from(
  '9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60',
  'hex',
)

const key = createPrivateKey({
  key: rawSeed,
  format: 'raw-private',
  asymmetricKeyType: 'ed25519',
})
console.log(key.asymmetricKeyType) // 'ed25519'
```

The same family of `'raw-private'` / `'raw-public'` formats is available on `createPublicKey()` and on `generateKeyPair()`'s export options.

On a related note, `sign()` and `verify()` now also accept an optional **`context`** option for Ed25519: a short string that differentiates signatures generated for different purposes with the same key, without having to design that domain-separation in by hand.

## V8 14.6 and Undici 8

Beyond these focused additions, two big version bumps under the hood are worth a quick mention:

- **V8 14.6.202.33** (from Chromium 146) is the engine. Beyond the new `Map`, `WeakMap`, and `Iterator` methods covered above, you also benefit from across-the-board JIT and GC improvements, which means you may see some performance gains in your apps simply by upgrading to Node.js 26.
- **Undici 8.0.2** is the HTTP client that powers the built-in `fetch()`. The bump brings performance and feature improvements with no API change required on your side. If you want to dig into modern HTTP usage, our guide on [making HTTP requests in Node.js](/blog/nodejs-http-request/) is up to date with current best practices.

If you maintain native add-ons, note that **`NODE_MODULE_VERSION` is now 147**, so any prebuilt binaries will need a fresh build for v26.

## Heads-up: Node.js 26 breaking changes

Node.js 26 cleaned up a long list of legacy APIs. Most apps won't feel any of these, but it's worth scanning the list before you bump the version in CI. If you're upgrading, the things to grep for in your codebase are `_stream_`, `writeHeader(`, `module.register(`, and `--experimental-transform-types`.

### Stream private modules removed

The undocumented `_stream_readable`, `_stream_writable`, `_stream_duplex`, `_stream_transform`, `_stream_passthrough`, and `_stream_wrap` modules are gone. If your code (or, more likely, a transitive dependency) does something like this:

```javascript
// no longer works in Node.js 26
import { Readable } from 'node:_stream_readable'
// or
import { Readable } from '_stream_readable'
```

switch to the public exports:

```javascript
import { Readable } from 'node:stream'
```

If you ever reached for those private modules to roll your own stream utilities, take a look at the public [`stream/consumers` helpers](/blog/node-js-stream-consumer/) instead. They cover most common cases (reading a stream as text, JSON, or `Buffer`) without any boilerplate.

### `http.Server.prototype.writeHeader()` removed

The misnamed alias `writeHeader()` was removed. Use the documented `writeHead()` instead:

```javascript
// before
res.writeHeader(200, { 'Content-Type': 'text/plain' })

// now
res.writeHead(200, { 'Content-Type': 'text/plain' })
```

### `--experimental-transform-types` removed

The flag that enabled TypeScript-style type stripping with on-the-fly transforms is gone. Plain type stripping (`--experimental-strip-types`) was already the default for `.ts` files back in Node.js 24, so if you only needed type stripping, dropping `--experimental-transform-types` is a no-op for you. If you relied on enum, namespace, or decorator transforms, you'll need a real build step (`tsc`, `tsx`, `swc`, or similar).

### `module.register()` runtime-deprecated

The customization-hooks loader API is now runtime-deprecated. It still works in v26, but you'll see a `DeprecationWarning` and it's on the path out. Library authors maintaining custom loaders should track the [Module Customization Hooks](https://nodejs.org/api/module.html#customization-hooks) docs for the replacement story.

### `localStorage` returns `undefined` without a backing file

Browser-style `localStorage` no longer silently keeps in-memory state when the runtime has no persistence file configured. It now returns `undefined`, which is a breaking semantic change for anyone who was relying on the old behavior in tests.

### Platform support

- **Dropped**: Power 8 (AIX/IBM i) and z13.
- **New minimums**: GCC 13.2 to build from source, Windows 11 SDK on Windows.
- **Build tooling**: Python 3.9 is no longer supported for building Node.js from source. Use Python 3.10 or newer.

:::warning[Upgrade checklist]
Before bumping a real project to Node.js 26:

1. Run `pnpm install` (or `npm install`) and rebuild any native add-ons. `NODE_MODULE_VERSION` changed.
2. Search your codebase and `node_modules` for `_stream_` imports and `writeHeader(`.
3. If you use `module.register()` for custom loaders, check whether your loader still works without warnings.
4. If you have a TypeScript-heavy project that relied on `--experimental-transform-types`, switch to a real compiler.
5. Check that all your dependencies have a release that lists Node.js 26 as supported (or at least that they pass their own test suites against it).
   :::

## Should you upgrade to Node.js 26 today?

Node.js 26 is on the **Current** release line. It enters **LTS in October 2026**.

For new projects, prototypes, and library authors who want to validate compatibility ahead of the LTS handoff: yes, jump in now and enjoy Temporal and the new collection helpers.

For production services on a stable v22 or v24 LTS: there's no rush. Upgrade to v26 when it goes LTS in October, when you have time to roll out the breaking-change checklist above carefully, or when you have a specific feature (Temporal is a strong candidate) that you really want.

If and when you do upgrade, our guide on [installing (and updating) Node.js](/blog/5-ways-to-install-node-js/) covers the smoothest paths, from `fnm` and `nvm` to the official installer.

:::tip[Want to write modern, production-ready Node.js?]
Our book **Node.js Design Patterns** keeps a tight focus on the patterns that survive every release: streams, async control flow, modules, and scalable architectures. The fundamentals don't change, but seeing them through the lens of modern Node.js makes a real difference.

[Get a FREE chapter →](/#free-chapter)
:::

## Wrapping up

Node.js 26 is a release that pulls a lot of long-running threads into the present: Temporal goes from "behind a flag" to "the recommended way to handle dates", common Map and Iterator patterns finally get first-class methods, and the runtime sheds a layer of legacy. If you only try one thing today, start by replacing a `new Date()` call with a `Temporal.Now.plainDateISO()` and see how much cleaner your date-handling code becomes.

For the full list of changes, including the lower-level details we didn't cover here, the [official Node.js 26.0.0 release announcement](https://nodejs.org/en/blog/release/v26.0.0) is the canonical reference.

For deeper dives, you might also enjoy our pieces on [making HTTP requests in Node.js](/blog/nodejs-http-request/) and on [checking your Node.js version](/blog/checking-node-js-version/).

And one last thing: a massive thank you to the Node.js team and every contributor out there. Year after year, you keep shipping thoughtful, polished releases that make Node.js the best JavaScript runtime around. v26 is no exception, so thank you for yet another excellent one. 😉

See you in the next article!

## Frequently Asked Questions

### When was Node.js 26 released?

Node.js 26 was released on May 5, 2026. It enters Long Term Support (LTS) in October 2026, after a six-month period on the "Current" release line.

### What happened to Node.js 25?

Node.js 25 was released in October 2025 as a "Current" line release. Per the standard Node.js release cycle, odd-numbered majors do not get LTS and reach end-of-life when the next major ships. v25 was superseded by v26 in May 2026.

### Is the Temporal API stable in Node.js 26?

Yes. Temporal is enabled by default and considered stable for production use. It is the recommended replacement for the legacy `Date` object when working with dates, times, and time zones.

### Should I upgrade existing projects to Node.js 26?

For production, wait until Node.js 26 enters LTS in October 2026. The Current line is great for new projects, prototypes, and library authors who want to validate compatibility before LTS.

### Are there breaking changes in Node.js 26?

Yes. The private `_stream_*` modules are removed, `http.Server.prototype.writeHeader()` is gone (use `writeHead()`), `--experimental-transform-types` is removed, and `module.register()` is now runtime-deprecated. Most crypto changes only affect advanced key handling.
