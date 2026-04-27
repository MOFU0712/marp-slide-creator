'use client'

import type { TimelineParams, FigureStyle } from '@/types'

type Props = {
  params: TimelineParams
  style: FigureStyle
  width?: number
  height?: number
}

export function TimelineRenderer({ params, style, width = 700, height = 200 }: Props) {
  const { items = [] } = params || {}
  const { primaryColor } = style

  const padding = { left: 40, right: 40 }
  const lineY = height / 2
  const lineWidth = width - padding.left - padding.right
  const itemSpacing = items.length > 1 ? lineWidth / (items.length - 1) : lineWidth

  if (items.length === 0) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <rect width={width} height={height} fill="white" />
        <text x={width / 2} y={height / 2} textAnchor="middle" fill="#9ca3af" fontSize="14">
          データがありません
        </text>
      </svg>
    )
  }

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Background */}
      <rect width={width} height={height} fill="white" />

      {/* Timeline line */}
      <line
        x1={padding.left}
        y1={lineY}
        x2={width - padding.right}
        y2={lineY}
        stroke="#e5e7eb"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Progress line (for done items) */}
      {items.length > 0 && (
        <line
          x1={padding.left}
          y1={lineY}
          x2={padding.left + itemSpacing * items.filter(i => i.done).length}
          y2={lineY}
          stroke={primaryColor}
          strokeWidth="4"
          strokeLinecap="round"
        />
      )}

      {/* Timeline items */}
      {items.map((item, index) => {
        const x = padding.left + index * itemSpacing
        const isAbove = index % 2 === 0

        return (
          <g key={index}>
            {/* Connector line */}
            <line
              x1={x}
              y1={lineY}
              x2={x}
              y2={isAbove ? lineY - 30 : lineY + 30}
              stroke={item.done ? primaryColor : '#d1d5db'}
              strokeWidth="2"
            />

            {/* Circle marker */}
            <circle
              cx={x}
              cy={lineY}
              r={item.done ? 12 : 10}
              fill={item.done ? primaryColor : 'white'}
              stroke={item.done ? primaryColor : '#d1d5db'}
              strokeWidth="3"
            />
            {item.done && (
              <path
                d={`M ${x - 4} ${lineY} L ${x - 1} ${lineY + 3} L ${x + 5} ${lineY - 3}`}
                stroke="white"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Date */}
            <text
              x={x}
              y={isAbove ? lineY - 45 : lineY + 55}
              textAnchor="middle"
              fontSize="11"
              fill="#6b7280"
            >
              {item.date}
            </text>

            {/* Label */}
            <text
              x={x}
              y={isAbove ? lineY - 60 : lineY + 70}
              textAnchor="middle"
              fontSize="13"
              fontWeight="500"
              fill={item.done ? primaryColor : '#374151'}
            >
              {item.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
