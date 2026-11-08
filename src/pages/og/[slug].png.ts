import type { APIRoute, GetStaticPaths } from 'astro'
import { getCollection, getEntries, type CollectionEntry } from 'astro:content'
import { renderOgImage } from '@lib/og-image'

// One social share card per blog post, generated at build time:
// /og/<slug>.png
export const getStaticPaths = (async () => {
  const posts = await getCollection('blog')
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }))
}) satisfies GetStaticPaths

export const GET: APIRoute<{ post: CollectionEntry<'blog'> }> = async ({
  props,
}) => {
  const { title, description } = props.post.data
  const authors = await getEntries(props.post.data.authors)
  const png = await renderOgImage({
    title,
    description,
    authors: authors.map((a) => a.data.name),
  })
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png' },
  })
}
