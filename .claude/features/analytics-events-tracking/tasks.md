# Analytics Events Tracking - Implementation Tasks

**Feature**: Analytics Events Tracking for nodejsdesignpatterns.com
**Branch**: `feat/analytics-events-tracking`
**Goal**: Implement comprehensive GA4 event tracking to measure user engagement and conversions

---

## Overview

The site currently has basic GA4 setup (property G-NFE37ZH2W3) via Partytown but lacks custom event tracking. Based on analytics analysis, we need to track:

- Book purchase intent (buy button views + clicks → CTR)
- Free chapter downloads (form views + submissions → conversion rate)
- Blog CTA performance (views + clicks → CTR)
- Outbound link clicks (Amazon, Packt, etc.)
- Blog engagement (scroll depth, read completion)
- Internal navigation patterns

### Tracking Philosophy

For all CTAs, we track both **impressions** (view events via Intersection Observer) and **actions** (click/submit events). This enables calculating click-through rates and conversion rates, not just absolute numbers.

---

## Tasks

### Phase 1: Setup & Infrastructure

#### T001 - Create Analytics Utility Module [P]
**File**: `src/lib/analytics.ts`
**Description**: Create a TypeScript module with type-safe helper functions for sending GA4 events via gtag. Must handle Partytown's async nature.

**Requirements**:
- Export typed `trackEvent()` function that wraps `gtag('event', ...)`
- Handle window.gtag potentially being undefined (Partytown delay)
- Define TypeScript interfaces for all event parameters
- Include event name constants to prevent typos

**Events to support**:
```typescript
type AnalyticsEvent =
  // Conversion events
  | 'view_buy_buttons'
  | 'click_buy_button'
  | 'view_free_chapter_form'
  | 'submit_free_chapter_form'
  // Engagement events
  | 'click_outbound_link'
  | 'scroll_depth'
  | 'blog_read_complete'
  // CTA events (view + click for CTR calculation)
  | 'view_blog_cta'
  | 'click_blog_cta'
```

---

#### T002 - Define Event Schema Documentation [P]
**File**: `src/lib/analytics.ts` (inline JSDoc) or `.claude/features/analytics-events-tracking/events-schema.md`
**Description**: Document all custom events with their parameters for future reference.

**Requirements**:
- Event name
- When it fires
- Parameters and their types
- Expected values

---

### Phase 2: Core Conversion Events

#### T003 - Track Buy Button Views and Clicks
**Files**:
- `src/components/pages/Home/components/BuyButtons.astro`
- `src/components/blog/BookPromo.astro`

**Description**: Track when buy buttons become visible (impression) and when clicked. This enables CTR calculation.

**Event Schema**:
```javascript
// Fired when buttons enter viewport (once per page load)
gtag('event', 'view_buy_buttons', {
  source_page: '/blog/some-article' | '/',
  button_location: 'hero' | 'sidebar' | 'footer' | 'blog_promo'
})

// Fired on click
gtag('event', 'click_buy_button', {
  book_format: 'print' | 'ebook',
  source_page: '/blog/some-article' | '/',
  button_location: 'hero' | 'sidebar' | 'footer' | 'blog_promo'
})
```

**Implementation**:
- Use Intersection Observer to track when buttons enter viewport
- Fire `view_buy_buttons` once per page load when visible
- Add `onclick` handlers for click tracking
- Pass format ('print' or 'ebook') based on button clicked
- Include page path for attribution

**Metrics enabled**:
- Buy button CTR = `click_buy_button` / `view_buy_buttons`
- Format preference = print clicks vs ebook clicks

---

#### T004 - Track Free Chapter Form Views and Submissions
**File**: `src/components/pages/Home/FreeChapter.astro`

**Description**: Track when the free chapter form becomes visible (impression) and when submitted. This enables conversion rate calculation.

**Event Schema**:
```javascript
// Fired when form section enters viewport (once per page load)
gtag('event', 'view_free_chapter_form', {
  form_location: 'homepage_free_chapter_section'
})

// Fired on form submission
gtag('event', 'submit_free_chapter_form', {
  form_location: 'homepage_free_chapter_section'
})
```

**Implementation**:
- Use Intersection Observer to track when form enters viewport
- Fire `view_free_chapter_form` once per page load when visible
- Add `onsubmit` handler to the form
- Fire `submit_free_chapter_form` before form submission (form posts to external Kit.com)
- Consider also tracking form field focus as a micro-conversion

**Metrics enabled**:
- Form conversion rate = `submit_free_chapter_form` / `view_free_chapter_form`

---

#### T005 - Track Outbound Link Clicks
**Files**:
- `src/components/pages/Home/components/BuyButtons.astro`
- `src/components/blog/BookPromo.astro`
- `src/components/Footer.astro`

**Description**: Track clicks on links that leave the site (Amazon, Packt, social profiles, etc.)

**Event Schema**:
```javascript
gtag('event', 'click_outbound_link', {
  link_url: 'https://amazon.com/...',
  link_domain: 'amazon.com',
  link_text: 'Buy print',
  source_page: window.location.pathname
})
```

**Implementation**:
- Can use event delegation at document level
- Filter for links with `href` starting with `http` but not matching site domain
- Extract domain from URL for grouping in reports

---

### Phase 3: Engagement Events

#### T006 - Track Scroll Depth on Blog Posts [P]
**File**: `src/components/blog/BlogLayout.astro` (new script)

**Description**: Track how far users scroll on blog articles (25%, 50%, 75%, 100%)

**Event Schema**:
```javascript
gtag('event', 'scroll_depth', {
  percent_scrolled: 25 | 50 | 75 | 100,
  page_path: '/blog/reading-writing-files-nodejs',
  content_type: 'blog_post'
})
```

**Implementation**:
- Use Intersection Observer for performance
- Only fire each threshold once per page load
- Only implement on blog pages (check route)

---

#### T007 - Track Blog Read Completion [P]
**File**: `src/components/blog/BlogLayout.astro`

**Description**: Fire event when user reaches the end of a blog post (indicates genuine read)

**Event Schema**:
```javascript
gtag('event', 'blog_read_complete', {
  page_path: '/blog/reading-writing-files-nodejs',
  estimated_read_time: 8, // minutes
  time_on_page: 240 // seconds actually spent
})
```

**Implementation**:
- Trigger when user scrolls to article footer or "related posts" section
- Track time spent on page for validation
- Helps identify content quality vs. bounce rate

---

#### T008 - Track Blog CTA Views and Clicks (with Variant Tracking)
**File**: `src/components/blog/BookPromo.astro`

**Description**: Track when the book promo card becomes visible (impression) and when clicked. The component has **10 different variants** (promo01-promo10) with unique images and messages that are randomly selected. We need to track which variant performs best.

**Current variants** (from `BookPromo.astro`):
- `promo01` - "Get the Node.js Design Patterns book. Your playbook to senior-level Node.js."
- `promo02` - "Buy Node.js Design Patterns and master async, streams, and scaling Node.js."
- `promo03` - "Upgrade your Node.js skills: get the book professional developers trust."
- `promo04` - "Join 30,000+ developers. Get the book they use to level up..."
- `promo05` - "The Node.js book with 4.6★ from 780+ reviews. Get your copy."
- `promo06` - "732 pages. 170 examples. 54 exercises..."
- `promo07` - "Stop stitching together half-baked tutorials..."
- `promo08` - "Master all there is to know about Node.js..."
- `promo09` - "Build production-grade Node.js with confidence..."
- `promo10` - "Serious about Node.js? This is the book..."

**Event Schema**:
```javascript
// Fired when promo card enters viewport (once per page load)
gtag('event', 'view_blog_cta', {
  cta_type: 'book_promo_card',
  cta_position: 'sidebar',
  cta_variant: 'promo05', // variant ID for A/B analysis
  page_path: window.location.pathname
})

// Fired on click
gtag('event', 'click_blog_cta', {
  cta_type: 'book_promo_card',
  cta_position: 'sidebar',
  cta_variant: 'promo05', // same variant ID
  page_path: window.location.pathname
})
```

**Implementation**:
- Extract variant ID from the selected promo key (e.g., `promo05` from `/src/images/promo/promo05.png`)
- Pass variant ID to the client via `data-variant` attribute on the promo card
- Use Intersection Observer to track when promo card enters viewport
- Fire `view_blog_cta` once per page load when visible
- Add click handler to track `click_blog_cta`
- Both events must include the same `cta_variant` for accurate CTR calculation

**Metrics enabled**:
- Blog CTA CTR by variant = `click_blog_cta (variant X)` / `view_blog_cta (variant X)`
- Best performing variant identification
- Variant performance by blog post (some messages may resonate better with certain content)

**Future optimization**:
Once we have enough data, we can adjust the random selection to favor higher-performing variants (weighted random selection).

---

### Phase 4: Navigation & Discovery Events

#### T009 - Track Internal Navigation Patterns [P]
**File**: `src/Layout.astro` or new `src/scripts/analytics-navigation.ts`

**Description**: Track navigation between key sections (blog, homepage, chapters)

**Event Schema**:
```javascript
gtag('event', 'internal_navigation', {
  from_page: '/',
  to_page: '/blog',
  navigation_type: 'header_link' | 'footer_link' | 'inline_link'
})
```

**Implementation**:
- Use click event delegation
- Only track internal links (same domain)
- Categorize by navigation location

---

#### T010 - Track Chapter Section Engagement
**File**: `src/components/pages/Home/Chapters.astro`

**Description**: Track when users interact with the chapters accordion/section

**Event Schema**:
```javascript
gtag('event', 'view_chapter_details', {
  chapter_number: 6,
  chapter_title: 'Coding with Streams'
})
```

---

### Phase 5: Testing & Validation

#### T011 - Add GA4 Debug Mode Helper
**File**: `src/lib/analytics.ts`

**Description**: Add development helper to enable GA4 debug mode and log events to console

**Requirements**:
- Check for `?debug_analytics=true` URL param or dev environment
- Log all events to console with formatted output
- Enable GA4 debug mode for DebugView in GA4 interface

---

#### T012 - Create Analytics Test Page (Dev Only)
**File**: `src/pages/dev/analytics-test.astro` (add to .gitignore or protect)

**Description**: Create a test page that triggers all events for validation

**Requirements**:
- Buttons to trigger each event type
- Display console output
- Only accessible in development

---

#### T013 - Validate Events in GA4 DebugView
**Description**: Manual testing task - verify all events appear correctly in GA4

**Checklist**:
- [ ] `view_buy_buttons` fires when buttons enter viewport
- [ ] `click_buy_button` fires with correct format parameter
- [ ] `view_free_chapter_form` fires when form enters viewport
- [ ] `submit_free_chapter_form` fires on form submission
- [ ] `click_outbound_link` captures external links
- [ ] `scroll_depth` fires at correct thresholds (25/50/75/100%)
- [ ] `blog_read_complete` fires at article end
- [ ] `view_blog_cta` fires when promo card enters viewport with correct `cta_variant`
- [ ] `click_blog_cta` fires on promo card click with matching `cta_variant`
- [ ] Variant ID matches between view and click events for the same page load
- [ ] All events have correct page attribution
- [ ] View events only fire once per page load

---

### Phase 6: Documentation & Cleanup

#### T014 - Update README with Analytics Documentation [P]
**File**: `README.md` or `.claude/features/analytics-events-tracking/README.md`

**Description**: Document the analytics implementation for future maintainers

**Include**:
- List of all custom events
- How to add new events
- How to test events
- GA4 property ID and access info

---

#### T015 - Create GA4 Custom Dimensions (Manual)
**Description**: Configure custom dimensions in GA4 admin for richer reporting

**Dimensions to create**:
- `book_format` (event-scoped) - "print" or "ebook"
- `button_location` (event-scoped) - "hero", "sidebar", "footer", "blog_promo"
- `content_type` (event-scoped) - "blog_post", "homepage", etc.
- `cta_variant` (event-scoped) - "promo01" through "promo10" for A/B analysis
- `cta_position` (event-scoped) - "sidebar", "inline", etc.

---

## Parallel Execution Guide

The following tasks can be executed in parallel as they modify different files:

### Parallel Group 1 (Infrastructure)
```
T001 - Analytics Utility Module
T002 - Event Schema Documentation
```

### Parallel Group 2 (Conversion Events)
```
T003 - Buy Button Clicks
T004 - Free Chapter Form
T005 - Outbound Links
```

### Parallel Group 3 (Engagement)
```
T006 - Scroll Depth (blog)
T007 - Read Completion (blog)
T008 - Blog CTA Clicks
```

### Parallel Group 4 (Final)
```
T011 - Debug Mode Helper
T014 - Documentation
```

---

## Dependencies

```
T001 (Analytics Module)
  └── T003, T004, T005, T006, T007, T008, T009, T010 (all event implementations)
       └── T011 (Debug Helper)
            └── T012, T013 (Testing)
                 └── T014, T015 (Documentation)
```

---

## Files Modified Summary

| File | Tasks |
|------|-------|
| `src/lib/analytics.ts` (NEW) | T001, T002, T011 |
| `src/components/pages/Home/components/BuyButtons.astro` | T003, T005 |
| `src/components/blog/BookPromo.astro` | T003, T005, T008 |
| `src/components/pages/Home/FreeChapter.astro` | T004 |
| `src/components/Footer.astro` | T005 |
| `src/components/blog/BlogLayout.astro` | T006, T007 |
| `src/components/pages/Home/Chapters.astro` | T010 |
| `src/Layout.astro` | T009 |

---

## Success Metrics

After implementation, we should be able to answer:

1. **What's the buy button CTR?** (`click_buy_button` / `view_buy_buttons`) and which format is preferred
2. **What's the free chapter form conversion rate?** (`submit_free_chapter_form` / `view_free_chapter_form`)
3. **What's the blog CTA CTR?** (`click_blog_cta` / `view_blog_cta`) and which promo messages perform best
4. **Which blog posts drive the most purchase intent?** (clicks by page_path)
5. **How engaged are blog readers?** (scroll depth distribution, completion rate)
6. **What's the user journey?** (navigation patterns to purchase)

### Example Calculated Metrics

| Metric | Formula |
|--------|---------|
| Buy Button CTR | `click_buy_button` ÷ `view_buy_buttons` |
| Free Chapter Conversion | `submit_free_chapter_form` ÷ `view_free_chapter_form` |
| Blog CTA CTR | `click_blog_cta` ÷ `view_blog_cta` |
| **Blog CTA CTR by Variant** | `click_blog_cta (variant X)` ÷ `view_blog_cta (variant X)` |
| Blog Completion Rate | `blog_read_complete` ÷ `page_view (blog)` |
| Print vs Ebook Preference | `click_buy_button (print)` ÷ `click_buy_button (total)` |

### Variant Performance Analysis

With 10 promo variants tracked, you can build a report like:

| Variant | Views | Clicks | CTR |
|---------|-------|--------|-----|
| promo05 (ratings) | 1,200 | 48 | 4.0% |
| promo04 (social proof) | 1,150 | 41 | 3.6% |
| promo06 (stats) | 980 | 29 | 3.0% |
| ... | ... | ... | ... |

This data can later inform weighted random selection to show higher-performing variants more frequently.
