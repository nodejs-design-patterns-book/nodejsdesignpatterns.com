# Publishing: What's new in Node.js 27

Article: `src/content/blog/whats-new-in-nodejs-27/index.md`
PR: https://github.com/nodejs-design-patterns-book/nodejsdesignpatterns.com/pull/42
Companion: https://github.com/lmammino/nodejs-27-examples
Target publication date: 7 November 2026. If publication slips, update both `date` and `updatedAt` before merging.

## Completed

- [x] Audit release claims against official sources and correct verified inaccuracies.
- [x] Run all 20 JavaScript examples on Node.js 27 alpha, including the chat integration checks.
- [x] Verify all 18 named article samples match the companion files exactly; push companion changes.
- [x] Add the TCP chat screenshot and accessible alt text.
- [x] Humanize the prose without changing code, links, metadata, or FAQ answers.
- [x] Verify FAQ parity, internal links, formatting, and the production build.
- [x] Set publication and update timestamps to 7 November 2026.

## Before publication

- [x] Review the rendered article on desktop and mobile, especially long code blocks, the chat screenshot, admonitions, and the free-chapter CTA.
- [x] Review the search/social preview. The description is 148 characters; correct blog Open Graph metadata from `book` to `article`.
- [x] Refresh PR #42's description with the final TCP chat example, qualified performance claims, and validation evidence.
- [x] Close the three rejected review threads with verified explanations (abort behavior, zip padding, and mkstemp return shape). All 12 review threads are resolved.
- [ ] Confirm the latest PR commit passes CI: lint, repository formatting, typecheck, and build. Address any failures before merging.
- [ ] Merge PR #42 into `main` when ready to publish. The push to `main` triggers the GitHub Pages deployment.

## After publication

- [ ] Confirm the GitHub Pages deployment succeeds and the article loads at https://nodejsdesignpatterns.com/blog/whats-new-in-nodejs-27/.
- [ ] Verify the live publication date, screenshot, code blocks, companion link, and free-chapter CTA. Check the blog index, RSS feed, sitemap, and structured data include the article.
- [ ] Mark the article published in `.claude/content-calendar.md` and add relevant incoming links from existing posts.
- [ ] Prepare and approve announcement copy for the channels you want to use, then share the live URL.

## Later follow-up

- [ ] When article #15b (Explicit Resource Management) is published, replace the temporary MDN link in the VFS disposal note and add the reciprocal link recorded in the content calendar.
- [ ] Revisit the article as Node.js 27 progresses through Alpha, Current in April 2027, and LTS in October 2027.
