# Content Calendar - Node.js Design Patterns Blog

**Publishing cadence:** 2 articles/month
**Primary goal:** SEO traffic → Build authority → Drive book sales
**Content approach:** Original content with light book excerpts

---

## Content Pillars

1. **Node.js Core APIs & Built-ins** - High-volume foundational topics
2. **Modern Node.js Features** - New capabilities (22+, 23+) with early-mover SEO advantage
3. **Node.js Patterns & Architecture** - Advanced patterns (light connection to book)
4. **Node.js Security** - Security best practices and vulnerability prevention

---

## 12-Month Calendar

### Month 1-2: Foundation

| #   | Status      | Article                          | Primary Keyword                 | Est. Volume | Pillar    |
| --- | ----------- | -------------------------------- | ------------------------------- | ----------- | --------- |
| 1   | COMPLETE    | **HTTP request in Node.js**      | "node js http request"          | 15,000+     | Core APIs |
| 2   | COMPLETE    | **Environment variables in Node.js** | "node js environment variables" | 8,000+      | Core APIs |
| 3   | NOT STARTED | Using Node.js built-in SQLite    | "node js sqlite"                | 5,000+      | Modern    |
| 4   | NOT STARTED | Writing a CLI with Node.js       | "node js cli"                   | 4,000+      | Core APIs |

### Month 3-4: Core APIs

| #   | Status      | Article                         | Primary Keyword       | Est. Volume | Pillar    |
| --- | ----------- | ------------------------------- | --------------------- | ----------- | --------- |
| 5   | NOT STARTED | API server in Node.js (no deps) | "node js http server" | 6,000+      | Core APIs |
| 6   | NOT STARTED | Hashing files with Node.js      | "node js hash file"   | 2,000+      | Core APIs |
| 7   | NOT STARTED | Base64 encode/decode            | "base64 node js"      | 3,000+      | Core APIs |
| 8   | NOT STARTED | Files and paths (node:path)     | "node js path"        | 4,000+      | Core APIs |

### Month 5-6: Patterns (Book-Adjacent)

| #   | Status      | Article                     | Primary Keyword         | Est. Volume | Pillar    |
| --- | ----------- | --------------------------- | ----------------------- | ----------- | --------- |
| 9   | NOT STARTED | Node.js Event Emitter guide | "node js event emitter" | 6,000+      | Patterns  |
| 10  | NOT STARTED | Interactive streams guide   | "node js streams"       | 10,000+     | Patterns  |
| 11  | NOT STARTED | How CommonJS works          | "commonjs node js"      | 3,000+      | Patterns  |
| 12  | NOT STARTED | Node.js console tips        | "node js console"       | 2,000+      | Core APIs |

### Month 7-8: Modern Node.js

| #   | Status      | Article                       | Primary Keyword        | Est. Volume | Pillar    |
| --- | ----------- | ----------------------------- | ---------------------- | ----------- | --------- |
| 13  | NOT STARTED | Type-stripping in Node.js     | "node js typescript"       | Growing     | Modern    |
| 14  | NOT STARTED | Node.js built-in test runner  | "node js test runner"      | 3,000+      | Modern    |
| 15  | NOT STARTED | Import maps in Node.js        | "node js import maps"      | 1,000+      | Modern    |
| 15b | NOT STARTED | Explicit Resource Management (`using` and `await using`) | "javascript using keyword" | Growing (2,000+) | Modern |
| 16  | NOT STARTED | Encrypting files with Node.js | "node js encrypt file"     | 1,500+      | Core APIs |

### Month 9-10: Security

| #   | Status   | Article                           | Primary Keyword                   | Est. Volume | Pillar   |
| --- | -------- | --------------------------------- | --------------------------------- | ----------- | -------- |
| 17  | COMPLETE | **Path Traversal Security Guide** | "node js path traversal"          | 1,000+      | Security |
| 18  | NOT STARTED | Input Validation in Node.js    | "node js input validation"        | 2,000+      | Security |
| 19  | NOT STARTED | Secure File Uploads             | "node js secure file upload"      | 1,500+      | Security |
| 20  | NOT STARTED | OWASP Top 10 for Node.js        | "node js security best practices" | 3,000+      | Security |

### Month 11-12: Advanced & Experimental

| #   | Status      | Article                                  | Primary Keyword | Notes                                                                      |
| --- | ----------- | ---------------------------------------- | --------------- | -------------------------------------------------------------------------- |
| 21  | PLANNED     | Calling native libraries with `node:ffi` | "node js ffi"   | Early mover: experimental since 26.1 (May 2026). Brief: .claude/briefs/nodejs-ffi.md. Pull forward to Jul/Aug 2026 |
| 22  | NOT STARTED | Rust + Node.js via node:ffi (spoke)      | "rust node js"  | Thought-leadership follow-up to #21                                         |
| 23+ | NOT STARTED | TBD based on analytics                   | TBD             | Iterate based on data                                                       |

---

## Existing Content

| Topic                    | Coverage | Link                                                     |
| ------------------------ | -------- | -------------------------------------------------------- |
| Environment variables    | COMPLETE | /blog/nodejs-environment-variables                       |
| What's new in Node.js 26 | COMPLETE | /blog/whats-new-in-nodejs-26                             |
| Release schedule changes | COMPLETE | /blog/nodejs-release-schedule-changes                    |
| Reading/writing files    | COMPLETE | /blog/reading-writing-files-nodejs                       |
| Stream consumers         | COMPLETE | /blog/node-js-stream-consumer                            |
| Async iterators          | COMPLETE | /blog/javascript-async-iterators                         |
| Race conditions          | COMPLETE | /blog/node-js-race-conditions                            |
| Path traversal security  | COMPLETE | /blog/nodejs-path-traversal-security                     |
| Checking Node.js version | COMPLETE | /blog/checking-node-js-version                           |
| Installing Node.js       | UPDATED  | /blog/5-ways-to-install-node-js                          |
| Docker development       | COMPLETE | /blog/node-js-development-with-docker-and-docker-compose |
| What's new in Node.js 26 | NEW      | /blog/whats-new-in-nodejs-26                             |
| Node.js release schedule changes | NEW | /blog/nodejs-release-schedule-changes               |

---

## Internal Linking Map

```
HTTP Requests
    └── links to → API Server (no deps)
    └── links to → Reading/Writing Files (existing)

Environment Variables (COMPLETE)
    └── links to → 5 Ways to Install Node.js (existing)
    └── links to → Docker development (existing)
    └── links to → Checking Node.js version (existing)
    └── links to → HTTP Requests (existing)
    └── links to → Reading/Writing Files (existing)
    └── links to → Path Traversal Security (existing)
    └── links to → CLI with parseArgs (future: add link once published)
    └── linked from → HTTP Requests, Docker development

Files & Paths
    └── links to → Reading/Writing Files (existing)
    └── links to → Hashing Files
    └── links to → Path Traversal Security (existing)
    └── links to → Encrypting Files

Streams Guide
    └── links to → Stream Consumer (existing)
    └── links to → Async Iterators (existing)
    └── links to → Reading/Writing Files (existing)

Event Emitter
    └── links to → Streams Guide
    └── links to → Race Conditions (existing)

Installing Node.js
    └── links to → Checking Node.js version (existing)
    └── links to → Docker development (existing)

Path Traversal Security (NEW)
    └── links to → Reading/Writing Files (existing)
    └── links to → Race Conditions (existing)
    └── links to → 5 Ways to Install Node.js (existing)
    └── links to → Input Validation (future)
    └── links to → Secure File Uploads (future)
    └── links to → OWASP Top 10 for Node.js (future)

Explicit Resource Management (using/await using)
    └── links to → Reading/Writing Files (existing)
    └── links to → Stream Consumer (existing)
    └── links to → Async Iterators (existing)
    └── links to → Event Emitter (future)

What's new in Node.js 26 (NEW)
    └── links to → Checking Node.js version (existing) — intro + related reading
    └── links to → HTTP Requests (existing) — Temporal/dependency-drop callback, V8/Undici section, related reading
    └── links to → Async Iterators (existing) — Iterator.concat / paginated example
    └── links to → Stream Consumer (existing) — _stream_* breaking-changes section
    └── links to → 5 Ways to Install Node.js (existing) — "Should you upgrade?" section
    └── companion repo: github.com/lmammino/nodejs-26-examples (every snippet runnable)
    └── inbound opportunities → Async Iterators, HTTP Requests, Stream Consumer, Checking Node.js version
       (each could mention the relevant v26 update with a link back)
    └── links to → Node.js release schedule changes (NEW) — "Node.js 26 is the last release of the old model" note

Node.js release schedule changes (NEW)
    └── links to → Installing Node.js (existing) — old odd/even model reference
    └── links to → Checking Node.js version (existing) — how to check your version + LTS advice
    └── links to → What's new in Node.js 26 (existing) — "what ships inside the releases" companion
    └── inbound update notes ← Checking Node.js version, Installing Node.js, What's new in Node.js 26
       (each carries a :::note pointing here, since their odd/even explanations are now superseded)
    └── evergreen hub for "node js release schedule" / "node js lts" / "node js versioning" queries

node:ffi (planned, #21)
    └── links to → What's new in Node.js 26 (existing)
    └── links to → Release schedule changes (existing; experimental → LTS context)
    └── links to → Environment Variables (existing; NODE_OPTIONS to enable flags)
    └── links to → Checking Node.js version (existing; requires 26.1+)
    └── links to → Explicit Resource Management (future; `using` with dlopen)
    └── spoke → Rust + Node.js via node:ffi (#22)

Security Cluster (future)
    └── Path Traversal Security (hub for file security)
    └── Input Validation
    └── Secure File Uploads
    └── OWASP Top 10 for Node.js (potential hub)
```

---

## Quick Wins Checklist

- [x] Add FAQ schema support to blog layout
- [x] Update "5 Ways to Install Node.js" with fnm, Volta, Docker
- [x] Cross-link existing articles
- [x] Add CTAs for free chapter download to all posts
- [x] Publish path traversal security article (new security pillar)
- [x] Add link to path traversal article from Reading/Writing Files guide
- [x] Publish environment variables article (Core APIs pillar, #2)
- [x] Cross-link env vars article (HTTP Requests and Docker guides link to it; it links out to 6 existing articles)
- [ ] Promote env vars article (r/node, dev.to, newsletter); the "when NOT to use env vars for secrets" angle is a good hook. Drafts ready: .claude/social/nodejs-environment-variables.md (X thread + 4 standalone posts, 2 LinkedIn posts, Bluesky/Mastodon, r/node, dev.to plan, newsletter blurb, schedule)
- [ ] Monitor keyword rankings for existing content
- [ ] A/B test CTA placements
- [ ] Promote path traversal article on security forums (r/netsec, HN)

---

## Notes

- Focus on zero-dependency approaches using modern Node.js built-ins
- Most competing articles still recommend axios/got first - opportunity to differentiate
- New Node.js features (22+, 23+) have early-mover advantage
- Light book excerpts where relevant (Ch 6 streams, Ch 10 testing)
- **Security content** differentiates us from typical tutorial sites and builds trust/authority
- Path traversal article targets developers building file servers, image handlers, and upload systems
- Security topics have strong CVE/news hooks for promotion and backlinks
- `using`/`await using` (Explicit Resource Management) is TC39 Stage 3, in Node.js 20.4+.
  Most coverage is TypeScript-focused — opportunity for a Node.js-specific deep dive that
  ties naturally to the design patterns theme
- **Next up (as of Jul 2026)**: pair "Writing a CLI with Node.js" (#4) with the new
  `node:ffi` article (#21) for Jul/Aug, then SQLite (#3). Rationale: the CLI article closes
  the Foundation batch and the env vars article reserves a link to it; the FFI article is
  time-sensitive (experimental since 26.1, May 2026), and early-mover windows on new Node.js
  features close fast, as competitors catch up. SQLite has stable volume and can wait a cycle.
- **node:ffi cluster**: article #21 (brief at .claude/briefs/nodejs-ffi.md) also creates the
  anchor for the Explicit Resource Management article (15b): the FFI docs use `using` with
  dlopen, so publishing FFI first gives ERM a concrete in-house example to link to. The Rust
  spoke (#22) follows once #21 has traction. Watch nodejs/node releases for node:ffi
  stability changes and update the article when it graduates from experimental.
- Off-calendar wins: "What's new in Node.js 26" and "Release schedule changes" (May/Jun 2026)
  cover the Modern Node.js pillar ahead of schedule and give every future article a
  version-context page to link to. Consider linking env vars article from future "What's new"
  posts when env-related flags change (e.g., --env-file updates).
- Env vars article angle worth reusing: honest "when NOT to use X" sections differentiate us
  from tutorial mills and build trust; apply the same treatment to SQLite (vs a real DB
  server) and the CLI article (parseArgs vs commander/yargs).
- **Node.js major-release announcements** (the v26 article) make a strong recurring slot:
  evergreen-but-timely SEO around release time ("what's new in Node.js X" queries), and
  they double as a hub linking back to evergreen guides (HTTP, async iterators, streams,
  install). Companion GitHub repo with runnable snippets is a strong differentiator.
  NOTE: from the 2026 release-schedule change, there is now **one major a year** (every
  April, LTS in October), so plan one "what's new" article per year, not two. Next: v27
  in April 2027.
- **Node.js release-policy / schedule changes** are a second, distinct recurring hook:
  the release-schedule-change article (June 2026) shows that policy news (not just feature
  news) ranks well and ages into an evergreen reference. It targets "node js release
  schedule" / "node js lts" / "node js versioning" and acts as the canonical explainer the
  evergreen guides (install, checking-version) can point to whenever the model shifts.
  Revisit whenever the official schedule changes again.
