'use client'

import { useCallback, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import type { Figure, GraphParams, GraphNode, AllNodeShapes } from '@/types'
import { FigureCanvas } from './FigureCanvas'
import { NodeList } from './NodeList'
import { PropertiesPanel } from './PropertiesPanel'
import { autoLayoutNodes } from '@/lib/auto-layout'
import { LayoutGrid, RotateCcw, Save, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'

type Props = {
  figure: Figure
  onSave: (figure: Figure) => void
  onCancel: () => void
}

// ノード数に応じてキャンバスサイズを計算
function calculateCanvasSize(nodeCount: number, direction: 'horizontal' | 'vertical') {
  const baseWidth = 800
  const baseHeight = 500
  const nodeSpace = 180 // ノード1つあたりのスペース

  if (direction === 'horizontal') {
    const width = Math.max(baseWidth, nodeCount * nodeSpace + 160)
    return { width, height: baseHeight }
  } else {
    const height = Math.max(baseHeight, nodeCount * nodeSpace + 160)
    return { width: baseWidth, height }
  }
}

export function FigureEditor({ figure, onSave, onCancel }: Props) {
  const [editedFigure, setEditedFigure] = useState<Figure>(figure)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100) // ズーム率（%）

  const params = editedFigure.params as GraphParams
  const figureType = editedFigure.type as 'architecture' | 'flow'

  // キャンバスサイズを動的に計算
  const canvasSize = useMemo(() => {
    return calculateCanvasSize(params.nodes.length, params.direction || 'horizontal')
  }, [params.nodes.length, params.direction])

  const handleUpdateParams = useCallback((updates: Partial<GraphParams>) => {
    setEditedFigure(prev => ({
      ...prev,
      params: { ...(prev.params as GraphParams), ...updates } as GraphParams,
    }))
  }, [])

  const handleUpdatePrimaryColor = useCallback((color: string) => {
    setEditedFigure(prev => ({
      ...prev,
      style: { ...prev.style, primaryColor: color },
    }))
  }, [])

  const handleUpdateNode = useCallback((id: string, updates: Partial<GraphNode>) => {
    setEditedFigure(prev => {
      const currentParams = prev.params as GraphParams
      const newNodes = currentParams.nodes.map(node => {
        if (node.id === id) {
          return { ...node, ...updates }
        }
        return node
      })
      return {
        ...prev,
        params: { ...currentParams, nodes: newNodes } as GraphParams,
      }
    })
  }, [])

  const handleAddNode = useCallback((shape?: AllNodeShapes) => {
    let label: string
    let nodeProps: Partial<GraphNode> = {}

    switch (shape) {
      case 'user':
        label = `User ${params.nodes.filter(n => n.shape === 'user').length + 1}`
        nodeProps = { shape: 'user', color: '#3b82f6' }
        break
      case 'group':
        label = `Group ${params.nodes.filter(n => n.shape === 'group').length + 1}`
        nodeProps = { shape: 'group', color: '#94a3b8', width: 200, height: 120 }
        break
      default:
        label = `Node ${params.nodes.filter(n => !n.shape || n.shape === 'rect').length + 1}`
        nodeProps = { shape: 'rect' }
    }

    const newNode: GraphNode = {
      id: crypto.randomUUID(),
      label,
      ...nodeProps,
    }
    handleUpdateParams({ nodes: [...params.nodes, newNode] })
    setSelectedNodeId(newNode.id)
  }, [params.nodes, handleUpdateParams])

  const handleRemoveNode = useCallback((id: string) => {
    const newNodes = params.nodes.filter(n => n.id !== id)
    const newEdges = params.edges.filter(e => e.from !== id && e.to !== id)
    handleUpdateParams({ nodes: newNodes, edges: newEdges })
    if (selectedNodeId === id) {
      setSelectedNodeId(null)
    }
  }, [params.nodes, params.edges, selectedNodeId, handleUpdateParams])

  const handleUpdateNodeLabel = useCallback((id: string, label: string) => {
    handleUpdateNode(id, { label })
  }, [handleUpdateNode])

  const handleAutoLayout = useCallback(() => {
    const layouted = autoLayoutNodes(params, canvasSize.width, canvasSize.height)
    handleUpdateParams({ nodes: layouted.nodes })
  }, [params, canvasSize, handleUpdateParams])

  const handleReset = useCallback(() => {
    setEditedFigure(figure)
    setSelectedNodeId(null)
    setZoom(100)
  }, [figure])

  const handleSave = useCallback(() => {
    onSave(editedFigure)
  }, [editedFigure, onSave])

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 25, 200))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 25, 50))
  }, [])

  const handleZoomReset = useCallback(() => {
    setZoom(100)
  }, [])

  const handleZoomChange = useCallback((value: number | readonly number[]) => {
    if (typeof value === 'number') {
      setZoom(value)
    } else {
      setZoom(value[0])
    }
  }, [])

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex gap-2 items-center">
          <Button variant="outline" size="sm" onClick={handleAutoLayout}>
            <LayoutGrid className="h-4 w-4 mr-1" />
            自動整列
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1" />
            リセット
          </Button>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2 ml-4 px-3 py-1 border rounded-md bg-muted/30">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Slider
              value={[zoom]}
              onValueChange={handleZoomChange}
              min={50}
              max={200}
              step={25}
              className="w-24"
            />
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground w-10 text-center">{zoom}%</span>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleZoomReset}>
              <Maximize2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            キャンセル
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-1" />
            保存
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Canvas Container with Scroll */}
        <div className="flex-1 border rounded-lg bg-gray-50 overflow-auto">
          <div
            className="p-4"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top left',
              width: `${100 / (zoom / 100)}%`,
              height: `${100 / (zoom / 100)}%`,
            }}
          >
            <FigureCanvas
              params={params}
              primaryColor={editedFigure.style.primaryColor}
              width={canvasSize.width}
              height={canvasSize.height}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              onUpdateNode={handleUpdateNode}
              figureType={figureType}
            />
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-72 flex flex-col gap-4 overflow-y-auto flex-shrink-0">
          <NodeList
            nodes={params.nodes}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            onAddNode={handleAddNode}
            onRemoveNode={handleRemoveNode}
            onUpdateNodeLabel={handleUpdateNodeLabel}
          />

          <PropertiesPanel
            params={params}
            selectedNodeId={selectedNodeId}
            primaryColor={editedFigure.style.primaryColor}
            onUpdateParams={handleUpdateParams}
            onUpdatePrimaryColor={handleUpdatePrimaryColor}
            onUpdateNode={handleUpdateNode}
          />
        </div>
      </div>

      {/* Info Bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground flex-shrink-0 px-2">
        <span>
          キャンバス: {canvasSize.width} x {canvasSize.height}px |
          ノード数: {params.nodes.length} |
          接続数: {params.edges.length}
        </span>
        <span>ノードをドラッグして移動できます</span>
      </div>
    </div>
  )
}
