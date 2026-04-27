'use client'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useProjectStore } from '@/stores/project-store'
import { SlideOutlineCard } from './SlideOutlineCard'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Slide } from '@/types'

type OutlineReviewProps = {
  onRefine: (instruction: string) => void
  isRefining: boolean
}

function SortableSlideCard({ slide, index }: { slide: Slide; index: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <SlideOutlineCard
        index={index}
        title={slide.content.title}
        role={slide.role}
        keyMessage={slide.keyMessage}
        layout={slide.layout}
        hasFigure={!!slide.figure}
        isDragging={isDragging}
      />
    </div>
  )
}

export function OutlineReview({ onRefine, isRefining }: OutlineReviewProps) {
  const router = useRouter()
  const project = useProjectStore((state) => state.project)
  const reorderSlides = useProjectStore((state) => state.reorderSlides)
  const [refineInstruction, setRefineInstruction] = useState('')
  const [showRefineInput, setShowRefineInput] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  if (!project) return null

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = project.slides.findIndex((s) => s.id === active.id)
      const newIndex = project.slides.findIndex((s) => s.id === over.id)

      const newOrder = arrayMove(
        project.slides.map((s) => s.id),
        oldIndex,
        newIndex
      )
      reorderSlides(newOrder)
    }
  }

  const handleRefine = () => {
    if (refineInstruction.trim()) {
      onRefine(refineInstruction)
      setRefineInstruction('')
      setShowRefineInput(false)
    }
  }

  const handleProceed = () => {
    router.push('/editor')
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">骨子レビュー</h3>
        <p className="text-sm text-muted-foreground">
          スライドの順序をドラッグ&ドロップで変更できます。
          問題があれば再生成を依頼できます。
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={project.slides.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {project.slides.map((slide, index) => (
              <SortableSlideCard key={slide.id} slide={slide} index={index} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {project.slides.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          スライドがありません
        </div>
      )}

      <div className="space-y-4 pt-4 border-t">
        {showRefineInput ? (
          <div className="space-y-3">
            <Textarea
              placeholder="追加の指示を入力してください...&#10;例: 「もっと具体的な数字を入れて」「セクションを追加して」"
              value={refineInstruction}
              onChange={(e) => setRefineInstruction(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowRefineInput(false)}
                disabled={isRefining}
              >
                キャンセル
              </Button>
              <Button
                onClick={handleRefine}
                disabled={isRefining || !refineInstruction.trim()}
              >
                {isRefining ? '再生成中...' : '再生成'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowRefineInput(true)}
              disabled={isRefining}
            >
              骨子を再生成
            </Button>
            <Button
              onClick={handleProceed}
              disabled={project.slides.length === 0}
            >
              編集フェーズへ
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
