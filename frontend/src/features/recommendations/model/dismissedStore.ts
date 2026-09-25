import { create } from 'zustand'
import { loadMockState, saveMockState } from '@/shared/lib/mockPersist'

interface DismissedState {
  ids: string[]
  dismiss: (id: string) => void
  restore: (id: string) => void
  isDismissed: (id: string) => boolean
}

export const useDismissedRecommendationsStore = create<DismissedState>((set, get) => ({
  ids: loadMockState<string[]>('dismissed_recommendations', []),
  dismiss: (id) => {
    const next = get().ids.includes(id) ? get().ids : [...get().ids, id]
    saveMockState('dismissed_recommendations', next)
    set({ ids: next })
  },
  restore: (id) => {
    const next = get().ids.filter((item) => item !== id)
    saveMockState('dismissed_recommendations', next)
    set({ ids: next })
  },
  isDismissed: (id) => get().ids.includes(id),
}))
