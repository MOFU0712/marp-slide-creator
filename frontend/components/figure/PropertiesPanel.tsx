'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import type { GraphParams, GraphEdge, GraphNode } from '@/types'
import { Plus, Trash2 } from 'lucide-react'
import { useCallback } from 'react'

type Props = {
  params: GraphParams
  selectedNodeId: string | null
  primaryColor: string
  onUpdateParams: (updates: Partial<GraphParams>) => void
  onUpdatePrimaryColor: (color: string) => void
  onUpdateNode?: (id: string, updates: Partial<GraphNode>) => void
}

export function PropertiesPanel({
  params,
  selectedNodeId,
  primaryColor,
  onUpdateParams,
  onUpdatePrimaryColor,
  onUpdateNode,
}: Props) {
  const { nodes, edges, direction } = params
  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null
  const isGroupNode = selectedNode?.shape === 'group'

  // Get edges connected to selected node
  const connectedEdges = selectedNodeId
    ? edges.filter(e => e.from === selectedNodeId || e.to === selectedNodeId)
    : []

  const handleDirectionChange = useCallback((newDirection: 'horizontal' | 'vertical') => {
    onUpdateParams({ direction: newDirection })
  }, [onUpdateParams])

  const handleAddEdge = useCallback(() => {
    if (!selectedNodeId || nodes.length < 2) return

    // Find a node that is not already connected as target
    const existingTargets = edges.filter(e => e.from === selectedNodeId).map(e => e.to)
    const availableTargets = nodes.filter(n => n.id !== selectedNodeId && !existingTargets.includes(n.id))

    if (availableTargets.length === 0) return

    const newEdge: GraphEdge = {
      from: selectedNodeId,
      to: availableTargets[0].id,
    }

    onUpdateParams({ edges: [...edges, newEdge] })
  }, [selectedNodeId, nodes, edges, onUpdateParams])

  const handleRemoveEdge = useCallback((index: number) => {
    const newEdges = edges.filter((_, i) => i !== index)
    onUpdateParams({ edges: newEdges })
  }, [edges, onUpdateParams])

  const handleEdgeTargetChange = useCallback((edgeIndex: number, newTarget: string) => {
    const newEdges = edges.map((edge, i) => {
      if (i === edgeIndex) {
        return { ...edge, to: newTarget }
      }
      return edge
    })
    onUpdateParams({ edges: newEdges })
  }, [edges, onUpdateParams])

  const handleEdgeLabelChange = useCallback((edgeIndex: number, label: string) => {
    const newEdges = edges.map((edge, i) => {
      if (i === edgeIndex) {
        return { ...edge, label: label || undefined }
      }
      return edge
    })
    onUpdateParams({ edges: newEdges })
  }, [edges, onUpdateParams])

  // Group size handlers
  const handleGroupWidthChange = useCallback((value: number | readonly number[]) => {
    if (!selectedNodeId || !onUpdateNode) return
    const width = typeof value === 'number' ? value : value[0]
    onUpdateNode(selectedNodeId, { width })
  }, [selectedNodeId, onUpdateNode])

  const handleGroupHeightChange = useCallback((value: number | readonly number[]) => {
    if (!selectedNodeId || !onUpdateNode) return
    const height = typeof value === 'number' ? value : value[0]
    onUpdateNode(selectedNodeId, { height })
  }, [selectedNodeId, onUpdateNode])

  const handleNodeColorChange = useCallback((color: string) => {
    if (!selectedNodeId || !onUpdateNode) return
    onUpdateNode(selectedNodeId, { color })
  }, [selectedNodeId, onUpdateNode])

  return (
    <div className="space-y-4">
      {/* Figure Properties */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">図の設定</h4>

        <div className="space-y-2">
          <Label className="text-xs">方向</Label>
          <div className="flex gap-2">
            <Button
              variant={direction === 'horizontal' ? 'default' : 'outline'}
              size="sm"
              className="flex-1 h-7"
              onClick={() => handleDirectionChange('horizontal')}
            >
              横方向
            </Button>
            <Button
              variant={direction === 'vertical' ? 'default' : 'outline'}
              size="sm"
              className="flex-1 h-7"
              onClick={() => handleDirectionChange('vertical')}
            >
              縦方向
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">メインカラー</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={primaryColor}
              onChange={(e) => onUpdatePrimaryColor(e.target.value)}
              className="h-8 w-12 p-1 cursor-pointer"
            />
            <Input
              type="text"
              value={primaryColor}
              onChange={(e) => onUpdatePrimaryColor(e.target.value)}
              className="h-8 font-mono text-xs"
            />
          </div>
        </div>
      </div>

      {/* Selected Node Properties */}
      {selectedNode && (
        <div className="space-y-3 pt-3 border-t">
          <h4 className="text-sm font-medium">
            選択中: <span className="text-primary">{selectedNode.label}</span>
          </h4>

          {/* Node Color */}
          {onUpdateNode && (
            <div className="space-y-2">
              <Label className="text-xs">ノードの色</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={selectedNode.color || primaryColor}
                  onChange={(e) => handleNodeColorChange(e.target.value)}
                  className="h-8 w-12 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={selectedNode.color || primaryColor}
                  onChange={(e) => handleNodeColorChange(e.target.value)}
                  className="h-8 font-mono text-xs"
                />
              </div>
            </div>
          )}

          {/* Group Size Controls */}
          {isGroupNode && onUpdateNode && (
            <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
              <Label className="text-xs font-medium">グループサイズ</Label>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">幅</span>
                  <span className="text-xs font-mono">{selectedNode.width || 200}px</span>
                </div>
                <Slider
                  value={[selectedNode.width || 200]}
                  onValueChange={handleGroupWidthChange}
                  min={100}
                  max={500}
                  step={10}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">高さ</span>
                  <span className="text-xs font-mono">{selectedNode.height || 120}px</span>
                </div>
                <Slider
                  value={[selectedNode.height || 120]}
                  onValueChange={handleGroupHeightChange}
                  min={60}
                  max={400}
                  step={10}
                />
              </div>
            </div>
          )}

          {/* Outgoing Edges */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">接続先</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={handleAddEdge}
                disabled={nodes.length < 2}
              >
                <Plus className="h-3 w-3 mr-1" />
                追加
              </Button>
            </div>

            {edges.map((edge, index) => {
              if (edge.from !== selectedNodeId) return null

              return (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">→</span>
                  <select
                    value={edge.to}
                    onChange={(e) => handleEdgeTargetChange(index, e.target.value)}
                    className="flex-1 h-7 text-xs rounded border bg-background px-2"
                  >
                    {nodes
                      .filter(n => n.id !== selectedNodeId)
                      .map(n => (
                        <option key={n.id} value={n.id}>
                          {n.label}
                        </option>
                      ))}
                  </select>
                  <Input
                    value={edge.label || ''}
                    onChange={(e) => handleEdgeLabelChange(index, e.target.value)}
                    placeholder="ラベル"
                    className="w-20 h-7 text-xs"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveEdge(index)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )
            })}

            {connectedEdges.filter(e => e.from === selectedNodeId).length === 0 && (
              <p className="text-xs text-muted-foreground">接続なし</p>
            )}
          </div>
        </div>
      )}

      {!selectedNode && (
        <div className="pt-3 border-t">
          <p className="text-xs text-muted-foreground text-center py-4">
            ノードを選択してプロパティを編集
          </p>
        </div>
      )}
    </div>
  )
}
