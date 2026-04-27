'use client'

import type { ComparisonParams, FigureStyle } from '@/types'

type Props = {
  params: ComparisonParams
  style: FigureStyle
  width?: number
  height?: number
}

export function ComparisonRenderer({ params, style, width = 700, height = 400 }: Props) {
  const { headers = [], rows = [], recommended } = params || {}
  const { primaryColor } = style

  if (headers.length === 0 || rows.length === 0) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <rect width={width} height={height} fill="white" />
        <text x={width / 2} y={height / 2} textAnchor="middle" fill="#9ca3af" fontSize="14">
          データがありません
        </text>
      </svg>
    )
  }

  const cellPadding = 16
  const headerHeight = 50
  const rowHeight = 50
  const colWidth = (width - 2) / headers.length

  const tableHeight = headerHeight + rows.length * rowHeight

  return (
    <svg width={width} height={Math.max(height, tableHeight + 20)} viewBox={`0 0 ${width} ${Math.max(height, tableHeight + 20)}`}>
      {/* Background */}
      <rect width={width} height={Math.max(height, tableHeight + 20)} fill="white" />

      {/* Table border */}
      <rect
        x={1}
        y={1}
        width={width - 2}
        height={tableHeight}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="1"
        rx="8"
      />

      {/* Header row */}
      <rect
        x={1}
        y={1}
        width={width - 2}
        height={headerHeight}
        fill={primaryColor}
        rx="8"
      />
      {/* Bottom corners for header */}
      <rect
        x={1}
        y={headerHeight - 8}
        width={width - 2}
        height={10}
        fill={primaryColor}
      />

      {/* Header texts */}
      {headers.map((header, index) => (
        <g key={index}>
          {/* Column separator */}
          {index > 0 && (
            <line
              x1={colWidth * index}
              y1={1}
              x2={colWidth * index}
              y2={tableHeight}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          )}
          {/* Header text */}
          <text
            x={colWidth * index + colWidth / 2}
            y={headerHeight / 2 + 5}
            textAnchor="middle"
            fontSize="14"
            fontWeight="bold"
            fill="white"
          >
            {header}
          </text>
          {/* Recommended badge */}
          {recommended === index && index > 0 && (
            <g>
              <rect
                x={colWidth * index + colWidth / 2 - 30}
                y={headerHeight + 5}
                width={60}
                height={20}
                fill={primaryColor}
                rx="10"
              />
              <text
                x={colWidth * index + colWidth / 2}
                y={headerHeight + 18}
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill="white"
              >
                推奨
              </text>
            </g>
          )}
        </g>
      ))}

      {/* Data rows */}
      {rows.map((row, rowIndex) => {
        const y = headerHeight + rowIndex * rowHeight

        return (
          <g key={rowIndex}>
            {/* Row separator */}
            {rowIndex > 0 && (
              <line
                x1={1}
                y1={y}
                x2={width - 1}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            )}

            {/* Row background for recommended column */}
            {recommended !== undefined && recommended > 0 && (
              <rect
                x={colWidth * recommended + 1}
                y={y + 1}
                width={colWidth - 2}
                height={rowHeight - 2}
                fill={`${primaryColor}10`}
              />
            )}

            {/* Label (first column) */}
            <text
              x={cellPadding}
              y={y + rowHeight / 2 + 5}
              fontSize="13"
              fontWeight="500"
              fill="#374151"
            >
              {row.label}
            </text>

            {/* Values */}
            {row.values.map((value, colIndex) => (
              <text
                key={colIndex}
                x={colWidth * (colIndex + 1) + colWidth / 2}
                y={y + rowHeight / 2 + 5}
                textAnchor="middle"
                fontSize="13"
                fill={recommended === colIndex + 1 ? primaryColor : '#6b7280'}
                fontWeight={recommended === colIndex + 1 ? '600' : '400'}
              >
                {value}
              </text>
            ))}
          </g>
        )
      })}
    </svg>
  )
}
