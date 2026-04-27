'use client'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useProjectStore } from '@/stores/project-store'
import { useUiStore } from '@/stores/ui-store'
import type { SlideContent, SlideLayout } from '@/types'
import { useCallback, useMemo } from 'react'
import { DEFAULT_THEME_CSS } from '@/lib/default-theme'
import { Button } from '@/components/ui/button'
import { RotateCcw, Code } from 'lucide-react'

const LAYOUT_OPTIONS: { value: SlideLayout; label: string }[] = [
  { value: 'title-bullets', label: 'タイトル + 箇条書き' },
  { value: 'title-figure', label: 'タイトル + 図' },
  { value: 'two-column', label: '2カラム' },
  { value: 'divider', label: 'セクション区切り' },
  { value: 'title-only', label: 'タイトルのみ' },
]

const COLOR_PRESETS = [
  { name: 'Purple (Default)', primary: '#534AB7', secondary: '#7B6FCF' },
  { name: 'Blue', primary: '#2563EB', secondary: '#3B82F6' },
  { name: 'Green', primary: '#059669', secondary: '#10B981' },
  { name: 'Red', primary: '#DC2626', secondary: '#EF4444' },
  { name: 'Orange', primary: '#EA580C', secondary: '#F97316' },
  { name: 'Slate', primary: '#475569', secondary: '#64748B' },
]

function extractCSSValue(css: string, selector: string, property: string): string {
  const regex = new RegExp(`${selector}\\s*\\{[^}]*${property}:\\s*([^;]+)`, 'i')
  const match = css.match(regex)
  return match ? match[1].trim() : ''
}

function updateCSSValue(css: string, selector: string, property: string, value: string): string {
  const regex = new RegExp(`(${selector}\\s*\\{[^}]*${property}:\\s*)([^;]+)`, 'gi')
  if (regex.test(css)) {
    return css.replace(regex, `$1${value}`)
  }
  return css
}

export function StyleTab() {
  const project = useProjectStore((state) => state.project)
  const updateProject = useProjectStore((state) => state.updateProject)
  const updateSlideContent = useProjectStore((state) => state.updateSlideContent)
  const currentSlideIndex = useUiStore((state) => state.currentSlideIndex)

  const currentSlide = useMemo(() => {
    if (!project) return null
    const sortedSlides = [...project.slides].sort((a, b) => a.orderIndex - b.orderIndex)
    return sortedSlides[currentSlideIndex] || null
  }, [project, currentSlideIndex])

  // Extract current colors from CSS
  const currentColors = useMemo(() => {
    if (!project) return { primary: '#534AB7', background: '#ffffff', text: '#333333' }
    const css = project.themeCSS
    return {
      primary: extractCSSValue(css, 'h1', 'color') || '#534AB7',
      background: extractCSSValue(css, 'section', 'background-color') || '#ffffff',
      text: extractCSSValue(css, 'section', 'color') || '#333333',
    }
  }, [project])

  const handleLayoutChange = useCallback((layout: SlideLayout) => {
    if (!currentSlide) return

    let newContent: SlideContent

    switch (layout) {
      case 'title-bullets':
        newContent = {
          layout: 'title-bullets',
          title: currentSlide.content.title,
          bullets: currentSlide.content.layout === 'title-bullets'
            ? (currentSlide.content as { bullets: string[] }).bullets
            : [''],
        }
        break
      case 'title-figure':
        newContent = {
          layout: 'title-figure',
          title: currentSlide.content.title,
          caption: '',
        }
        break
      case 'two-column':
        newContent = {
          layout: 'two-column',
          title: currentSlide.content.title,
          left: [''],
          right: [''],
        }
        break
      case 'divider':
        newContent = {
          layout: 'divider',
          title: currentSlide.content.title,
          subtitle: '',
        }
        break
      case 'title-only':
        newContent = {
          layout: 'title-only',
          title: currentSlide.content.title,
        }
        break
    }

    updateSlideContent(currentSlide.id, newContent)
  }, [currentSlide, updateSlideContent])

  const handleColorChange = useCallback((type: 'primary' | 'background' | 'text', color: string) => {
    if (!project) return

    let newCSS = project.themeCSS

    switch (type) {
      case 'primary':
        newCSS = updateCSSValue(newCSS, 'h1', 'color', color)
        newCSS = updateCSSValue(newCSS, 'h2', 'color', color)
        newCSS = updateCSSValue(newCSS, 'li::marker', 'color', color)
        newCSS = updateCSSValue(newCSS, 'strong', 'color', color)
        newCSS = updateCSSValue(newCSS, 'th', 'background-color', color)
        newCSS = updateCSSValue(newCSS, 'blockquote', 'border-left', `4px solid ${color}`)
        break
      case 'background':
        newCSS = updateCSSValue(newCSS, 'section', 'background-color', color)
        break
      case 'text':
        newCSS = updateCSSValue(newCSS, 'section', 'color', color)
        break
    }

    updateProject({ themeCSS: newCSS })
  }, [project, updateProject])

  const handlePresetSelect = useCallback((preset: typeof COLOR_PRESETS[0]) => {
    if (!project) return

    let newCSS = project.themeCSS
    newCSS = updateCSSValue(newCSS, 'h1', 'color', preset.primary)
    newCSS = updateCSSValue(newCSS, 'h2', 'color', preset.primary)
    newCSS = updateCSSValue(newCSS, 'li::marker', 'color', preset.primary)
    newCSS = updateCSSValue(newCSS, 'strong', 'color', preset.primary)
    newCSS = updateCSSValue(newCSS, 'th', 'background-color', preset.primary)
    newCSS = updateCSSValue(newCSS, 'blockquote', 'border-left', `4px solid ${preset.primary}`)
    // Update divider gradient
    newCSS = updateCSSValue(newCSS, 'section.divider', 'background',
      `linear-gradient(135deg, ${preset.primary} 0%, ${preset.secondary} 100%)`)

    updateProject({ themeCSS: newCSS })
  }, [project, updateProject])

  const handleThemeCSSChange = useCallback((css: string) => {
    updateProject({ themeCSS: css })
  }, [updateProject])

  const handleResetTheme = useCallback(() => {
    updateProject({ themeCSS: DEFAULT_THEME_CSS })
  }, [updateProject])

  if (!project) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Layout Selection */}
      {currentSlide && (
        <div className="space-y-2">
          <Label>レイアウト</Label>
          <Select
            value={currentSlide.layout}
            onValueChange={(v) => handleLayoutChange(v as SlideLayout)}
          >
            <SelectTrigger>
              <SelectValue placeholder="レイアウトを選択" />
            </SelectTrigger>
            <SelectContent>
              {LAYOUT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="border-t pt-4">
        <Accordion defaultValue={[0]}>
          {/* Color Settings */}
          <AccordionItem value="colors">
            <AccordionTrigger className="text-sm">カラー設定</AccordionTrigger>
            <AccordionContent className="space-y-4">
              {/* Presets */}
              <div className="space-y-2">
                <Label className="text-xs">プリセット</Label>
                <div className="grid grid-cols-3 gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => handlePresetSelect(preset)}
                      className="p-2 border rounded-md hover:border-primary transition-colors text-center"
                      title={preset.name}
                    >
                      <div
                        className="w-full h-4 rounded mb-1"
                        style={{ background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})` }}
                      />
                      <span className="text-[10px] text-muted-foreground">{preset.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Colors */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="text-xs w-20">メインカラー</Label>
                  <Input
                    type="color"
                    value={currentColors.primary}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    className="w-10 h-8 p-0 border-0 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={currentColors.primary}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    className="flex-1 h-8 text-xs font-mono"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs w-20">背景色</Label>
                  <Input
                    type="color"
                    value={currentColors.background}
                    onChange={(e) => handleColorChange('background', e.target.value)}
                    className="w-10 h-8 p-0 border-0 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={currentColors.background}
                    onChange={(e) => handleColorChange('background', e.target.value)}
                    className="flex-1 h-8 text-xs font-mono"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs w-20">テキスト色</Label>
                  <Input
                    type="color"
                    value={currentColors.text}
                    onChange={(e) => handleColorChange('text', e.target.value)}
                    className="w-10 h-8 p-0 border-0 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={currentColors.text}
                    onChange={(e) => handleColorChange('text', e.target.value)}
                    className="flex-1 h-8 text-xs font-mono"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Advanced CSS */}
          <AccordionItem value="css">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Code className="h-3 w-3" />
                カスタムCSS
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  全スライドに適用されるCSS
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetTheme}
                  className="h-auto py-1 px-2 text-xs gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  リセット
                </Button>
              </div>
              <Textarea
                value={project.themeCSS}
                onChange={(e) => handleThemeCSSChange(e.target.value)}
                className="font-mono text-xs"
                rows={12}
                placeholder="CSSを入力..."
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}
