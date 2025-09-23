import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import {
  SITE_TITLE,
  SITE_DESCRIPTION,
  SITE_URL,
  BOOK_AUTHORS,
} from '../lib/const'

export const GET: APIRoute = async () => {
  // Get all blog posts, sorted by date (newest first)
  const posts = (await getCollection('blog')).sort(
    (a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime(),
  )

  // Generate RSS XML
  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_TITLE}</title>
    <description>${SITE_DESCRIPTION} - Blog</description>
    <link>${SITE_URL}/blog</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    <language>en-US</language>
    <managingEditor>noreply@nodejsdesignpatterns.com (${BOOK_AUTHORS})</managingEditor>
    <webMaster>noreply@nodejsdesignpatterns.com (${BOOK_AUTHORS})</webMaster>
    <copyright>Copyright ${new Date().getFullYear()} Node.js Design Patterns</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>1440</ttl>
    <image>
      <url>${SITE_URL}/images/og-image.jpg</url>
      <title>${SITE_TITLE}</title>
      <link>${SITE_URL}/blog</link>
    </image>
${posts
  .map((post) => {
    const pubDate = new Date(post.data.date).toUTCString()
    const postUrl = `${SITE_URL}/blog/${post.id}`

    return `    <item>
      <title><![CDATA[${post.data.title}]]></title>
      <description><![CDATA[${post.data.description}]]></description>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>Node.js</category>
      <category>JavaScript</category>
      <category>Design Patterns</category>
${
  post.data.tags
    ?.filter((tag) => tag !== 'blog')
    .map((tag) => `      <category>${tag}</category>`)
    .join('\n') || ''
}
    </item>`
  })
  .join('\n')}
  </channel>
</rss>`

  return new Response(rssXml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=UTF-8',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  })
}
