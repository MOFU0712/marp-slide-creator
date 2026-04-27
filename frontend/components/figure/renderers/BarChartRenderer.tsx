'use client'

import type { BarChartParams, FigureStyle } from '@/types'

type Props = {
  params: BarChartParams
  style: FigureStyle
  width?: number
  height?: number
}

export function BarChartRenderer({ params, style, width = 600, height = 400 }: Props) {
  const { labels = [], values = [], unit = '', targetLine } = params || {}
  const { primaryColor } = style

  const padding = { top: 40, right: 40, bottom: 60, left: 60 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  if (labels.length === 0 || values.length === 0) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <rect width={width} height={height} fill="white" />
        <text x={width / 2} y={height / 2} textAnchor="middle" fill="#9ca3af" fontSize="14">
          データがありません
        </text>
      </svg>
    )
  }

  const maxValue = Math.max(...values, targetLine || 0) * 1.1
  const barWidth = chartWidth / labels.length * 0.7
  const barGap = chartWidth / labels.length * 0.3

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Background */}
      <rect width={width} height={height} fill="white" />

      {/* Y-axis grid lines */}
      {[0, 25, 50, 75, 100].map((percent) => {
        const y = padding.top + chartHeight * (1 - percent / 100)
        const value = (maxValue * percent / 100).toFixed(0)
        return (
          <g key={percent}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#e5e7eb"
              strokeDasharray={percent === 0 ? undefined : '4,4'}
            />
            <text
              x={padding.left - 10}
              y={y}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="12"
              fill="#6b7280"
            >
              {value}{unit}
            </text>
          </g>
        )
      })}

      {/* Bars */}
      {values.map((value, index) => {
        const barHeight = (value / maxValue) * chartHeight
        const x = padding.left + index * (barWidth + barGap) + barGap / 2
        const y = padding.top + chartHeight - barHeight

        return (
          <g key={index}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={primaryColor}
              rx={4}
            />
            {/* Value label */}
            <text
              x={x + barWidth / 2}
              y={y - 8}
              textAnchor="middle"
              fontSize="14"
              fontWeight="bold"
              fill={primaryColor}
            >
              {value}{unit}
            </text>
            {/* X-axis label */}
            <text
              x={x + barWidth / 2}
              y={height - padding.bottom + 20}
              textAnchor="middle"
              fontSize="12"
              fill="#374151"
            >
              {labels[index]}
            </text>
          </g>
        )
      })}

      {/* Target line */}
      {targetLine && (
        <g>
          <line
            x1={padding.left}
            y1={padding.top + chartHeight * (1 - targetLine / maxValue)}
            x2={width - padding.right}
            y2={padding.top + chartHeight * (1 - targetLine / maxValue)}
            stroke="#ef4444"
            strokeWidth="2"
            strokeDasharray="8,4"
          />
          <text
            x={width - padding.right + 5}
            y={padding.top + chartHeight * (1 - targetLine / maxValue)}
            dominantBaseline="middle"
            fontSize="12"
            fill="#ef4444"
          >
            目標: {targetLine}{unit}
          </text>
        </g>
      )}
    </svg>
  )
}
