'use client'

import { Button } from '@/components/ui/button'
import { useProjectStore } from '@/stores/project-store'
import { toMarpMarkdown } from '@/lib/marp-converter'
import { Download } from 'lucide-react'

export function ExportButton() {
  const project = useProjectStore((state) => state.project)

  if (!project) return null

  const handleExport = () => {
    const markdown = toMarpMarkdown(project)
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.title || 'slides'}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Button onClick={handleExport} size="sm" className="gap-2">
      <Download className="h-4 w-4" />
      Marp出力
    </Button>
  )
}
