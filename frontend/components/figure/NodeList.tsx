'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { GraphNode, AllNodeShapes } from '@/types'
import { Plus, Trash2, GripVertical, User, Square, Box } from 'lucide-react'
import { useCallback } from 'react'

type Props = {
  nodes: GraphNode[]
  selectedNodeId: string | null
  onSelectNode: (id: string | null) => void
  onAddNode: (shape?: AllNodeShapes) => void
  onRemoveNode: (id: string) => void
  onUpdateNodeLabel: (id: string, label: string) => void
}

// Get icon for node shape
function getShapeIcon(shape?: AllNodeShapes) {
  switch (shape) {
    case 'user':
      return <User className="h-3 w-3 text-blue-500" />
    case 'group':
      return <Box className="h-3 w-3 text-slate-500" />
    default:
      return <Square className="h-3 w-3 text-violet-500" />
  }
}

export function NodeList({
  nodes,
  selectedNodeId,
  onSelectNode,
  onAddNode,
  onRemoveNode,
  onUpdateNodeLabel,
}: Props) {
  const handleLabelChange = useCallback((id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateNodeLabel(id, e.target.value)
  }, [onUpdateNodeLabel])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">ノード一覧</h4>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddNode()}
            className="h-7 px-2"
            title="ノードを追加"
          >
            <Plus className="h-3 w-3 mr-1" />
            <Square className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddNode('user')}
            className="h-7 px-2"
            title="ユーザーを追加"
          >
            <Plus className="h-3 w-3 mr-1" />
            <User className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddNode('group')}
            className="h-7 px-2"
            title="グループ枠を追加"
          >
            <Plus className="h-3 w-3 mr-1" />
            <Box className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="space-y-2 max-h-[200px] overflow-y-auto">
        {nodes.map((node, index) => (
          <div
            key={node.id}
            className={`flex items-center gap-2 p-2 rounded border ${
              selectedNodeId === node.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/30'
            }`}
            onClick={() => onSelectNode(node.id)}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
            <span className="text-xs text-muted-foreground w-4">{index + 1}</span>
            <span className="flex-shrink-0">{getShapeIcon(node.shape)}</span>
            <Input
              value={node.label}
              onChange={(e) => handleLabelChange(node.id, e)}
              className="h-7 text-sm flex-1"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                onRemoveNode(node.id)
              }}
              disabled={nodes.length <= 1}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      {nodes.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          ノードがありません
        </p>
      )}
    </div>
  )
}
