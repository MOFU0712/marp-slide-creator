import type { GraphParams, GraphNode } from '@/types'

/**
 * Auto-layout nodes in a graph
 * Handles special node types (group, user) separately from regular nodes
 */
export function autoLayoutNodes(
  params: GraphParams,
  width: number,
  height: number
): GraphParams {
  const { nodes, direction } = params

  if (nodes.length === 0) return params

  const padding = 80
  const nodeWidth = 120
  const nodeHeight = 50
  const isHorizontal = direction === 'horizontal'

  // Separate nodes by type
  const groupNodes = nodes.filter(n => n.shape === 'group')
  const regularNodes = nodes.filter(n => n.shape !== 'group')

  // Layout regular nodes (excluding groups)
  const regularCount = regularNodes.length
  const spacing = isHorizontal
    ? (width - padding * 2 - nodeWidth) / Math.max(regularCount - 1, 1)
    : (height - padding * 2 - nodeHeight) / Math.max(regularCount - 1, 1)

  const layoutedRegularNodes = regularNodes.map((node, index) => ({
    ...node,
    x: node.x !== undefined ? node.x : (isHorizontal
      ? padding + nodeWidth / 2 + index * spacing
      : width / 2),
    y: node.y !== undefined ? node.y : (isHorizontal
      ? height / 2
      : padding + nodeHeight / 2 + index * spacing),
  }))

  // Layout group nodes - position them around the diagram
  const layoutedGroupNodes = groupNodes.map((node, index) => {
    // If already positioned, keep position
    if (node.x !== undefined && node.y !== undefined) {
      return node
    }

    // Position groups at the bottom or offset positions
    const groupWidth = node.width || 200
    const groupHeight = node.height || 120

    // Calculate a sensible position for new groups
    // Spread them horizontally if multiple groups
    const groupSpacing = (width - padding * 2) / Math.max(groupNodes.length, 1)
    const xPos = padding + groupSpacing * index + groupSpacing / 2
    const yPos = isHorizontal ? height - groupHeight / 2 - 20 : height / 2 + 100 + index * 140

    return {
      ...node,
      x: Math.min(Math.max(xPos, groupWidth / 2 + 20), width - groupWidth / 2 - 20),
      y: Math.min(Math.max(yPos, groupHeight / 2 + 40), height - groupHeight / 2 - 20),
    }
  })

  // Combine all nodes back together, preserving original order
  const layoutedNodes: GraphNode[] = nodes.map(node => {
    if (node.shape === 'group') {
      return layoutedGroupNodes.find(n => n.id === node.id) || node
    }
    return layoutedRegularNodes.find(n => n.id === node.id) || node
  })

  return {
    ...params,
    nodes: layoutedNodes,
  }
}

/**
 * Calculate positions for tree layout
 */
export function treeLayout(
  params: GraphParams,
  width: number,
  height: number
): GraphParams {
  const { nodes, edges, direction } = params

  if (nodes.length === 0) return params

  // Build adjacency list
  const children = new Map<string, string[]>()
  const hasParent = new Set<string>()

  for (const edge of edges) {
    if (!children.has(edge.from)) {
      children.set(edge.from, [])
    }
    children.get(edge.from)!.push(edge.to)
    hasParent.add(edge.to)
  }

  // Find root nodes (no parent)
  const roots = nodes.filter(n => !hasParent.has(n.id))
  if (roots.length === 0 && nodes.length > 0) {
    // Circular reference, use first node as root
    roots.push(nodes[0])
  }

  // Calculate levels
  const levels = new Map<string, number>()
  const queue = roots.map(r => ({ id: r.id, level: 0 }))

  while (queue.length > 0) {
    const { id, level } = queue.shift()!
    if (levels.has(id)) continue
    levels.set(id, level)

    const nodeChildren = children.get(id) || []
    for (const childId of nodeChildren) {
      queue.push({ id: childId, level: level + 1 })
    }
  }

  // Group nodes by level
  const levelGroups = new Map<number, string[]>()
  for (const [id, level] of levels) {
    if (!levelGroups.has(level)) {
      levelGroups.set(level, [])
    }
    levelGroups.get(level)!.push(id)
  }

  const maxLevel = Math.max(...levels.values(), 0)
  const padding = 60
  const nodeWidth = 100
  const nodeHeight = 40
  const isHorizontal = direction === 'horizontal'

  const layoutedNodes = nodes.map(node => {
    const level = levels.get(node.id) ?? 0
    const group = levelGroups.get(level) || [node.id]
    const indexInGroup = group.indexOf(node.id)
    const groupSize = group.length

    let x: number
    let y: number

    if (isHorizontal) {
      const levelSpacing = (width - padding * 2 - nodeWidth) / Math.max(maxLevel, 1)
      const verticalSpacing = (height - padding * 2) / Math.max(groupSize, 1)
      x = padding + nodeWidth / 2 + level * levelSpacing
      y = padding + verticalSpacing / 2 + indexInGroup * verticalSpacing
    } else {
      const levelSpacing = (height - padding * 2 - nodeHeight) / Math.max(maxLevel, 1)
      const horizontalSpacing = (width - padding * 2) / Math.max(groupSize, 1)
      x = padding + horizontalSpacing / 2 + indexInGroup * horizontalSpacing
      y = padding + nodeHeight / 2 + level * levelSpacing
    }

    return { ...node, x, y }
  })

  return {
    ...params,
    nodes: layoutedNodes,
  }
}

/**
 * Snap position to grid
 */
export function snapToGrid(x: number, y: number, gridSize: number = 20): { x: number; y: number } {
  return {
    x: Math.round(x / gridSize) * gridSize,
    y: Math.round(y / gridSize) * gridSize,
  }
}
