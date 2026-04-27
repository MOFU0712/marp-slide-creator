'use client'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { ProjectMode } from '@/types'
import { FileText, GitCompare, Lightbulb, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useProjectStore } from '@/stores/project-store'
import { useUiStore } from '@/stores/ui-store'

type ModeOption = {
  mode: ProjectMode
  title: string
  description: string
  icon: React.ReactNode
}

const MODE_OPTIONS: ModeOption[] = [
  {
    mode: 'proposal',
    title: '提案',
    description: '新機能や技術導入の承認を得るための提案資料',
    icon: <Lightbulb className="h-8 w-8" />,
  },
  {
    mode: 'report',
    title: '実装報告',
    description: '完了した実装の成果を報告する資料',
    icon: <FileText className="h-8 w-8" />,
  },
  {
    mode: 'comparison',
    title: '技術比較',
    description: '複数の選択肢を比較検討する資料',
    icon: <GitCompare className="h-8 w-8" />,
  },
  {
    mode: 'research',
    title: '調査報告',
    description: '技術調査や分析結果を共有する資料',
    icon: <Search className="h-8 w-8" />,
  },
]

export function ModeSelector() {
  const router = useRouter()
  const initProject = useProjectStore((state) => state.initProject)
  const resetUi = useUiStore((state) => state.reset)

  const handleSelectMode = (mode: ProjectMode) => {
    // Reset UI state
    resetUi()
    // Initialize project with selected mode
    initProject(mode)
    // Navigate to story page
    router.push('/story')
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {MODE_OPTIONS.map((option) => (
        <Card
          key={option.mode}
          className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
          onClick={() => handleSelectMode(option.mode)}
        >
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="text-primary">{option.icon}</div>
              <div>
                <CardTitle className="text-lg">{option.title}</CardTitle>
                <CardDescription className="mt-1">
                  {option.description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
