import type { Figure, GraphParams, BarChartParams, TimelineParams, ComparisonParams } from '@/types'

/**
 * Generate SVG string from figure parameters
 * This is used for Marp markdown export
 */
export function generateFigureSvg(figure: Figure): string {
  const { type, params, style } = figure
  const scale = style.scale ?? 1

  let svg: string
  switch (type) {
    case 'architecture':
    case 'flow':
      svg = generateGraphSvg(params as GraphParams, style.primaryColor, type)
      break
    case 'bar_chart':
      svg = generateBarChartSvg(params as BarChartParams, style.primaryColor)
      break
    case 'timeline':
      svg = generateTimelineSvg(params as TimelineParams, style.primaryColor)
      break
    case 'comparison':
      svg = generateComparisonSvg(params as ComparisonParams, style.primaryColor)
      break
    default:
      return `<!-- Unknown figure type: ${type} -->`
  }

  // Apply scale if not 1
  if (scale !== 1) {
    // Wrap in a centered container div with transform scale
    return `<div style="display: flex; justify-content: center; width: 100%;">
<div style="transform: scale(${scale}); transform-origin: center center;">
${svg}
</div>
</div>`
  }

  // Wrap in centered container even without scale for consistency
  return `<div style="display: flex; justify-content: center; width: 100%;">
${svg}
</div>`
}

function generateGraphSvg(params: GraphParams, primaryColor: string, type: string): string {
  const { nodes, edges, direction } = params
  const width = 600
  const height = 300
  const isHorizontal = direction === 'horizontal'
  const padding = 60

  // Filter out group nodes for spacing calculation
  const regularNodes = nodes.filter(n => n.shape !== 'group')
  const spacing = isHorizontal
    ? (width - padding * 2) / Math.max(regularNodes.length - 1, 1)
    : (height - padding * 2) / Math.max(regularNodes.length - 1, 1)

  const nodeWidth = 100
  const nodeHeight = 40

  // Calculate positions
  let regularIndex = 0
  const nodePositions = nodes.map((node) => {
    if (node.shape === 'group') {
      return {
        ...node,
        x: node.x ?? width / 2,
        y: node.y ?? height / 2,
      }
    }
    const pos = {
      ...node,
      x: node.x ?? (isHorizontal ? padding + regularIndex * spacing : width / 2),
      y: node.y ?? (isHorizontal ? height / 2 : padding + regularIndex * spacing),
    }
    regularIndex++
    return pos
  })

  const getNode = (id: string) => nodePositions.find(n => n.id === id)

  // Build SVG
  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">\n`
  svg += `  <defs>\n`
  svg += `    <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">\n`
  svg += `      <path d="M0,0 L0,6 L9,3 z" fill="${primaryColor}"/>\n`
  svg += `    </marker>\n`
  svg += `  </defs>\n`

  // Group nodes (rendered first as background)
  for (const node of nodePositions.filter(n => n.shape === 'group')) {
    const groupWidth = node.width || nodeWidth * 2
    const groupHeight = node.height || nodeHeight * 2
    const groupColor = node.color || '#94a3b8'
    svg += `  <rect x="${node.x - groupWidth / 2}" y="${node.y - groupHeight / 2}" width="${groupWidth}" height="${groupHeight}" fill="none" stroke="${groupColor}" stroke-width="2" stroke-dasharray="6,3" rx="12"/>\n`
    if (node.label) {
      svg += `  <text x="${node.x - groupWidth / 2 + 10}" y="${node.y - groupHeight / 2 + 18}" text-anchor="start" fill="${groupColor}" font-size="11" font-weight="500">${escapeXml(node.label)}</text>\n`
    }
  }

  // Edges
  for (const edge of edges) {
    const from = getNode(edge.from)
    const to = getNode(edge.to)
    if (!from || !to) continue

    const startX = isHorizontal ? from.x + nodeWidth / 2 : from.x
    const startY = isHorizontal ? from.y : from.y + nodeHeight / 2
    const endX = isHorizontal ? to.x - nodeWidth / 2 : to.x
    const endY = isHorizontal ? to.y : to.y - nodeHeight / 2

    svg += `  <line x1="${startX}" y1="${startY}" x2="${endX}" y2="${endY}" stroke="${primaryColor}" stroke-width="2" marker-end="url(#arrow)"/>\n`
  }

  // Regular nodes
  let colorIndex = 0
  for (const node of nodePositions.filter(n => n.shape !== 'group')) {
    const rx = type === 'flow' ? 20 : 6
    const color = node.color || (colorIndex === 0 ? primaryColor : '#7B6FCF')

    if (node.shape === 'user') {
      // User shape - person silhouette
      const headRadius = nodeHeight * 0.25
      const bodyWidth = nodeWidth * 0.6
      svg += `  <circle cx="${node.x}" cy="${node.y - nodeHeight * 0.15}" r="${headRadius}" fill="${color}"/>\n`
      svg += `  <path d="M ${node.x - bodyWidth / 2} ${node.y + nodeHeight * 0.4} Q ${node.x - bodyWidth / 2} ${node.y + nodeHeight * 0.1} ${node.x} ${node.y + nodeHeight * 0.1} Q ${node.x + bodyWidth / 2} ${node.y + nodeHeight * 0.1} ${node.x + bodyWidth / 2} ${node.y + nodeHeight * 0.4} Z" fill="${color}"/>\n`
      svg += `  <text x="${node.x}" y="${node.y + nodeHeight / 2 + 15}" text-anchor="middle" fill="#374151" font-size="11" font-weight="500">${escapeXml(node.label)}</text>\n`
    } else {
      // Regular node shapes
      svg += `  <rect x="${node.x - nodeWidth / 2}" y="${node.y - nodeHeight / 2}" width="${nodeWidth}" height="${nodeHeight}" fill="${color}" rx="${rx}"/>\n`
      svg += `  <text x="${node.x}" y="${node.y + 5}" text-anchor="middle" fill="white" font-size="12" font-weight="500">${escapeXml(node.label)}</text>\n`
    }
    colorIndex++
  }

  svg += `</svg>`
  return svg
}

function generateBarChartSvg(params: BarChartParams, primaryColor: string): string {
  const { labels, values, unit, targetLine } = params
  const width = 500
  const height = 300
  const padding = { top: 30, right: 30, bottom: 50, left: 50 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  const maxValue = Math.max(...values, targetLine || 0) * 1.1
  const barWidth = chartWidth / labels.length * 0.7
  const barGap = chartWidth / labels.length * 0.3

  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">\n`

  // Y-axis lines
  for (const percent of [0, 50, 100]) {
    const y = padding.top + chartHeight * (1 - percent / 100)
    const value = Math.round(maxValue * percent / 100)
    svg += `  <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#e5e7eb" stroke-dasharray="${percent === 0 ? '' : '4,4'}"/>\n`
    svg += `  <text x="${padding.left - 8}" y="${y + 4}" text-anchor="end" fill="#6b7280" font-size="10">${value}${unit}</text>\n`
  }

  // Bars
  for (let i = 0; i < values.length; i++) {
    const barHeight = (values[i] / maxValue) * chartHeight
    const x = padding.left + i * (barWidth + barGap) + barGap / 2
    const y = padding.top + chartHeight - barHeight

    svg += `  <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${primaryColor}" rx="3"/>\n`
    svg += `  <text x="${x + barWidth / 2}" y="${y - 5}" text-anchor="middle" fill="${primaryColor}" font-size="11" font-weight="bold">${values[i]}${unit}</text>\n`
    svg += `  <text x="${x + barWidth / 2}" y="${height - padding.bottom + 15}" text-anchor="middle" fill="#374151" font-size="10">${escapeXml(labels[i])}</text>\n`
  }

  // Target line
  if (targetLine) {
    const y = padding.top + chartHeight * (1 - targetLine / maxValue)
    svg += `  <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#ef4444" stroke-width="2" stroke-dasharray="6,3"/>\n`
  }

  svg += `</svg>`
  return svg
}

function generateTimelineSvg(params: TimelineParams, primaryColor: string): string {
  const { items } = params
  const width = 600
  const height = 150
  const padding = { left: 30, right: 30 }
  const lineY = height / 2
  const lineWidth = width - padding.left - padding.right
  const itemSpacing = lineWidth / Math.max(items.length - 1, 1)

  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">\n`

  // Background line
  svg += `  <line x1="${padding.left}" y1="${lineY}" x2="${width - padding.right}" y2="${lineY}" stroke="#e5e7eb" stroke-width="3" stroke-linecap="round"/>\n`

  // Progress line
  const doneCount = items.filter(i => i.done).length
  if (doneCount > 0) {
    svg += `  <line x1="${padding.left}" y1="${lineY}" x2="${padding.left + itemSpacing * (doneCount - 1)}" y2="${lineY}" stroke="${primaryColor}" stroke-width="3" stroke-linecap="round"/>\n`
  }

  // Items
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const x = padding.left + i * itemSpacing
    const isAbove = i % 2 === 0

    svg += `  <circle cx="${x}" cy="${lineY}" r="${item.done ? 10 : 8}" fill="${item.done ? primaryColor : 'white'}" stroke="${item.done ? primaryColor : '#d1d5db'}" stroke-width="2"/>\n`

    if (item.done) {
      svg += `  <path d="M ${x - 3} ${lineY} L ${x} ${lineY + 2} L ${x + 4} ${lineY - 3}" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>\n`
    }

    const textY = isAbove ? lineY - 35 : lineY + 40
    svg += `  <text x="${x}" y="${textY}" text-anchor="middle" fill="#6b7280" font-size="9">${escapeXml(item.date)}</text>\n`
    svg += `  <text x="${x}" y="${textY + (isAbove ? -12 : 12)}" text-anchor="middle" fill="${item.done ? primaryColor : '#374151'}" font-size="11" font-weight="500">${escapeXml(item.label)}</text>\n`
  }

  svg += `</svg>`
  return svg
}

function generateComparisonSvg(params: ComparisonParams, primaryColor: string): string {
  const { headers, rows, recommended } = params
  const cellPadding = 12
  const headerHeight = 40
  const rowHeight = 40
  const colWidth = 120
  const width = colWidth * headers.length + 2
  const height = headerHeight + rows.length * rowHeight + 2

  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">\n`

  // Table border
  svg += `  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" fill="none" stroke="#e5e7eb" rx="6"/>\n`

  // Header
  svg += `  <rect x="1" y="1" width="${width - 2}" height="${headerHeight}" fill="${primaryColor}" rx="6"/>\n`
  svg += `  <rect x="1" y="${headerHeight - 6}" width="${width - 2}" height="8" fill="${primaryColor}"/>\n`

  // Header texts
  for (let i = 0; i < headers.length; i++) {
    svg += `  <text x="${colWidth * i + colWidth / 2}" y="${headerHeight / 2 + 5}" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${escapeXml(headers[i])}</text>\n`
    if (i > 0) {
      svg += `  <line x1="${colWidth * i}" y1="1" x2="${colWidth * i}" y2="${height - 1}" stroke="#e5e7eb"/>\n`
    }
  }

  // Rows
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]
    const y = headerHeight + r * rowHeight

    if (r > 0) {
      svg += `  <line x1="1" y1="${y}" x2="${width - 1}" y2="${y}" stroke="#e5e7eb"/>\n`
    }

    // Recommended column highlight
    if (recommended !== undefined && recommended > 0) {
      svg += `  <rect x="${colWidth * recommended + 1}" y="${y + 1}" width="${colWidth - 2}" height="${rowHeight - 2}" fill="${primaryColor}10"/>\n`
    }

    // Label
    svg += `  <text x="${cellPadding}" y="${y + rowHeight / 2 + 4}" fill="#374151" font-size="11" font-weight="500">${escapeXml(row.label)}</text>\n`

    // Values
    for (let c = 0; c < row.values.length; c++) {
      const isRecommended = recommended === c + 1
      svg += `  <text x="${colWidth * (c + 1) + colWidth / 2}" y="${y + rowHeight / 2 + 4}" text-anchor="middle" fill="${isRecommended ? primaryColor : '#6b7280'}" font-size="11" font-weight="${isRecommended ? '600' : '400'}">${escapeXml(row.values[c])}</text>\n`
    }
  }

  svg += `</svg>`
  return svg
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
