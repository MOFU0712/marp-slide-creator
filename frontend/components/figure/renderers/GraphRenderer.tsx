'use client'

import { useId } from 'react'
import type { GraphParams, FigureStyle, GraphNode } from '@/types'

type Props = {
  params: GraphParams
  style: FigureStyle
  width?: number
  height?: number
}

type NodeWithPosition = GraphNode & { x: number; y: number; width?: number; height?: number }

// Render different node shapes
function renderNodeShape(
  node: NodeWithPosition,
  nodeWidth: number,
  nodeHeight: number,
  fillColor: string,
  type: 'architecture' | 'flow'
) {
  const shape = node.shape || (type === 'flow' ? 'rect' : 'rect')

  switch (shape) {
    // Flow chart shapes
    case 'oval':
      return (
        <ellipse
          cx={node.x}
          cy={node.y}
          rx={nodeWidth / 2}
          ry={nodeHeight / 2}
          fill={fillColor}
          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
        />
      )

    case 'diamond': {
      const dw = nodeWidth / 2
      const dh = nodeHeight / 2
      return (
        <polygon
          points={`${node.x},${node.y - dh} ${node.x + dw},${node.y} ${node.x},${node.y + dh} ${node.x - dw},${node.y}`}
          fill={fillColor}
          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
        />
      )
    }

    case 'parallelogram': {
      const offset = 15
      return (
        <polygon
          points={`
            ${node.x - nodeWidth / 2 + offset},${node.y - nodeHeight / 2}
            ${node.x + nodeWidth / 2 + offset},${node.y - nodeHeight / 2}
            ${node.x + nodeWidth / 2 - offset},${node.y + nodeHeight / 2}
            ${node.x - nodeWidth / 2 - offset},${node.y + nodeHeight / 2}
          `}
          fill={fillColor}
          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
        />
      )
    }

    // Architecture diagram shapes
    case 'cylinder': {
      const cylWidth = nodeWidth * 0.8
      const cylHeight = nodeHeight
      const ellipseHeight = 10
      return (
        <g>
          {/* Bottom ellipse */}
          <ellipse
            cx={node.x}
            cy={node.y + cylHeight / 2 - ellipseHeight / 2}
            rx={cylWidth / 2}
            ry={ellipseHeight}
            fill={fillColor}
            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
          />
          {/* Body */}
          <rect
            x={node.x - cylWidth / 2}
            y={node.y - cylHeight / 2 + ellipseHeight / 2}
            width={cylWidth}
            height={cylHeight - ellipseHeight}
            fill={fillColor}
          />
          {/* Top ellipse */}
          <ellipse
            cx={node.x}
            cy={node.y - cylHeight / 2 + ellipseHeight / 2}
            rx={cylWidth / 2}
            ry={ellipseHeight}
            fill={fillColor}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1"
          />
        </g>
      )
    }

    case 'cloud': {
      const cw = nodeWidth / 2
      const ch = nodeHeight / 2
      return (
        <path
          d={`
            M ${node.x - cw * 0.6} ${node.y + ch * 0.3}
            Q ${node.x - cw} ${node.y} ${node.x - cw * 0.5} ${node.y - ch * 0.5}
            Q ${node.x - cw * 0.3} ${node.y - ch} ${node.x} ${node.y - ch * 0.7}
            Q ${node.x + cw * 0.3} ${node.y - ch} ${node.x + cw * 0.5} ${node.y - ch * 0.5}
            Q ${node.x + cw} ${node.y} ${node.x + cw * 0.6} ${node.y + ch * 0.3}
            Q ${node.x + cw * 0.8} ${node.y + ch} ${node.x} ${node.y + ch * 0.7}
            Q ${node.x - cw * 0.8} ${node.y + ch} ${node.x - cw * 0.6} ${node.y + ch * 0.3}
            Z
          `}
          fill={fillColor}
          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
        />
      )
    }

    case 'hexagon': {
      const hx = nodeWidth / 2
      const hy = nodeHeight / 2
      const inset = nodeWidth * 0.15
      return (
        <polygon
          points={`
            ${node.x - hx + inset},${node.y - hy}
            ${node.x + hx - inset},${node.y - hy}
            ${node.x + hx},${node.y}
            ${node.x + hx - inset},${node.y + hy}
            ${node.x - hx + inset},${node.y + hy}
            ${node.x - hx},${node.y}
          `}
          fill={fillColor}
          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
        />
      )
    }

    // Special shapes
    case 'user': {
      // Person silhouette icon
      const headRadius = nodeHeight * 0.25
      const bodyWidth = nodeWidth * 0.6
      return (
        <g filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))">
          {/* Head */}
          <circle
            cx={node.x}
            cy={node.y - nodeHeight * 0.15}
            r={headRadius}
            fill={fillColor}
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
          />
        </g>
      )
    }

    case 'group': {
      // Rounded rectangle container with no fill (border only)
      const groupWidth = node.width || nodeWidth * 2
      const groupHeight = node.height || nodeHeight * 2
      return (
        <rect
          x={node.x - groupWidth / 2}
          y={node.y - groupHeight / 2}
          width={groupWidth}
          height={groupHeight}
          fill="none"
          stroke={fillColor}
          strokeWidth="2"
          strokeDasharray="6,3"
          rx={12}
          filter="drop-shadow(0 1px 2px rgba(0,0,0,0.05))"
        />
      )
    }

    case 'rect':
    default: {
      // Architecture: sharp corners with subtle rounding
      // Flow: more rounded corners
      const rx = type === 'flow' ? 20 : 6
      return (
        <rect
          x={node.x - nodeWidth / 2}
          y={node.y - nodeHeight / 2}
          width={nodeWidth}
          height={nodeHeight}
          fill={fillColor}
          rx={rx}
          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
        />
      )
    }
  }
}

export function GraphRenderer({ params, style, width = 700, height = 400 }: Props) {
  // useId must be called before any early returns (Rules of Hooks)
  const uniqueId = useId()

  const { nodes = [], edges = [], direction = 'horizontal', type = 'architecture' } = params || {}
  const { primaryColor, secondaryColor = '#7B6FCF' } = style

  if (nodes.length === 0) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <rect width={width} height={height} fill="white" />
        <text x={width / 2} y={height / 2} textAnchor="middle" fill="#9ca3af" fontSize="14">
          データがありません
        </text>
      </svg>
    )
  }

  // Calculate node positions if not provided
  const isHorizontal = direction === 'horizontal'
  const padding = 80
  const nodeWidth = 120
  const nodeHeight = 50

  // Separate regular nodes from group nodes for positioning
  const regularNodes = nodes.filter(n => n.shape !== 'group')
  const groupNodes = nodes.filter(n => n.shape === 'group')
  const regularCount = regularNodes.length

  const spacing = isHorizontal
    ? (width - padding * 2 - nodeWidth) / Math.max(regularCount - 1, 1)
    : (height - padding * 2 - nodeHeight) / Math.max(regularCount - 1, 1)

  // Generate positions for nodes without explicit positions
  const nodesWithPositions: NodeWithPosition[] = nodes.map((node) => {
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

  // Get node by ID
  const getNode = (id: string) => nodesWithPositions.find(n => n.id === id)

  // Calculate edge path based on type
  const getEdgePath = (fromId: string, toId: string) => {
    const from = getNode(fromId)
    const to = getNode(toId)
    if (!from || !to) return ''

    const fromX = from.x
    const fromY = from.y
    const toX = to.x
    const toY = to.y

    // Calculate connection points
    let startX = fromX
    let startY = fromY
    let endX = toX
    let endY = toY

    if (isHorizontal) {
      startX = fromX + nodeWidth / 2
      endX = toX - nodeWidth / 2
    } else {
      startY = fromY + nodeHeight / 2
      endY = toY - nodeHeight / 2
    }

    // Create curved path for architecture, straight for flow
    const midX = (startX + endX) / 2
    const midY = (startY + endY) / 2

    if (type === 'flow') {
      // Straight line with arrow for flow
      return `M ${startX} ${startY} L ${endX} ${endY}`
    } else {
      // Curved line for architecture
      if (isHorizontal) {
        return `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`
      } else {
        return `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`
      }
    }
  }

  // Unique Arrow marker ID using React's useId for stability
  const arrowId = `arrow-${type}-${uniqueId}`

  // Different colors for flow vs architecture
  const getNodeColor = (index: number, node: GraphNode) => {
    if (node.color) return node.color

    if (type === 'flow') {
      // Flow: gradient based on position
      const colors = [primaryColor, '#6366F1', '#8B5CF6', '#A855F7']
      return colors[index % colors.length]
    } else {
      // Architecture: first node primary, rest secondary
      return index === 0 ? primaryColor : secondaryColor
    }
  }

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        {/* Arrow marker */}
        <marker
          id={arrowId}
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill={primaryColor} />
        </marker>
      </defs>

      {/* Background */}
      <rect width={width} height={height} fill="white" />

      {/* Type indicator badge */}
      <g>
        <rect
          x={10}
          y={10}
          width={type === 'flow' ? 60 : 90}
          height={22}
          rx={11}
          fill={type === 'flow' ? '#EEF2FF' : '#F0FDF4'}
        />
        <text
          x={type === 'flow' ? 40 : 55}
          y={25}
          fontSize="11"
          fill={type === 'flow' ? '#4F46E5' : '#16A34A'}
          fontWeight="500"
          textAnchor="middle"
        >
          {type === 'flow' ? 'フロー' : 'アーキテクチャ'}
        </text>
      </g>

      {/* Edges */}
      {edges.map((edge, index) => {
        const path = getEdgePath(edge.from, edge.to)
        if (!path) return null

        return (
          <g key={index}>
            <path
              d={path}
              fill="none"
              stroke={primaryColor}
              strokeWidth="2"
              markerEnd={`url(#${arrowId})`}
            />
            {edge.label && (
              <text
                x={(getNode(edge.from)!.x + getNode(edge.to)!.x) / 2}
                y={(getNode(edge.from)!.y + getNode(edge.to)!.y) / 2 - 10}
                textAnchor="middle"
                fontSize="11"
                fill="#6b7280"
              >
                {edge.label}
              </text>
            )}
          </g>
        )
      })}

      {/* Group nodes (rendered first as background) */}
      {nodesWithPositions
        .filter(node => node.shape === 'group')
        .map((node) => {
          const nodeColor = node.color || '#94a3b8'
          const groupWidth = node.width || nodeWidth * 2
          const groupHeight = node.height || nodeHeight * 2
          return (
            <g key={node.id}>
              {renderNodeShape(node, nodeWidth, nodeHeight, nodeColor, type)}
              {/* Group label at top-left corner */}
              {node.label && (
                <text
                  x={node.x - groupWidth / 2 + 10}
                  y={node.y - groupHeight / 2 + 18}
                  textAnchor="start"
                  fontSize="11"
                  fontWeight="500"
                  fill={nodeColor}
                >
                  {node.label}
                </text>
              )}
            </g>
          )
        })}

      {/* Regular nodes */}
      {nodesWithPositions
        .filter(node => node.shape !== 'group')
        .map((node, index) => {
          const nodeColor = getNodeColor(index, node)
          const isUserShape = node.shape === 'user'

          return (
            <g key={node.id}>
              {/* Node shape */}
              {renderNodeShape(node, nodeWidth, nodeHeight, nodeColor, type)}
              {/* Node label - below for user shape, centered for others */}
              <text
                x={node.x}
                y={isUserShape ? node.y + nodeHeight / 2 + 15 : node.y + 5}
                textAnchor="middle"
                fontSize={isUserShape ? '11' : '13'}
                fontWeight="500"
                fill={isUserShape ? '#374151' : 'white'}
              >
                {node.label}
              </text>
            </g>
          )
        })}
    </svg>
  )
}
