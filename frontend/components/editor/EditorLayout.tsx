'use client'

import { SlideThumbnailList } from './SlideThumbnailList'
import { SlidePreview } from './SlidePreview'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TextTab } from './EditPanel/TextTab'
import { StyleTab } from './EditPanel/StyleTab'
import { AiChatTab } from './EditPanel/AiChatTab'
import { FigureTab } from './EditPanel/FigureTab'
import { useUiStore } from '@/stores/ui-store'
import { useProjectStore } from '@/stores/project-store'
import { ProjectManager } from '@/components/common/ProjectManager'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText, Image as ImageIcon, Palette, Sparkles } from 'lucide-react'

export function EditorLayout() {
  const project = useProjectStore((state) => state.project)
  const editTab = useUiStore((state) => state.editTab)
  const setEditTab = useUiStore((state) => state.setEditTab)

  if (!project) return null

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Top Bar */}
      <div className="border-b border-border bg-background">
        <div className="px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/story">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h2 className="font-semibold">{project.title}</h2>
              <p className="text-xs text-muted-foreground">
                {project.slides.length}枚のスライド
              </p>
            </div>
          </div>
          <ProjectManager />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Thumbnail List */}
        <div className="w-48 border-r border-border overflow-y-auto bg-muted/30">
          <SlideThumbnailList />
        </div>

        {/* Center: Preview */}
        <div className="flex-1 overflow-hidden bg-muted/50 p-4">
          <SlidePreview />
        </div>

        {/* Right: Edit Panel */}
        <div className="w-80 border-l border-border overflow-hidden flex flex-col">
          <Tabs
            value={editTab}
            onValueChange={(v) => setEditTab(v as typeof editTab)}
            className="flex-1 flex flex-col"
          >
            <TabsList className="grid w-full grid-cols-4 p-1 h-auto">
              <TabsTrigger value="text" className="flex flex-col gap-1 py-2">
                <FileText className="h-4 w-4" />
                <span className="text-xs">テキスト</span>
              </TabsTrigger>
              <TabsTrigger value="figure" className="flex flex-col gap-1 py-2">
                <ImageIcon className="h-4 w-4" />
                <span className="text-xs">図</span>
              </TabsTrigger>
              <TabsTrigger value="style" className="flex flex-col gap-1 py-2">
                <Palette className="h-4 w-4" />
                <span className="text-xs">スタイル</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex flex-col gap-1 py-2">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs">AI</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="text" className="flex-1 overflow-y-auto p-4 m-0">
              <TextTab />
            </TabsContent>
            <TabsContent value="figure" className="flex-1 overflow-y-auto p-4 m-0">
              <FigureTab />
            </TabsContent>
            <TabsContent value="style" className="flex-1 overflow-y-auto p-4 m-0">
              <StyleTab />
            </TabsContent>
            <TabsContent value="ai" className="flex-1 overflow-y-auto p-4 m-0">
              <AiChatTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
