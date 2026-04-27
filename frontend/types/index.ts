// Project Mode Types
export type ProjectMode = 'proposal' | 'report' | 'comparison' | 'research'

// Slide Layout Types
export type SlideLayout =
  | 'title-bullets'
  | 'title-figure'
  | 'two-column'
  | 'divider'
  | 'title-only'

// Figure Types
export type FigureType =
  | 'architecture'
  | 'flow'
  | 'bar_chart'
  | 'timeline'
  | 'comparison'

// ---- SlideContent ----

export type SlideContentTitleBullets = {
  layout: 'title-bullets'
  title: string
  bullets: string[]
}

export type SlideContentTitleFigure = {
  layout: 'title-figure'
  title: string
  caption?: string
}

export type SlideContentTwoColumn = {
  layout: 'two-column'
  title: string
  left: string[]
  right: string[]
}

export type SlideContentDivider = {
  layout: 'divider'
  title: string
  subtitle?: string
}

export type SlideContentTitleOnly = {
  layout: 'title-only'
  title: string
}

export type SlideContent =
  | SlideContentTitleBullets
  | SlideContentTitleFigure
  | SlideContentTwoColumn
  | SlideContentDivider
  | SlideContentTitleOnly

// ---- Figure ----

// Flow chart shapes
export type FlowNodeShape = 'oval' | 'rect' | 'diamond' | 'parallelogram'

// Architecture diagram shapes
export type ArchitectureNodeShape = 'rect' | 'cylinder' | 'cloud' | 'hexagon'

// Special shapes (available in both types)
export type SpecialNodeShape = 'user' | 'group'

export type AllNodeShapes = FlowNodeShape | ArchitectureNodeShape | SpecialNodeShape

export type GraphNode = {
  id: string
  label: string
  color?: string
  shape?: AllNodeShapes
  x?: number
  y?: number
  // For group shape - size of the container
  width?: number
  height?: number
}

export type GraphEdge = {
  from: string
  to: string
  label?: string
}

export type GraphParams = {
  type: 'architecture' | 'flow'
  nodes: GraphNode[]
  edges: GraphEdge[]
  direction: 'horizontal' | 'vertical'
}

export type BarChartParams = {
  type: 'bar_chart'
  labels: string[]
  values: number[]
  unit: string
  targetLine?: number
}

export type TimelineParams = {
  type: 'timeline'
  items: {
    date: string
    label: string
    done: boolean
  }[]
}

export type ComparisonParams = {
  type: 'comparison'
  headers: string[]
  rows: {
    label: string
    values: string[]
  }[]
  recommended?: number
}

export type FigureParams =
  | GraphParams
  | BarChartParams
  | TimelineParams
  | ComparisonParams

export type FigureStyle = {
  primaryColor: string
  secondaryColor?: string
  fontSize?: number
  showGrid?: boolean
  scale?: number // 0.5-2.0, default 1.0
}

export type Figure = {
  id: string
  type: FigureType
  params: FigureParams
  style: FigureStyle
}

// ---- Slide ----

export type Slide = {
  id: string
  orderIndex: number
  layout: SlideLayout
  content: SlideContent
  figure?: Figure
  speakerNote?: string
  role: string
  keyMessage: string
}

// ---- Interview Answers ----

export type InterviewAnswers = {
  audience: string
  goal: string
  concerns: string
  slideCount?: number
  timeMinutes?: number
  // Proposal mode additional fields
  decisionType?: string
  // Comparison mode additional fields
  options?: string[]
  criteria?: string[]
  preferred?: string
}

// ---- Project ----

export type Project = {
  id: string
  title: string
  mode: ProjectMode
  interviewAnswers: InterviewAnswers
  themeCSS: string
  slides: Slide[]
  createdAt: string
  updatedAt: string
}

// ---- SSE Events ----

// Figure data from AI generation (may include params)
export type StoryFigureData = {
  type: FigureType
  params?: Omit<FigureParams, 'type'>
} | null

export type StorySlideEvent = {
  type: 'slide'
  index: number
  title: string
  role: string
  keyMessage: string
  layout: SlideLayout
  bullets?: string[]
  left?: string[]
  right?: string[]
  subtitle?: string
  caption?: string
  figure: StoryFigureData
}

export type StoryErrorEvent = {
  type: 'error'
  message: string
}

export type StoryDoneEvent = {
  type: 'done'
}

export type StoryEvent = StorySlideEvent | StoryErrorEvent | StoryDoneEvent

export type SlideAiPatchEvent = {
  type: 'patch'
  field: string
  value: unknown
}

export type SlideAiErrorEvent = {
  type: 'error'
  message: string
}

export type SlideAiDoneEvent = {
  type: 'done'
}

export type SlideAiEvent = SlideAiPatchEvent | SlideAiErrorEvent | SlideAiDoneEvent
