'use client'

import { Loader2 } from 'lucide-react'

type StreamingTextProps = {
  isStreaming: boolean
  message?: string
}

export function StreamingText({ isStreaming, message }: StreamingTextProps) {
  if (!isStreaming) return null

  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm">{message || '生成中...'}</span>
    </div>
  )
}
