'use client'

import { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useProjectStore } from '@/stores/project-store'
import { toMarpMarkdown, parseMarpMarkdown } from '@/lib/marp-converter'
import {
  Download,
  Upload,
  Save,
  FolderOpen,
  FileJson,
  FileText,
  CheckCircle,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Slide, SlideContent } from '@/types'

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

export function ProjectManager() {
  const project = useProjectStore((state) => state.project)
  const lastSavedAt = useProjectStore((state) => state.lastSavedAt)
  const exportProjectJson = useProjectStore((state) => state.exportProjectJson)
  const importProjectJson = useProjectStore((state) => state.importProjectJson)
  const loadProject = useProjectStore((state) => state.loadProject)
  const setSlides = useProjectStore((state) => state.setSlides)
  const updateProject = useProjectStore((state) => state.updateProject)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importType, setImportType] = useState<'json' | 'marp' | null>(null)
  const [showSavedDialog, setShowSavedDialog] = useState(false)

  // Format last saved time
  const formatLastSaved = useCallback(() => {
    if (!lastSavedAt) return null
    const date = new Date(lastSavedAt)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return '今保存しました'
    if (diffMins < 60) return `${diffMins}分前に保存`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}時間前に保存`
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }, [lastSavedAt])

  // Export as JSON (project data)
  const handleExportJson = useCallback(() => {
    const json = exportProjectJson()
    if (!json || !project) return

    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.title || 'project'}.marp-project.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [project, exportProjectJson])

  // Export as Marp Markdown
  const handleExportMarp = useCallback(() => {
    if (!project) return

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
  }, [project])

  // Trigger file input
  const handleImportClick = useCallback((type: 'json' | 'marp') => {
    setImportType(type)
    fileInputRef.current?.click()
  }, [])

  // Handle file selection
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string

      if (importType === 'json') {
        const success = importProjectJson(content)
        if (!success) {
          alert('プロジェクトファイルの読み込みに失敗しました。\nファイル形式を確認してください。')
        }
      } else if (importType === 'marp') {
        try {
          const { themeCSS, slides: parsedSlides } = parseMarpMarkdown(content)

          // Convert parsed slides to full Slide objects
          const slides: Slide[] = parsedSlides.map((ps, index) => ({
            id: generateId(),
            orderIndex: index,
            layout: ps.layout || 'title-bullets',
            content: ps.content || { layout: 'title-bullets', title: '', bullets: [''] } as SlideContent,
            role: '',
            keyMessage: '',
          }))

          if (project) {
            // Update existing project
            updateProject({ themeCSS })
            setSlides(slides)
          } else {
            // Create new project from imported file
            const newProject = {
              id: generateId(),
              title: file.name.replace(/\.md$/, ''),
              mode: 'proposal' as const,
              interviewAnswers: { audience: '', goal: '', concerns: '' },
              themeCSS: themeCSS || '',
              slides,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
            loadProject(newProject)
          }
        } catch (error) {
          console.error('Failed to parse Marp file:', error)
          alert('Marpファイルの読み込みに失敗しました。\nファイル形式を確認してください。')
        }
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setImportType(null)
    }
    reader.readAsText(file)
  }, [importType, importProjectJson, project, updateProject, setSlides, loadProject])

  // Manual save (triggers localStorage persist)
  const handleSave = useCallback(() => {
    // The persist middleware auto-saves, but we show feedback
    setShowSavedDialog(true)
    setTimeout(() => setShowSavedDialog(false), 2000)
  }, [])

  if (!project) return null

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Save status indicator */}
        {lastSavedAt && (
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {formatLastSaved()}
          </span>
        )}

        {/* Save button */}
        <Button variant="outline" size="sm" onClick={handleSave} className="gap-1.5">
          <Save className="h-4 w-4" />
          <span className="hidden sm:inline">保存</span>
        </Button>

        {/* Import/Export dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3 py-2">
            <FolderOpen className="h-4 w-4" />
            <span className="hidden sm:inline">ファイル</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => handleImportClick('json')}>
              <Upload className="h-4 w-4 mr-2" />
              プロジェクトを読み込み (.json)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleImportClick('marp')}>
              <FileText className="h-4 w-4 mr-2" />
              Marpファイルを読み込み (.md)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExportJson}>
              <FileJson className="h-4 w-4 mr-2" />
              プロジェクトを保存 (.json)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportMarp}>
              <Download className="h-4 w-4 mr-2" />
              Marp出力 (.md)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={importType === 'json' ? '.json' : '.md,.markdown'}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Save confirmation dialog */}
      <Dialog open={showSavedDialog} onOpenChange={setShowSavedDialog}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              保存しました
            </DialogTitle>
            <DialogDescription>
              プロジェクトはブラウザに自動保存されています。
              ファイルとして保存するには「ファイル」メニューを使用してください。
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  )
}
