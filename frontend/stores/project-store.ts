import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Figure, Project, ProjectMode, Slide, SlideContent, SlideLayout } from '@/types'

const STORAGE_KEY = 'marp-slide-creator-project'

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

function createDefaultSlideContent(layout: SlideLayout): SlideContent {
  switch (layout) {
    case 'title-bullets':
      return { layout: 'title-bullets', title: '', bullets: [''] }
    case 'title-figure':
      return { layout: 'title-figure', title: '', caption: '' }
    case 'two-column':
      return { layout: 'two-column', title: '', left: [''], right: [''] }
    case 'divider':
      return { layout: 'divider', title: '', subtitle: '' }
    case 'title-only':
      return { layout: 'title-only', title: '' }
  }
}

type ProjectStore = {
  // State (persisted to localStorage)
  project: Project | null
  lastSavedAt: string | null

  // Actions
  initProject: (mode: ProjectMode, title?: string) => void
  updateProject: (patch: Partial<Project>) => void

  updateSlide: (slideId: string, patch: Partial<Slide>) => void
  updateSlideContent: (slideId: string, content: SlideContent) => void
  addSlide: (afterIndex?: number) => void
  deleteSlide: (slideId: string) => void
  reorderSlides: (orderedIds: string[]) => void

  setSlides: (slides: Slide[]) => void
  updateFigure: (slideId: string, figure: Figure) => void
  removeFigure: (slideId: string) => void

  // Persistence actions
  saveProject: () => void
  loadProject: (project: Project) => void
  exportProjectJson: () => string | null
  importProjectJson: (json: string) => boolean

  resetProject: () => void
}

const DEFAULT_THEME_CSS = `/* ビジネス提案テーマ */
section {
  font-family: 'Hiragino Sans', 'Yu Gothic', 'Meiryo', sans-serif;
  font-size: 22px;
  padding: 48px 60px;
  color: #2d3748;
  background-color: #ffffff;
}

/* 見出し */
h1 {
  font-size: 40px;
  color: #1a365d;
  border-bottom: 3px solid #3182ce;
  padding-bottom: 12px;
}
h2 {
  font-size: 30px;
  color: #2b6cb0;
  border-left: 5px solid #3182ce;
  padding-left: 14px;
  margin-top: 0;
}
h3 {
  font-size: 22px;
  color: #2c5282;
}

/* テーブル */
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 19px;
}
th {
  background-color: #ebf4ff;
  color: #1a365d;
  padding: 8px 12px;
  border: 1px solid #bee3f8;
  text-align: left;
}
td {
  padding: 7px 12px;
  border: 1px solid #e2e8f0;
}
tr:nth-child(even) td {
  background-color: #f7fafc;
}

/* ボックスコンポーネント */
.highlight-box {
  background: #ebf4ff;
  border-left: 4px solid #3182ce;
  padding: 12px 16px;
  border-radius: 4px;
  margin-top: 12px;
}
.warn-box {
  background: #fffff0;
  border-left: 4px solid #d69e2e;
  padding: 12px 16px;
  border-radius: 4px;
  margin-top: 12px;
}
.important-box {
  background: #fff5f5;
  border-left: 4px solid #e53e3e;
  padding: 12px 16px;
  border-radius: 4px;
  margin-top: 12px;
}
.success-box {
  background: #f0fff4;
  border-left: 4px solid #38a169;
  padding: 12px 16px;
  border-radius: 4px;
  margin-top: 12px;
}

/* 2カラムレイアウト */
.columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

/* セクション区切り */
section.divider {
  background: #ebf4ff;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
section.divider h1 {
  font-size: 46px;
  color: #1a365d;
  border-bottom: none;
}

/* タイトルのみスライド */
section.title-only {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}
section.title-only h1 {
  border-bottom: none;
}`

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
  project: null,
  lastSavedAt: null,

  initProject: (mode: ProjectMode, title?: string) => {
    const now = new Date().toISOString()
    set({
      project: {
        id: generateId(),
        title: title || 'Untitled Presentation',
        mode,
        interviewAnswers: {
          audience: '',
          goal: '',
          concerns: '',
        },
        themeCSS: DEFAULT_THEME_CSS,
        slides: [],
        createdAt: now,
        updatedAt: now,
      },
    })
  },

  updateProject: (patch: Partial<Project>) =>
    set((state) => {
      if (!state.project) return state
      return {
        project: {
          ...state.project,
          ...patch,
          updatedAt: new Date().toISOString(),
        },
      }
    }),

  updateSlide: (slideId: string, patch: Partial<Slide>) =>
    set((state) => {
      if (!state.project) return state
      return {
        project: {
          ...state.project,
          slides: state.project.slides.map((slide) =>
            slide.id === slideId ? { ...slide, ...patch } : slide
          ),
          updatedAt: new Date().toISOString(),
        },
      }
    }),

  updateSlideContent: (slideId: string, content: SlideContent) =>
    set((state) => {
      if (!state.project) return state
      return {
        project: {
          ...state.project,
          slides: state.project.slides.map((slide) =>
            slide.id === slideId
              ? { ...slide, content, layout: content.layout }
              : slide
          ),
          updatedAt: new Date().toISOString(),
        },
      }
    }),

  addSlide: (afterIndex?: number) =>
    set((state) => {
      if (!state.project) return state
      const insertIndex = afterIndex !== undefined ? afterIndex + 1 : state.project.slides.length
      const newSlide: Slide = {
        id: generateId(),
        orderIndex: insertIndex,
        layout: 'title-bullets',
        content: createDefaultSlideContent('title-bullets'),
        role: '',
        keyMessage: '',
      }
      const newSlides = [...state.project.slides]
      newSlides.splice(insertIndex, 0, newSlide)
      // Update orderIndex for all slides
      const reorderedSlides = newSlides.map((slide, index) => ({
        ...slide,
        orderIndex: index,
      }))
      return {
        project: {
          ...state.project,
          slides: reorderedSlides,
          updatedAt: new Date().toISOString(),
        },
      }
    }),

  deleteSlide: (slideId: string) =>
    set((state) => {
      if (!state.project) return state
      const filteredSlides = state.project.slides.filter((slide) => slide.id !== slideId)
      // Update orderIndex for all slides
      const reorderedSlides = filteredSlides.map((slide, index) => ({
        ...slide,
        orderIndex: index,
      }))
      return {
        project: {
          ...state.project,
          slides: reorderedSlides,
          updatedAt: new Date().toISOString(),
        },
      }
    }),

  reorderSlides: (orderedIds: string[]) =>
    set((state) => {
      if (!state.project) return state
      const slideMap = new Map(state.project.slides.map((slide) => [slide.id, slide]))
      const reorderedSlides = orderedIds
        .map((id, index) => {
          const slide = slideMap.get(id)
          if (!slide) return null
          return { ...slide, orderIndex: index }
        })
        .filter((slide): slide is Slide => slide !== null)
      return {
        project: {
          ...state.project,
          slides: reorderedSlides,
          updatedAt: new Date().toISOString(),
        },
      }
    }),

  setSlides: (slides: Slide[]) =>
    set((state) => {
      if (!state.project) return state
      return {
        project: {
          ...state.project,
          slides: slides.map((slide, index) => ({
            ...slide,
            orderIndex: index,
          })),
          updatedAt: new Date().toISOString(),
        },
      }
    }),

  updateFigure: (slideId: string, figure: Figure) =>
    set((state) => {
      if (!state.project) return state
      return {
        project: {
          ...state.project,
          slides: state.project.slides.map((slide) =>
            slide.id === slideId ? { ...slide, figure } : slide
          ),
          updatedAt: new Date().toISOString(),
        },
      }
    }),

  removeFigure: (slideId: string) =>
    set((state) => {
      if (!state.project) return state
      return {
        project: {
          ...state.project,
          slides: state.project.slides.map((slide) =>
            slide.id === slideId ? { ...slide, figure: undefined } : slide
          ),
          updatedAt: new Date().toISOString(),
        },
      }
    }),

  // Persistence actions
  saveProject: () => {
    const state = get()
    if (state.project) {
      set({ lastSavedAt: new Date().toISOString() })
    }
  },

  loadProject: (project: Project) => {
    set({
      project,
      lastSavedAt: new Date().toISOString(),
    })
  },

  exportProjectJson: () => {
    const state = get()
    if (!state.project) return null
    return JSON.stringify(state.project, null, 2)
  },

  importProjectJson: (json: string) => {
    try {
      const project = JSON.parse(json) as Project
      // Validate basic structure
      if (!project.id || !project.title || !Array.isArray(project.slides)) {
        return false
      }
      set({
        project,
        lastSavedAt: new Date().toISOString(),
      })
      return true
    } catch {
      return false
    }
  },

  resetProject: () => set({ project: null, lastSavedAt: null }),
}),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        project: state.project,
        lastSavedAt: state.lastSavedAt,
      }),
    }
  )
)
