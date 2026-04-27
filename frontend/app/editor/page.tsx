'use client'

import { EditorLayout } from '@/components/editor/EditorLayout'
import { useProjectStore } from '@/stores/project-store'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function EditorPage() {
  const router = useRouter()
  const project = useProjectStore((state) => state.project)

  useEffect(() => {
    // Redirect to home if no project exists
    if (!project) {
      router.push('/')
    }
  }, [project, router])

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

  return <EditorLayout />
}
