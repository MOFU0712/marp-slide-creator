'use client'

import { InterviewForm } from '@/components/story/InterviewForm'
import { OutlineReview } from '@/components/story/OutlineReview'
import { StreamingText } from '@/components/common/StreamingText'
import { Button } from '@/components/ui/button'
import { useProjectStore } from '@/stores/project-store'
import { useUiStore } from '@/stores/ui-store'
import { streamRequest } from '@/lib/sse-client'
import type { Figure, FigureParams, FigureType, InterviewAnswers, Slide, SlideContent, StoryEvent, StoryFigureData } from '@/types'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

type Step = 'interview' | 'generating' | 'review'

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

// Create default params for a figure type
function createDefaultFigureParams(type: Figure['type']): FigureParams {
  switch (type) {
    case 'architecture':
      return {
        type: 'architecture',
        nodes: [
          { id: '1', label: 'Client' },
          { id: '2', label: 'Server' },
          { id: '3', label: 'Database' },
        ],
        edges: [
          { from: '1', to: '2', label: 'Request' },
          { from: '2', to: '3', label: 'Query' },
        ],
        direction: 'horizontal',
      }
    case 'flow':
      return {
        type: 'flow',
        nodes: [
          { id: '1', label: '開始' },
          { id: '2', label: '処理' },
          { id: '3', label: '終了' },
        ],
        edges: [
          { from: '1', to: '2' },
          { from: '2', to: '3' },
        ],
        direction: 'horizontal',
      }
    case 'bar_chart':
      return {
        type: 'bar_chart',
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        values: [65, 80, 72, 90],
        unit: '%',
      }
    case 'timeline':
      return {
        type: 'timeline',
        items: [
          { date: '2024/01', label: '企画', done: true },
          { date: '2024/03', label: '設計', done: true },
          { date: '2024/06', label: '開発', done: false },
          { date: '2024/09', label: 'リリース', done: false },
        ],
      }
    case 'comparison':
      return {
        type: 'comparison',
        headers: ['項目', 'プランA', 'プランB'],
        rows: [
          { label: '価格', values: ['¥1,000', '¥3,000'] },
          { label: '容量', values: ['10GB', '50GB'] },
        ],
      }
  }
}

// Build figure from event data
function buildFigure(eventFigure: NonNullable<StoryFigureData>): Figure {
  const figureType: FigureType = eventFigure.type

  // If AI provided params, merge with type
  if (eventFigure.params) {
    return {
      id: generateId(),
      type: figureType,
      params: { type: figureType, ...eventFigure.params } as FigureParams,
      style: { primaryColor: '#534AB7' },
    }
  }

  // Otherwise use default params
  return {
    id: generateId(),
    type: figureType,
    params: createDefaultFigureParams(figureType),
    style: { primaryColor: '#534AB7' },
  }
}

export default function StoryPage() {
  const router = useRouter()
  const project = useProjectStore((state) => state.project)
  const updateProject = useProjectStore((state) => state.updateProject)
  const setSlides = useProjectStore((state) => state.setSlides)
  const isGenerating = useUiStore((state) => state.isGenerating)
  const setIsGenerating = useUiStore((state) => state.setIsGenerating)

  const [step, setStep] = useState<Step>('interview')
  const [error, setError] = useState<string | null>(null)
  const [generatedSlides, setGeneratedSlides] = useState<Slide[]>([])
  const sourceTextRef = useRef<string>('')

  useEffect(() => {
    if (!project) {
      router.push('/')
    }
  }, [project, router])

  if (!project) {
    return null
  }

  const handleSubmitInterview = async (
    answers: InterviewAnswers,
    sourceText: string
  ) => {
    setError(null)
    setIsGenerating(true)
    setStep('generating')
    setGeneratedSlides([])
    sourceTextRef.current = sourceText

    updateProject({ interviewAnswers: answers })

    const newSlides: Slide[] = []

    await streamRequest<StoryEvent>(
      '/api/story/generate',
      {
        mode: project.mode,
        interviewAnswers: answers,
        sourceText,
      },
      {
        onEvent: (event) => {
          if (event.type === 'slide') {
            // Build content based on layout using AI-generated content
            let content: SlideContent
            switch (event.layout) {
              case 'title-bullets':
                content = {
                  layout: 'title-bullets',
                  title: event.title,
                  bullets: event.bullets?.length ? event.bullets : [event.keyMessage || ''],
                }
                break
              case 'two-column':
                content = {
                  layout: 'two-column',
                  title: event.title,
                  left: event.left?.length ? event.left : [''],
                  right: event.right?.length ? event.right : [''],
                }
                break
              case 'title-figure':
                content = {
                  layout: 'title-figure',
                  title: event.title,
                  caption: event.caption || '',
                }
                break
              case 'divider':
                content = {
                  layout: 'divider',
                  title: event.title,
                  subtitle: event.subtitle || event.keyMessage || '',
                }
                break
              case 'title-only':
              default:
                content = {
                  layout: 'title-only',
                  title: event.title,
                }
                break
            }

            const slide: Slide = {
              id: generateId(),
              orderIndex: event.index,
              layout: event.layout,
              content,
              role: event.role,
              keyMessage: event.keyMessage,
              figure: event.figure ? buildFigure(event.figure) : undefined,
            }

            newSlides.push(slide)
            setGeneratedSlides([...newSlides])
          } else if (event.type === 'error') {
            setError(event.message)
          }
        },
        onDone: () => {
          setSlides(newSlides)
          setIsGenerating(false)
          setStep('review')
        },
        onError: (err) => {
          setError(err.message)
          setIsGenerating(false)
          setStep('interview')
        },
      }
    )
  }

  const handleRefine = async (instruction: string) => {
    setError(null)
    setIsGenerating(true)

    const newSlides: Slide[] = []

    await streamRequest<StoryEvent>(
      '/api/story/refine',
      {
        currentSlides: project.slides,
        instruction,
        mode: project.mode,
        sourceText: sourceTextRef.current,
      },
      {
        onEvent: (event) => {
          if (event.type === 'slide') {
            // Build content based on layout using AI-generated content
            let content: SlideContent
            switch (event.layout) {
              case 'title-bullets':
                content = {
                  layout: 'title-bullets',
                  title: event.title,
                  bullets: event.bullets?.length ? event.bullets : [event.keyMessage || ''],
                }
                break
              case 'two-column':
                content = {
                  layout: 'two-column',
                  title: event.title,
                  left: event.left?.length ? event.left : [''],
                  right: event.right?.length ? event.right : [''],
                }
                break
              case 'title-figure':
                content = {
                  layout: 'title-figure',
                  title: event.title,
                  caption: event.caption || '',
                }
                break
              case 'divider':
                content = {
                  layout: 'divider',
                  title: event.title,
                  subtitle: event.subtitle || event.keyMessage || '',
                }
                break
              case 'title-only':
              default:
                content = {
                  layout: 'title-only',
                  title: event.title,
                }
                break
            }

            const slide: Slide = {
              id: generateId(),
              orderIndex: event.index,
              layout: event.layout,
              content,
              role: event.role,
              keyMessage: event.keyMessage,
              figure: event.figure ? buildFigure(event.figure) : undefined,
            }

            newSlides.push(slide)
          } else if (event.type === 'error') {
            setError(event.message)
          }
        },
        onDone: () => {
          setSlides(newSlides)
          setIsGenerating(false)
        },
        onError: (err) => {
          setError(err.message)
          setIsGenerating(false)
        },
      }
    )
  }

  const getModeLabel = () => {
    switch (project.mode) {
      case 'proposal':
        return '提案'
      case 'report':
        return '実装報告'
      case 'comparison':
        return '技術比較'
      case 'research':
        return '調査報告'
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h2 className="font-semibold">ストーリー設計</h2>
              <p className="text-sm text-muted-foreground">
                {getModeLabel()}モード
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg">
            {error}
          </div>
        )}

        {step === 'interview' && (
          <InterviewForm
            onSubmit={handleSubmitInterview}
            isSubmitting={isGenerating}
          />
        )}

        {step === 'generating' && (
          <div className="space-y-6">
            <div className="text-center py-8">
              <StreamingText
                isStreaming={true}
                message="骨子を生成中..."
              />
            </div>
            {generatedSlides.length > 0 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  生成されたスライド: {generatedSlides.length}枚
                </p>
                <div className="space-y-2 opacity-50">
                  {generatedSlides.map((slide, index) => (
                    <div key={slide.id} className="p-3 border rounded-lg">
                      <span className="text-sm font-medium">
                        {index + 1}. {slide.content.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'review' && (
          <OutlineReview onRefine={handleRefine} isRefining={isGenerating} />
        )}
      </div>
    </div>
  )
}
