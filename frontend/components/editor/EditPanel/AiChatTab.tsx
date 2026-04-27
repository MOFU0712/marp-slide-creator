'use client'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useProjectStore } from '@/stores/project-store'
import { useUiStore } from '@/stores/ui-store'
import { streamRequest } from '@/lib/sse-client'
import type { SlideAiEvent } from '@/types'
import { Loader2, Send } from 'lucide-react'
import { useMemo, useState } from 'react'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export function AiChatTab() {
  const project = useProjectStore((state) => state.project)
  const updateSlide = useProjectStore((state) => state.updateSlide)
  const updateSlideContent = useProjectStore((state) => state.updateSlideContent)
  const currentSlideIndex = useUiStore((state) => state.currentSlideIndex)
  const isGenerating = useUiStore((state) => state.isGenerating)
  const setIsGenerating = useUiStore((state) => state.setIsGenerating)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')

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

  const handleSubmit = async () => {
    if (!input.trim() || isGenerating) return

    const userMessage = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setIsGenerating(true)

    let responseContent = ''

    await streamRequest<SlideAiEvent>(
      '/api/slides/ai',
      {
        instruction: userMessage,
        slide: currentSlide,
        role: currentSlide.role,
        keyMessage: currentSlide.keyMessage,
      },
      {
        onEvent: (event) => {
          if (event.type === 'patch') {
            responseContent += `${event.field}: 更新\n`

            // Apply the patch to the slide
            if (event.field.startsWith('content.')) {
              const field = event.field.replace('content.', '')
              updateSlideContent(currentSlide.id, {
                ...currentSlide.content,
                [field]: event.value,
              })
            } else {
              updateSlide(currentSlide.id, { [event.field]: event.value })
            }
          } else if (event.type === 'error') {
            responseContent = `エラー: ${event.message}`
          }
        },
        onDone: () => {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: responseContent || 'スライドを更新しました',
            },
          ])
          setIsGenerating(false)
        },
        onError: (error) => {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: `エラー: ${error.message}` },
          ])
          setIsGenerating(false)
        },
      }
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          スライド #{currentSlideIndex + 1} への指示
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          例: 「もっと具体的に」「箇条書きを3つに減らして」
        </p>
      </div>

      <ScrollArea className="flex-1 mb-4 border rounded-lg p-3">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-4">
            AIに指示を送って、スライドを編集しましょう
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`text-sm ${
                  message.role === 'user'
                    ? 'text-right'
                    : 'text-left text-muted-foreground'
                }`}
              >
                <span
                  className={`inline-block px-3 py-2 rounded-lg max-w-[90%] ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {message.content}
                </span>
              </div>
            ))}
            {isGenerating && (
              <div className="text-left">
                <span className="inline-block px-3 py-2 rounded-lg bg-muted text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </span>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="指示を入力..."
          rows={2}
          className="resize-none"
          disabled={isGenerating}
        />
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={!input.trim() || isGenerating}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
