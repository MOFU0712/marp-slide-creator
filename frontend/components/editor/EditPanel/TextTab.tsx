'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useProjectStore } from '@/stores/project-store'
import { useUiStore } from '@/stores/ui-store'
import type { SlideContent } from '@/types'
import { useMemo } from 'react'

export function TextTab() {
  const project = useProjectStore((state) => state.project)
  const updateSlideContent = useProjectStore((state) => state.updateSlideContent)
  const updateSlide = useProjectStore((state) => state.updateSlide)
  const currentSlideIndex = useUiStore((state) => state.currentSlideIndex)

  const currentSlide = useMemo(() => {
    if (!project) return null
    const sortedSlides = [...project.slides].sort((a, b) => a.orderIndex - b.orderIndex)
    return sortedSlides[currentSlideIndex] || null
  }, [project, currentSlideIndex])

  if (!currentSlide) {
    return (
      <div className="text-center text-muted-foreground py-8">
        スライドを選択してください
      </div>
    )
  }

  const { content } = currentSlide

  const handleTitleChange = (title: string) => {
    updateSlideContent(currentSlide.id, { ...content, title } as SlideContent)
  }

  const handleBulletsChange = (bulletsText: string) => {
    if (content.layout === 'title-bullets') {
      const bullets = bulletsText.split('\n')
      updateSlideContent(currentSlide.id, {
        ...content,
        bullets,
      })
    }
  }

  const handleLeftChange = (leftText: string) => {
    if (content.layout === 'two-column') {
      const left = leftText.split('\n')
      updateSlideContent(currentSlide.id, {
        ...content,
        left,
      })
    }
  }

  const handleRightChange = (rightText: string) => {
    if (content.layout === 'two-column') {
      const right = rightText.split('\n')
      updateSlideContent(currentSlide.id, {
        ...content,
        right,
      })
    }
  }

  const handleSubtitleChange = (subtitle: string) => {
    if (content.layout === 'divider') {
      updateSlideContent(currentSlide.id, {
        ...content,
        subtitle,
      })
    }
  }

  const handleCaptionChange = (caption: string) => {
    if (content.layout === 'title-figure') {
      updateSlideContent(currentSlide.id, {
        ...content,
        caption,
      })
    }
  }

  const handleSpeakerNoteChange = (speakerNote: string) => {
    updateSlide(currentSlide.id, { speakerNote })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">タイトル</Label>
        <Input
          id="title"
          value={content.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="スライドタイトル"
        />
      </div>

      {content.layout === 'title-bullets' && (
        <div className="space-y-2">
          <Label htmlFor="bullets">箇条書き</Label>
          <Textarea
            id="bullets"
            value={content.bullets.join('\n')}
            onChange={(e) => handleBulletsChange(e.target.value)}
            placeholder="1行に1つの項目を入力&#10;改行で項目を追加"
            rows={6}
          />
          <p className="text-xs text-muted-foreground">
            1行に1つの項目を入力してください
          </p>
        </div>
      )}

      {content.layout === 'two-column' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="left">左カラム</Label>
            <Textarea
              id="left"
              value={content.left.join('\n')}
              onChange={(e) => handleLeftChange(e.target.value)}
              placeholder="左カラムの内容"
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="right">右カラム</Label>
            <Textarea
              id="right"
              value={content.right.join('\n')}
              onChange={(e) => handleRightChange(e.target.value)}
              placeholder="右カラムの内容"
              rows={4}
            />
          </div>
        </>
      )}

      {content.layout === 'divider' && (
        <div className="space-y-2">
          <Label htmlFor="subtitle">サブタイトル</Label>
          <Input
            id="subtitle"
            value={content.subtitle || ''}
            onChange={(e) => handleSubtitleChange(e.target.value)}
            placeholder="サブタイトル（オプション）"
          />
        </div>
      )}

      {content.layout === 'title-figure' && (
        <div className="space-y-2">
          <Label htmlFor="caption">キャプション</Label>
          <Input
            id="caption"
            value={content.caption || ''}
            onChange={(e) => handleCaptionChange(e.target.value)}
            placeholder="図のキャプション（オプション）"
          />
        </div>
      )}

      <div className="space-y-2 pt-4 border-t">
        <Label htmlFor="speakerNote">スピーカーノート</Label>
        <Textarea
          id="speakerNote"
          value={currentSlide.speakerNote || ''}
          onChange={(e) => handleSpeakerNoteChange(e.target.value)}
          placeholder="発表者用のメモを入力..."
          rows={4}
        />
        <p className="text-xs text-muted-foreground">
          プレゼンター表示で確認できます
        </p>
      </div>
    </div>
  )
}
