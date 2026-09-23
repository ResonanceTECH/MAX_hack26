import { create } from 'zustand'

interface UiState {
  sidebarCollapsed: boolean
  filterDrawerOpen: boolean
  setSidebarCollapsed: (value: boolean) => void
  setFilterDrawerOpen: (value: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  filterDrawerOpen: false,
  setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
  setFilterDrawerOpen: (value) => set({ filterDrawerOpen: value }),
}))
