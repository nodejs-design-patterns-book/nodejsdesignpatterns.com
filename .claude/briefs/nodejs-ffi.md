# Article Brief: Calling Native Libraries with node:ffi

## Calling Native Libraries from Node.js with `node:ffi`

**Target keyword:** "node js ffi"
**Secondary keywords:** "node:ffi", "nodejs call c library", "ffi-napi alternative", "node js dlopen", "call rust from node js"
**Estimated search volume:** Low today but growing fast (feature shipped May 2026); legacy volume exists from node-ffi/ffi-napi searches, which now lack a maintained answer
**Search intent:** informational / tutorial
**Buyer stage:** implementation (advanced readers, exactly the book's audience)
**Content pillar:** Modern Node.js Features (overlaps with Patterns & Architecture for the thought-leadership angle)

**Why now (strategic rationale):**

- `node:ffi` is experimental as of Node.js 26.1.0 (May 2026, contributed by Paolo Insogna, nodejs/node#62072). Almost nothing ranks for it yet: classic early-mover window, same play as the Node 26 article.
- The legacy `node-ffi`/`ffi-napi` packages are unmaintained but still get searches; "official replacement" content captures that intent.
- Advanced native-interop content differentiates us from tutorial mills and reinforces the book's "serious Node.js" positioning.
- Both searchable (keyword above) and shareable (HN/r/node love FFI + "Node can call C now without addons" is a strong hook).

---

### Outline

1. **Introduction**
   - Problem: calling native code from Node.js has always meant native addons (node-gyp pain, per-Node-version rebuilds) or unmaintained packages (node-ffi, ffi-napi)
   - What node:ffi changes: load a shared library and call it, no compilation step on the Node side
   - Set expectations: experimental, unsafe by design, Node.js 26.1+

2. **Quick Answer** (featured snippet)
   - Minimal `dlopen` example calling `add_i32` from a tiny C library, run with `node --experimental-ffi`
   - Note the `using` keyword for automatic library cleanup (Explicit Resource Management)

3. **When to Use FFI (and When Not To)** ← reuse the honest when/when-not pattern from the env vars article
   - Good fit: pre-built vendor libraries, system libraries, Rust/Zig/C libraries you control, prototyping native integrations
   - Poor fit: anything achievable with built-ins or pure JS; when memory safety matters more than speed (prefer WASM's sandbox); long-term production code while the API is experimental
   - Comparison table: node:ffi vs native addons (N-API) vs WASM vs child process

4. **Getting Started**
   - Write and compile a minimal C library (`cc -shared`), cross-platform with `ffi.suffix` ('so' | 'dylib' | 'dll')
   - Enabling: `--experimental-ffi`, `--allow-ffi` with the Permission Model, NODE_OPTIONS alternative
   - `dlopen(path, definitions)` and the signature object format

5. **The Type System and Marshaling**
   - Supported types: i8–i64/u8–u64, f32/f64, bool, char, string, pointer, buffer, arraybuffer, function, void
   - 64-bit integers and pointers are `bigint`; strings copied to temporary NUL-terminated buffers
   - The string-coercion-style gotchas (e.g., i64 returns bigint, not number)

6. **The `DynamicLibrary` Class**
   - `getFunction` / `getFunctions` / `getSymbol` / `close`
   - Resource management with `using` (forward-reference the future ERM article)

7. **Working with Memory**
   - `getInt*/setInt*`, `toString`, `toBuffer` / `toArrayBuffer` (copy vs view), `exportString/Buffer`, `getRawPointer`
   - Ownership rules: who allocates, who frees

8. **Callbacks: Native Code Calling JavaScript**
   - `registerCallback` / `unregisterCallback`, the restrictions list (same thread, no throw, no promises, lifetime rules)

9. **Real-World Example: Calling a Rust Library**
   - Build a `cdylib` crate, call it from Node.js (sets up the future Rust + Node.js spoke article)

10. **Safety, Security, and Performance**
    - Unsafe by design: crashes, memory corruption, use-after-free; why signatures must be exact
    - Permission Model integration (`--allow-ffi`)
    - Fast FFI path (≤ 8 args) vs generic path; platform limitations (s390x, mips variants, some ppc64)

11. **Best Practices / Common Mistakes**

12. **Related Book Content**
    - Ch. patterns for wrapping unsafe modules behind clean interfaces (adapter/facade)

13. **FAQ Section** (schema markup)
    - What is node:ffi?
    - Is node:ffi production-ready? (experimental, 26.1+, flags)
    - node:ffi vs ffi-napi: which should I use?
    - node:ffi vs native addons (N-API): which is faster / when to pick which?
    - Does node:ffi work with Rust?

14. **Conclusion + free chapter CTA**

---

### Code Examples Checklist

- [ ] Modern ESM syntax, top-level `await` where relevant
- [ ] Every example runnable: include the C/Rust source + compile command
- [ ] Cross-platform library loading via `ffi.suffix`
- [ ] Show the failure mode at least once (wrong signature → crash) in a safe, illustrative way
- [ ] Non-secret env/config examples per house style
- [ ] `using` shown for cleanup, with try/finally fallback for readers not on ERM yet

### Writing Style Checklist

- [ ] No em dashes
- [ ] Problem/context before API details; explain "why" (why FFI is unsafe, why bigint pointers)
- [ ] Honest "when NOT to use" section (house differentiator)
- [ ] Friendly, conversational tone; forward/backward references between sections

### Internal Links

- [ ] [What's new in Node.js 26](/blog/whats-new-in-nodejs-26) (feature context)
- [ ] [Node.js release schedule changes](/blog/nodejs-release-schedule-changes) (experimental → stable path, Current vs LTS)
- [ ] [Environment variables in Node.js](/blog/nodejs-environment-variables) (NODE_OPTIONS to enable flags)
- [ ] [How to check your Node.js version](/blog/checking-node-js-version) (requires 26.1+)
- [ ] Future: Explicit Resource Management article (`using` with dlopen); Rust + Node.js spoke

### SEO Checklist

- [ ] Keyword in title, H1, first paragraph, at least one H2
- [ ] Meta description 150-160 chars with "node js ffi"
- [ ] FAQ schema (5 questions above)
- [ ] External links: nodejs.org/api/ffi.html, v26.1.0 release notes, libffi
- [ ] Internal links to 3+ existing articles

### Frontmatter Template

```yaml
---
date: TBD
updatedAt: TBD
title: Calling Native Libraries from Node.js with node:ffi
slug: nodejs-ffi
description: >-
  Learn how to call C and Rust libraries from Node.js with the experimental
  node:ffi module: dlopen, type marshaling, callbacks, memory, and safety.
authors: ['luciano-mammino']
tags: ['blog']
faq:
  - question: What is node:ffi?
    answer: TBD
  - question: Is node:ffi production-ready?
    answer: TBD
  - question: Should I use node:ffi or ffi-napi?
    answer: TBD
  - question: Should I use node:ffi or a native addon (N-API)?
    answer: TBD
  - question: Can I call Rust code from Node.js with node:ffi?
    answer: TBD
---
```

### Promotion Notes

- Strong HN/r/node hook: "Node.js can now call C libraries without native addons"
- Time-sensitive: publish before the topic gets saturated; revisit and update when node:ffi changes stability level (watch nodejs/node releases)
- Pair with a follow-up "Rust + Node.js via node:ffi" spoke for the niche audience
