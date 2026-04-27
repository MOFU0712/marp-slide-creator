'use client'

import type { Figure, GraphParams, BarChartParams, TimelineParams, ComparisonParams } from '@/types'
import { BarChartRenderer, TimelineRenderer, ComparisonRenderer, GraphRenderer } from './renderers'

type Props = {
  figure: Figure
  width?: number
  height?: number
}

export function FigureRenderer({ figure, width, height }: Props) {
  const { type, params, style } = figure

  switch (type) {
    case 'architecture':
    case 'flow':
      return (
        <GraphRenderer
          params={params as GraphParams}
          style={style}
          width={width}
          height={height}
        />
      )
    case 'bar_chart':
      return (
        <BarChartRenderer
          params={params as BarChartParams}
          style={style}
          width={width}
          height={height}
        />
      )
    case 'timeline':
      return (
        <TimelineRenderer
          params={params as TimelineParams}
          style={style}
          width={width}
          height={height}
        />
      )
    case 'comparison':
      return (
        <ComparisonRenderer
          params={params as ComparisonParams}
          style={style}
          width={width}
          height={height}
        />
      )
    default:
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          図タイプが不明です: {type}
        </div>
      )
  }
}
