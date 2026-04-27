'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { SlideLayout } from '@/types'
import { GripVertical, Image as ImageIcon } from 'lucide-react'

type SlideOutlineCardProps = {
  index: number
  title: string
  role: string
  keyMessage: string
  layout: SlideLayout
  hasFigure: boolean
  isDragging?: boolean
}

const LAYOUT_LABELS: Record<SlideLayout, string> = {
  'title-bullets': 'タイトル+箇条書き',
  'title-figure': 'タイトル+図',
  'two-column': '2カラム',
  'divider': '区切り',
  'title-only': 'タイトルのみ',
}

export function SlideOutlineCard({
  index,
  title,
  role,
  keyMessage,
  layout,
  hasFigure,
  isDragging,
}: SlideOutlineCardProps) {
  return (
    <Card
      className={`transition-all ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      } hover:border-primary`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-muted-foreground cursor-grab">
            <GripVertical className="h-4 w-4" />
            <span className="text-sm font-medium">{index + 1}</span>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold">{title || '(タイトル未設定)'}</h4>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {LAYOUT_LABELS[layout]}
            </Badge>
            {hasFigure && (
              <Badge variant="secondary" className="text-xs">
                <ImageIcon className="h-3 w-3 mr-1" />
                図あり
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1 text-sm text-muted-foreground">
          {role && (
            <p>
              <span className="font-medium">役割:</span> {role}
            </p>
          )}
          {keyMessage && (
            <p>
              <span className="font-medium">キーメッセージ:</span> {keyMessage}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
