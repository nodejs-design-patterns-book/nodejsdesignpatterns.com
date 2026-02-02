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
| 2   | NOT STARTED | Environment variables in Node.js | "node js environment variables" | 8,000+      | Core APIs |
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
| 13  | NOT STARTED | Type-stripping in Node.js     | "node js typescript"   | Growing     | Modern    |
| 14  | NOT STARTED | Node.js built-in test runner  | "node js test runner"  | 3,000+      | Modern    |
| 15  | NOT STARTED | Import maps in Node.js        | "node js import maps"  | 1,000+      | Modern    |
| 16  | NOT STARTED | Encrypting files with Node.js | "node js encrypt file" | 1,500+      | Core APIs |

### Month 9-10: Security

| #   | Status   | Article                           | Primary Keyword                   | Est. Volume | Pillar   |
| --- | -------- | --------------------------------- | --------------------------------- | ----------- | -------- |
| 17  | COMPLETE | **Path Traversal Security Guide** | "node js path traversal"          | 1,000+      | Security |
| 18  | NOT STARTED | Input Validation in Node.js    | "node js input validation"        | 2,000+      | Security |
| 19  | NOT STARTED | Secure File Uploads             | "node js secure file upload"      | 1,500+      | Security |
| 20  | NOT STARTED | OWASP Top 10 for Node.js        | "node js security best practices" | 3,000+      | Security |

### Month 11-12: Advanced & Experimental

| #   | Status      | Article                        | Primary Keyword | Notes                 |
| --- | ----------- | ------------------------------ | --------------- | --------------------- |
| 21+ | NOT STARTED | Rust/Zig + Node.js integration | niche           | Thought leadership    |
| 22+ | NOT STARTED | TBD based on analytics         | TBD             | Iterate based on data |

---

## Existing Content

| Topic                    | Coverage | Link                                                     |
| ------------------------ | -------- | -------------------------------------------------------- |
| Reading/writing files    | COMPLETE | /blog/reading-writing-files-nodejs                       |
| Stream consumers         | COMPLETE | /blog/node-js-stream-consumer                            |
| Async iterators          | COMPLETE | /blog/javascript-async-iterators                         |
| Race conditions          | COMPLETE | /blog/node-js-race-conditions                            |
| Path traversal security  | COMPLETE | /blog/nodejs-path-traversal-security                     |
| Checking Node.js version | COMPLETE | /blog/checking-node-js-version                           |
| Installing Node.js       | UPDATED  | /blog/5-ways-to-install-node-js                          |
| Docker development       | COMPLETE | /blog/node-js-development-with-docker-and-docker-compose |

---

## Internal Linking Map

```
HTTP Requests
    └── links to → API Server (no deps)
    └── links to → Reading/Writing Files (existing)

Environment Variables
    └── links to → CLI with parseArgs

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
