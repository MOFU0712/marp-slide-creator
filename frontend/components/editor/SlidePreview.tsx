'use client'

import { useProjectStore } from '@/stores/project-store'
import { useUiStore } from '@/stores/ui-store'
import { slideToMarpMarkdown } from '@/lib/marp-converter'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// Marp default slide dimensions
const SLIDE_WIDTH = 1280
const SLIDE_HEIGHT = 720

export function SlidePreview() {
  const project = useProjectStore((state) => state.project)
  const currentSlideIndex = useUiStore((state) => state.currentSlideIndex)
  const containerRef = useRef<HTMLDivElement>(null)
  const [html, setHtml] = useState<string>('')
  const [scale, setScale] = useState(1)

  const currentSlide = useMemo(() => {
    if (!project) return null
    const sortedSlides = [...project.slides].sort((a, b) => a.orderIndex - b.orderIndex)
    return sortedSlides[currentSlideIndex] || null
  }, [project, currentSlideIndex])

  // Separate key to track when slide changes
  const slideKey = currentSlide ? `${currentSlide.id}-${JSON.stringify(currentSlide.content)}` : null

  // Calculate scale based on container size
  const updateScale = useCallback(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth
      const containerHeight = containerRef.current.clientHeight
      const scaleX = containerWidth / SLIDE_WIDTH
      const scaleY = containerHeight / SLIDE_HEIGHT
      setScale(Math.min(scaleX, scaleY, 1))
    }
  }, [])

  useEffect(() => {
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [updateScale])

  useEffect(() => {
    // Don't render if no slide
    if (!currentSlide || !project) {
      return
    }

    // Reset html when slide changes
    let isCancelled = false

    // Debounce the rendering
    const timeoutId = setTimeout(async () => {
      if (isCancelled) return

      try {
        // Dynamic import of Marp to avoid SSR issues
        const { Marp } = await import('@marp-team/marp-core')
        const marp = new Marp({
          html: true,
          emoji: {
            shortcode: true,
            unicode: true,
          },
        })

        const markdown = slideToMarpMarkdown(currentSlide, project.themeCSS)
        const { html: renderedHtml, css } = marp.render(markdown)

        if (!isCancelled) {
          // Combine HTML and CSS with additional styling to ensure proper display
          const wrappedHtml = `
            <style>
              ${css}
              html, body {
                margin: 0;
                padding: 0;
                width: ${SLIDE_WIDTH}px;
                height: ${SLIDE_HEIGHT}px;
                overflow: hidden;
              }
              /* Marp slides are in a section element */
              section {
                width: ${SLIDE_WIDTH}px !important;
                height: ${SLIDE_HEIGHT}px !important;
              }
            </style>
            ${renderedHtml}
          `
          setHtml(wrappedHtml)
        }
      } catch (error) {
        console.error('Failed to render slide:', error)
        if (!isCancelled) {
          setHtml('<p style="padding: 20px;">プレビューの生成に失敗しました</p>')
        }
      }
    }, 300)

    return () => {
      isCancelled = true
      clearTimeout(timeoutId)
    }
  }, [slideKey, currentSlide, project])

  if (!project || !currentSlide) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        スライドを選択してください
      </div>
    )
  }

  return (
    <div className="h-full flex items-center justify-center p-4">
      <div
        ref={containerRef}
        className="relative bg-white shadow-lg rounded-lg overflow-hidden"
        style={{
          width: '100%',
          maxWidth: '800px',
          aspectRatio: '16/9',
        }}
      >
        <div
          className="absolute top-0 left-0 origin-top-left"
          style={{
            width: `${SLIDE_WIDTH}px`,
            height: `${SLIDE_HEIGHT}px`,
            transform: `scale(${scale})`,
          }}
        >
          <iframe
            srcDoc={html}
            className="border-0"
            style={{
              width: `${SLIDE_WIDTH}px`,
              height: `${SLIDE_HEIGHT}px`,
            }}
            title="Slide Preview"
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  )
}
