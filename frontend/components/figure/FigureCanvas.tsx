'use client'

import { useCallback, useRef, useState } from 'react'
import type { GraphParams, GraphNode } from '@/types'
import { snapToGrid } from '@/lib/auto-layout'

type Props = {
  params: GraphParams
  primaryColor: string
  width: number
  height: number
  selectedNodeId: string | null
  onSelectNode: (id: string | null) => void
  onUpdateNode: (id: string, updates: Partial<GraphNode>) => void
  figureType: 'architecture' | 'flow'
}

export function FigureCanvas({
  params,
  primaryColor,
  width,
  height,
  selectedNodeId,
  onSelectNode,
  onUpdateNode,
  figureType,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number; nodeX: number; nodeY: number } | null>(null)

  const { nodes, edges, direction } = params
  const isHorizontal = direction === 'horizontal'
  const nodeWidth = 120
  const nodeHeight = 50
  const padding = 80

  // Separate regular nodes from group nodes for positioning
  const regularNodes = nodes.filter(n => n.shape !== 'group')
  const groupNodes = nodes.filter(n => n.shape === 'group')

  // Calculate spacing based on regular nodes only
  const regularCount = regularNodes.length
  const spacing = isHorizontal
    ? (width - padding * 2 - nodeWidth) / Math.max(regularCount - 1, 1)
    : (height - padding * 2 - nodeHeight) / Math.max(regularCount - 1, 1)

  // Calculate node positions - handle regular nodes and group nodes separately
  const nodePositions = nodes.map((node) => {
    // If node already has position, use it
    if (node.x !== undefined && node.y !== undefined) {
      return { ...node, x: node.x, y: node.y }
    }

    // Group nodes get special positioning
    if (node.shape === 'group') {
      const groupIndex = groupNodes.findIndex(g => g.id === node.id)
      const groupWidth = node.width || 200
      const groupHeight = node.height || 120
      const groupSpacing = (width - padding * 2) / Math.max(groupNodes.length, 1)

      return {
        ...node,
        x: padding + groupSpacing * groupIndex + groupSpacing / 2,
        y: height - groupHeight / 2 - 30,
      }
    }

    // Regular nodes use linear layout
    const regularIndex = regularNodes.findIndex(n => n.id === node.id)
    return {
      ...node,
      x: isHorizontal ? padding + nodeWidth / 2 + regularIndex * spacing : width / 2,
      y: isHorizontal ? height / 2 - 30 : padding + nodeHeight / 2 + regularIndex * spacing,
    }
  })

  const getNode = (id: string) => nodePositions.find(n => n.id === id)

  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    const node = nodePositions.find(n => n.id === nodeId)
    if (!node) return

    onSelectNode(nodeId)
    setDragging({
      id: nodeId,
      startX: e.clientX,
      startY: e.clientY,
      nodeX: node.x,
      nodeY: node.y,
    })
  }, [onSelectNode, nodePositions])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return

    const dx = e.clientX - dragging.startX
    const dy = e.clientY - dragging.startY

    // Get the dragged node to determine its size for boundary calculation
    const draggedNode = nodes.find(n => n.id === dragging.id)
    const isGroup = draggedNode?.shape === 'group'
    const effectiveWidth = isGroup ? (draggedNode?.width || 200) : nodeWidth
    const effectiveHeight = isGroup ? (draggedNode?.height || 120) : nodeHeight

    const newX = Math.max(effectiveWidth / 2 + 10, Math.min(width - effectiveWidth / 2 - 10, dragging.nodeX + dx))
    const newY = Math.max(effectiveHeight / 2 + 10, Math.min(height - effectiveHeight / 2 - 10, dragging.nodeY + dy))

    const snapped = snapToGrid(newX, newY)
    onUpdateNode(dragging.id, { x: snapped.x, y: snapped.y })
  }, [dragging, width, height, nodes, onUpdateNode])

  const handleMouseUp = useCallback(() => {
    setDragging(null)
  }, [])

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === svgRef.current) {
      onSelectNode(null)
    }
  }, [onSelectNode])

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="bg-white rounded-lg border cursor-crosshair"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleCanvasClick}
    >
      {/* Grid */}
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="0.5" />
        </pattern>
        <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <path d="M0,0 L0,6 L9,3 z" fill={primaryColor} />
        </marker>
      </defs>
      <rect width={width} height={height} fill="url(#grid)" />

      {/* Edges */}
      {edges.map((edge, index) => {
        const from = getNode(edge.from)
        const to = getNode(edge.to)
        if (!from || !to) return null

        const startX = isHorizontal ? from.x + nodeWidth / 2 : from.x
        const startY = isHorizontal ? from.y : from.y + nodeHeight / 2
        const endX = isHorizontal ? to.x - nodeWidth / 2 : to.x
        const endY = isHorizontal ? to.y : to.y - nodeHeight / 2

        return (
          <g key={`edge-${index}`}>
            <line
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke={primaryColor}
              strokeWidth="2"
              markerEnd="url(#arrow)"
            />
            {edge.label && (
              <text
                x={(startX + endX) / 2}
                y={(startY + endY) / 2 - 5}
                textAnchor="middle"
                fill="#6b7280"
                fontSize="10"
              >
                {edge.label}
              </text>
            )}
          </g>
        )
      })}

      {/* Type indicator */}
      <g>
        <rect
          x={10}
          y={10}
          width={figureType === 'flow' ? 60 : 90}
          height={22}
          rx={11}
          fill={figureType === 'flow' ? '#EEF2FF' : '#F0FDF4'}
        />
        <text
          x={figureType === 'flow' ? 40 : 55}
          y={25}
          fontSize="11"
          fill={figureType === 'flow' ? '#4F46E5' : '#16A34A'}
          fontWeight="500"
          textAnchor="middle"
        >
          {figureType === 'flow' ? 'フロー' : 'アーキテクチャ'}
        </text>
      </g>

      {/* Group nodes (rendered first as background) */}
      {nodePositions
        .filter(node => node.shape === 'group')
        .map((node) => {
          const isSelected = node.id === selectedNodeId
          const groupWidth = node.width || nodeWidth * 2
          const groupHeight = node.height || nodeHeight * 2
          const groupColor = node.color || '#94a3b8'

          return (
            <g
              key={node.id}
              onMouseDown={(e) => handleMouseDown(e, node.id)}
              style={{ cursor: dragging?.id === node.id ? 'grabbing' : 'grab' }}
            >
              {/* Selection highlight */}
              {isSelected && (
                <rect
                  x={node.x - groupWidth / 2 - 4}
                  y={node.y - groupHeight / 2 - 4}
                  width={groupWidth + 8}
                  height={groupHeight + 8}
                  fill="none"
                  stroke={primaryColor}
                  strokeWidth="2"
                  strokeDasharray="4,2"
                  rx={16}
                />
              )}
              <rect
                x={node.x - groupWidth / 2}
                y={node.y - groupHeight / 2}
                width={groupWidth}
                height={groupHeight}
                fill="none"
                stroke={groupColor}
                strokeWidth="2"
                strokeDasharray="6,3"
                rx={12}
                className="transition-all hover:stroke-opacity-80"
              />
              {/* Group label at top-left */}
              {node.label && (
                <text
                  x={node.x - groupWidth / 2 + 10}
                  y={node.y - groupHeight / 2 + 18}
                  textAnchor="start"
                  fill={groupColor}
                  fontSize="11"
                  fontWeight="500"
                  style={{ pointerEvents: 'none' }}
                >
                  {node.label}
                </text>
              )}
            </g>
          )
        })}

      {/* Regular Nodes */}
      {nodePositions
        .filter(node => node.shape !== 'group')
        .map((node, index) => {
          const isSelected = node.id === selectedNodeId
          const rx = figureType === 'flow' ? 20 : 6
          const isUserShape = node.shape === 'user'

          // Different color schemes for flow vs architecture
          const flowColors = [primaryColor, '#6366F1', '#8B5CF6', '#A855F7']
          const fillColor = figureType === 'flow'
            ? (node.color || flowColors[index % flowColors.length])
            : (node.color || (index === 0 ? primaryColor : '#7B6FCF'))

          if (isUserShape) {
            // User shape - person silhouette
            const headRadius = nodeHeight * 0.25
            const bodyWidth = nodeWidth * 0.6

            return (
              <g
                key={node.id}
                onMouseDown={(e) => handleMouseDown(e, node.id)}
                style={{ cursor: dragging?.id === node.id ? 'grabbing' : 'grab' }}
              >
                {/* Selection highlight */}
                {isSelected && (
                  <rect
                    x={node.x - nodeWidth / 2 - 4}
                    y={node.y - nodeHeight / 2 - 4}
                    width={nodeWidth + 8}
                    height={nodeHeight + 30}
                    fill="none"
                    stroke={primaryColor}
                    strokeWidth="2"
                    strokeDasharray="4,2"
                    rx={8}
                  />
                )}
                {/* Head */}
                <circle
                  cx={node.x}
                  cy={node.y - nodeHeight * 0.15}
                  r={headRadius}
                  fill={fillColor}
                  filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                  className="transition-all hover:opacity-90"
                />
                {/* Body */}
                <path
                  d={`
                    M ${node.x - bodyWidth / 2} ${node.y + nodeHeight * 0.4}
                    Q ${node.x - bodyWidth / 2} ${node.y + nodeHeight * 0.1}
                      ${node.x} ${node.y + nodeHeight * 0.1}
                    Q ${node.x + bodyWidth / 2} ${node.y + nodeHeight * 0.1}
                      ${node.x + bodyWidth / 2} ${node.y + nodeHeight * 0.4}
                    Z
                  `}
                  fill={fillColor}
                  filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                  className="transition-all hover:opacity-90"
                />
                {/* Label below */}
                <text
                  x={node.x}
                  y={node.y + nodeHeight / 2 + 15}
                  textAnchor="middle"
                  fill="#374151"
                  fontSize="11"
                  fontWeight="500"
                  style={{ pointerEvents: 'none' }}
                >
                  {node.label}
                </text>
              </g>
            )
          }

          return (
            <g
              key={node.id}
              onMouseDown={(e) => handleMouseDown(e, node.id)}
              style={{ cursor: dragging?.id === node.id ? 'grabbing' : 'grab' }}
            >
              {/* Selection highlight */}
              {isSelected && (
                <rect
                  x={node.x - nodeWidth / 2 - 4}
                  y={node.y - nodeHeight / 2 - 4}
                  width={nodeWidth + 8}
                  height={nodeHeight + 8}
                  fill="none"
                  stroke={primaryColor}
                  strokeWidth="2"
                  strokeDasharray="4,2"
                  rx={rx + 4}
                />
              )}
              <rect
                x={node.x - nodeWidth / 2}
                y={node.y - nodeHeight / 2}
                width={nodeWidth}
                height={nodeHeight}
                fill={fillColor}
                rx={rx}
                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                className="transition-all hover:opacity-90"
              />
              <text
                x={node.x}
                y={node.y + 5}
                textAnchor="middle"
                fill="white"
                fontSize="12"
                fontWeight="500"
                style={{ pointerEvents: 'none' }}
              >
                {node.label}
              </text>
            </g>
          )
        })}
    </svg>
  )
}
