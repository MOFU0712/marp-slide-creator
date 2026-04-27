'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useProjectStore } from '@/stores/project-store'
import { useUiStore } from '@/stores/ui-store'
import type { FigureType, Figure } from '@/types'
import { useCallback, useMemo, useState } from 'react'
import { FigureRenderer } from '@/components/figure/FigureRenderer'
import { FigureEditor } from '@/components/figure/FigureEditor'
import {
  GitBranch,
  BarChart3,
  Calendar,
  Table2,
  Network,
  Trash2,
  Pencil,
  Eye,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'

const FIGURE_TYPES: { type: FigureType; label: string; icon: React.ReactNode }[] = [
  { type: 'architecture', label: 'アーキテクチャ図', icon: <Network className="h-5 w-5" /> },
  { type: 'flow', label: 'フロー図', icon: <GitBranch className="h-5 w-5" /> },
  { type: 'bar_chart', label: '棒グラフ', icon: <BarChart3 className="h-5 w-5" /> },
  { type: 'timeline', label: 'タイムライン', icon: <Calendar className="h-5 w-5" /> },
  { type: 'comparison', label: '比較表', icon: <Table2 className="h-5 w-5" /> },
]

function createDefaultParams(type: FigureType) {
  switch (type) {
    case 'architecture':
      return {
        type,
        nodes: [
          { id: '1', label: 'Client' },
          { id: '2', label: 'API Server' },
          { id: '3', label: 'Database' },
        ],
        edges: [
          { from: '1', to: '2', label: 'Request' },
          { from: '2', to: '3', label: 'Query' },
        ],
        direction: 'horizontal' as const,
      }
    case 'flow':
      return {
        type,
        nodes: [
          { id: '1', label: '開始' },
          { id: '2', label: '処理' },
          { id: '3', label: '終了' },
        ],
        edges: [
          { from: '1', to: '2' },
          { from: '2', to: '3' },
        ],
        direction: 'horizontal' as const,
      }
    case 'bar_chart':
      return {
        type,
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        values: [65, 80, 72, 90],
        unit: '%',
        targetLine: 75,
      }
    case 'timeline':
      return {
        type,
        items: [
          { date: '2024/01', label: '企画', done: true },
          { date: '2024/03', label: '設計', done: true },
          { date: '2024/06', label: '開発', done: false },
          { date: '2024/09', label: 'リリース', done: false },
        ],
      }
    case 'comparison':
      return {
        type,
        headers: ['項目', 'プランA', 'プランB', 'プランC'],
        rows: [
          { label: '価格', values: ['¥1,000', '¥3,000', '¥5,000'] },
          { label: '容量', values: ['10GB', '50GB', '無制限'] },
          { label: 'サポート', values: ['メール', '電話', '24時間'] },
        ],
        recommended: 2,
      }
  }
}

export function FigureTab() {
  const project = useProjectStore((state) => state.project)
  const updateFigure = useProjectStore((state) => state.updateFigure)
  const removeFigure = useProjectStore((state) => state.removeFigure)
  const currentSlideIndex = useUiStore((state) => state.currentSlideIndex)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)

  const currentSlide = useMemo(() => {
    if (!project) return null
    const sortedSlides = [...project.slides].sort((a, b) => a.orderIndex - b.orderIndex)
    return sortedSlides[currentSlideIndex] || null
  }, [project, currentSlideIndex])

  const handleAddFigure = useCallback((type: FigureType) => {
    if (!currentSlide) return
    const figure: Figure = {
      id: crypto.randomUUID(),
      type,
      params: createDefaultParams(type),
      style: { primaryColor: '#534AB7' },
    }
    updateFigure(currentSlide.id, figure)
  }, [currentSlide, updateFigure])

  const handleRemoveFigure = useCallback(() => {
    if (!currentSlide) return
    removeFigure(currentSlide.id)
  }, [currentSlide, removeFigure])

  const handleSaveFigure = useCallback((updatedFigure: Figure) => {
    if (!currentSlide) return
    updateFigure(currentSlide.id, updatedFigure)
    setEditorOpen(false)
  }, [currentSlide, updateFigure])

  const handleScaleChange = useCallback((value: number | readonly number[]) => {
    if (!currentSlide?.figure) return
    const newScale = typeof value === 'number' ? value : value[0]
    const updatedFigure: Figure = {
      ...currentSlide.figure,
      style: { ...currentSlide.figure.style, scale: newScale },
    }
    updateFigure(currentSlide.id, updatedFigure)
  }, [currentSlide, updateFigure])

  const isEditableFigure = currentSlide?.figure?.type === 'architecture' || currentSlide?.figure?.type === 'flow'
  const currentScale = currentSlide?.figure?.style?.scale ?? 1

  if (!currentSlide) {
    return (
      <div className="text-center text-muted-foreground py-8">
        スライドを選択してください
      </div>
    )
  }

  if (currentSlide.figure) {
    const figureInfo = FIGURE_TYPES.find((f) => f.type === currentSlide.figure?.type)

    return (
      <div className="space-y-4">
        {/* Figure Info */}
        <div className="p-3 border rounded-lg space-y-3">
          <div className="flex items-center gap-3">
            {figureInfo?.icon}
            <div className="flex-1">
              <p className="font-medium text-sm">{figureInfo?.label}</p>
              <Badge variant="secondary" className="text-xs">
                {currentSlide.figure.type}
              </Badge>
            </div>
          </div>
        </div>

        {/* Figure Preview */}
        <div className="border rounded-lg overflow-hidden bg-white">
          <div className="p-2 border-b bg-muted/30 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">プレビュー</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setPreviewOpen(true)}
            >
              <Eye className="h-3 w-3 mr-1" />
              拡大
            </Button>
          </div>
          <div className="p-2 flex justify-center">
            <div className="w-full max-w-[240px]">
              <FigureRenderer
                figure={currentSlide.figure}
                width={240}
                height={160}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {isEditableFigure ? (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1"
              onClick={() => setEditorOpen(true)}
            >
              <Pencil className="h-3 w-3" />
              編集
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1"
              onClick={() => setPreviewOpen(true)}
            >
              <Eye className="h-3 w-3" />
              プレビュー
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={handleRemoveFigure}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Scale Control */}
        <div className="p-3 border rounded-lg space-y-3">
          <Label className="text-sm font-medium">図のサイズ</Label>
          <div className="flex items-center gap-3">
            <ZoomOut className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Slider
              value={[currentScale]}
              onValueChange={handleScaleChange}
              min={0.5}
              max={2}
              step={0.1}
              className="flex-1"
            />
            <ZoomIn className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground w-12 text-right">
              {Math.round(currentScale * 100)}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            スライド内での図の表示サイズを調整します
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          図はスライドに自動的に埋め込まれます。
        </p>

        {/* Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {figureInfo?.icon}
                {figureInfo?.label}
              </DialogTitle>
            </DialogHeader>
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <FigureRenderer
                figure={currentSlide.figure}
                width={700}
                height={400}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Editor Dialog - Full Screen */}
        {isEditableFigure && (
          <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
            <DialogContent
              className="!max-w-[95vw] !w-[95vw] !h-[90vh] !max-h-[90vh] flex flex-col p-6"
              showCloseButton={false}
            >
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="flex items-center gap-2">
                  {figureInfo?.icon}
                  {figureInfo?.label}を編集
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-hidden min-h-0">
                <FigureEditor
                  figure={currentSlide.figure}
                  onSave={handleSaveFigure}
                  onCancel={() => setEditorOpen(false)}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        追加する図のタイプを選択してください
      </p>

      <div className="grid grid-cols-2 gap-2">
        {FIGURE_TYPES.map((figureType) => (
          <button
            key={figureType.type}
            onClick={() => handleAddFigure(figureType.type)}
            className="p-3 border rounded-lg hover:border-primary hover:bg-muted/50 transition-all text-left"
          >
            <div className="flex flex-col items-center gap-2 text-center">
              {figureType.icon}
              <span className="text-xs">{figureType.label}</span>
            </div>
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        図を追加すると、スライドに自動的に挿入されます。
      </p>
    </div>
  )
}
