'use client'

import { useProjectStore } from '@/stores/project-store'
import { useUiStore } from '@/stores/ui-store'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SlideThumbnailList() {
  const project = useProjectStore((state) => state.project)
  const addSlide = useProjectStore((state) => state.addSlide)
  const currentSlideIndex = useUiStore((state) => state.currentSlideIndex)
  const setCurrentSlideIndex = useUiStore((state) => state.setCurrentSlideIndex)

  if (!project) return null

  const sortedSlides = [...project.slides].sort((a, b) => a.orderIndex - b.orderIndex)

  return (
    <div className="p-2 space-y-2">
      {sortedSlides.map((slide, index) => (
        <button
          key={slide.id}
          onClick={() => setCurrentSlideIndex(index)}
          className={cn(
            'w-full text-left p-2 rounded-md border transition-all',
            'hover:border-primary hover:bg-background',
            index === currentSlideIndex
              ? 'border-primary bg-background shadow-sm'
              : 'border-transparent bg-background/50'
          )}
        >
          <div className="flex items-start gap-2">
            <span className="text-xs font-medium text-muted-foreground w-5 flex-shrink-0">
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {slide.content.title || '(タイトル未設定)'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {slide.layout}
              </p>
            </div>
          </div>
        </button>
      ))}

      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 text-muted-foreground"
        onClick={() => {
          addSlide(project.slides.length - 1)
          setCurrentSlideIndex(project.slides.length)
        }}
      >
        <Plus className="h-4 w-4" />
        スライドを追加
      </Button>
    </div>
  )
}
