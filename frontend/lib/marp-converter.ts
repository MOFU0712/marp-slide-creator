import type { Figure, Project, Slide, SlideContent } from '@/types'
import { generateFigureSvg } from './figure-svg'

/**
 * Convert a Project to Marp Markdown format
 */
export function toMarpMarkdown(project: Project): string {
  const header = buildHeader(project.themeCSS)
  const pages = project.slides
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((slide) => buildSlidePage(slide))
  // Header ends with ---, first page follows directly
  // Subsequent pages are separated by ---
  if (pages.length === 0) {
    return header
  }
  const [firstPage, ...restPages] = pages
  const firstSection = `${header}\n\n${firstPage}`
  if (restPages.length === 0) {
    return firstSection
  }
  return [firstSection, ...restPages].join('\n\n---\n\n')
}

/**
 * Build Marp header with theme CSS
 */
function buildHeader(css: string): string {
  const indentedCss = css
    .split('\n')
    .map((line) => '  ' + line)
    .join('\n')
  return `---
marp: true
style: |
${indentedCss}
---`
}

/**
 * Build a single slide page
 */
function buildSlidePage(slide: Slide): string {
  const parts: string[] = []

  // Add slide class if needed
  if (slide.layout === 'divider') {
    parts.push('<!-- _class: divider -->')
  } else if (slide.layout === 'title-only') {
    parts.push('<!-- _class: title-only -->')
  }

  // Add slide content
  const text = buildSlideText(slide.content)
  parts.push(text)

  // Add figure if present
  if (slide.figure) {
    const svg = buildFigureSvg(slide.figure)
    if (svg) {
      parts.push(svg)
    }
  }

  // Add speaker note if present
  if (slide.speakerNote) {
    parts.push(`\n<!-- ${slide.speakerNote} -->`)
  }

  return parts.filter(Boolean).join('\n\n')
}

/**
 * Build slide text content based on layout
 */
function buildSlideText(content: SlideContent): string {
  switch (content.layout) {
    case 'title-bullets':
      return buildTitleBullets(content.title, content.bullets)
    case 'title-figure':
      return buildTitleFigure(content.title, content.caption)
    case 'two-column':
      return buildTwoColumn(content.title, content.left, content.right)
    case 'divider':
      return buildDivider(content.title, content.subtitle)
    case 'title-only':
      return `# ${content.title}`
    default:
      return `# ${(content as { title: string }).title}`
  }
}

function buildTitleBullets(title: string, bullets: string[]): string {
  const bulletList = bullets
    .filter((b) => b.trim())
    .map((b) => `- ${b}`)
    .join('\n')
  return `# ${title}\n\n${bulletList}`
}

function buildTitleFigure(title: string, caption?: string): string {
  const parts = [`# ${title}`]
  if (caption) {
    parts.push(`\n<p class="caption">${caption}</p>`)
  }
  return parts.join('\n')
}

function buildTwoColumn(
  title: string,
  left: string[],
  right: string[]
): string {
  const leftBullets = left
    .filter((b) => b.trim())
    .map((b) => `- ${b}`)
    .join('\n')
  const rightBullets = right
    .filter((b) => b.trim())
    .map((b) => `- ${b}`)
    .join('\n')

  return `# ${title}

<div class="columns">
<div>

${leftBullets}

</div>
<div>

${rightBullets}

</div>
</div>`
}

function buildDivider(title: string, subtitle?: string): string {
  return subtitle ? `# ${title}\n\n${subtitle}` : `# ${title}`
}

/**
 * Build SVG from figure parameters
 */
function buildFigureSvg(figure: Figure): string {
  return generateFigureSvg(figure)
}

/**
 * Convert a single slide to Marp Markdown (for preview)
 */
export function slideToMarpMarkdown(
  slide: Slide,
  themeCSS: string
): string {
  const header = buildHeader(themeCSS)
  const page = buildSlidePage(slide)
  // Header ends with ---, which closes the frontmatter and starts the first slide
  // No additional --- needed here
  return `${header}\n\n${page}`
}

/**
 * Parse Marp Markdown back to slides (basic implementation)
 * This is used for importing existing Marp files
 */
export function parseMarpMarkdown(markdown: string): {
  themeCSS: string
  slides: Partial<Slide>[]
} {
  const sections = markdown.split(/\n---\n/)
  const header = sections[0] || ''
  const pages = sections.slice(1)

  // Extract theme CSS from header
  const styleMatch = header.match(/style:\s*\|\n([\s\S]*?)(?=\n---|\n\w|$)/)
  const themeCSS = styleMatch
    ? styleMatch[1]
        .split('\n')
        .map((line) => line.replace(/^ {2}/, ''))
        .join('\n')
        .trim()
    : ''

  // Parse each page
  const slides: Partial<Slide>[] = pages.map((page, index) => {
    const trimmed = page.trim()
    const titleMatch = trimmed.match(/^#\s+(.+)$/m)
    const title = titleMatch ? titleMatch[1] : ''

    return {
      orderIndex: index,
      layout: 'title-bullets' as const,
      content: {
        layout: 'title-bullets' as const,
        title,
        bullets: [''],
      },
    }
  })

  return { themeCSS, slides }
}
