import markdownIt from 'markdown-it'
import markdownItAnchor from 'markdown-it-anchor'
import markdownItClass from '@toycode/markdown-it-class'

export default function configureMarkdown (config) {
  // configure markdown
  const mdClassesMapping = {
    h2: ['title', 'is-2'],
    h3: ['title', 'is-3']
  }
  config.setLibrary('md',
    markdownIt({
      html: true,
      linkify: true
    })
      .use(markdownItAnchor)
      .use(markdownItClass, mdClassesMapping)
  )
}
