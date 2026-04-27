import { create } from 'zustand'

export type EditTab = 'text' | 'figure' | 'style' | 'ai'

type UiStore = {
  // State
  currentSlideIndex: number
  editTab: EditTab
  isGenerating: boolean
  figureEditorSlideId: string | null

  // Actions
  setCurrentSlideIndex: (index: number) => void
  setEditTab: (tab: EditTab) => void
  setIsGenerating: (v: boolean) => void
  openFigureEditor: (slideId: string) => void
  closeFigureEditor: () => void
  reset: () => void
}

export const useUiStore = create<UiStore>((set) => ({
  currentSlideIndex: 0,
  editTab: 'text',
  isGenerating: false,
  figureEditorSlideId: null,

  setCurrentSlideIndex: (index: number) => set({ currentSlideIndex: index }),
  setEditTab: (tab: EditTab) => set({ editTab: tab }),
  setIsGenerating: (v: boolean) => set({ isGenerating: v }),
  openFigureEditor: (slideId: string) => set({ figureEditorSlideId: slideId }),
  closeFigureEditor: () => set({ figureEditorSlideId: null }),
  reset: () =>
    set({
      currentSlideIndex: 0,
      editTab: 'text',
      isGenerating: false,
      figureEditorSlideId: null,
    }),
}))
