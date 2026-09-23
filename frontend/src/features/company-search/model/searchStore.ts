import { create } from 'zustand'
import type { CompanyFilters } from '@/shared/api/companyApi'

interface CompanySearchState {
  filters: CompanyFilters
  setFilters: (filters: CompanyFilters) => void
  patchFilters: (patch: Partial<CompanyFilters>) => void
  reset: () => void
}

export const useCompanySearchStore = create<CompanySearchState>((set) => ({
  filters: {},
  setFilters: (filters) => set({ filters }),
  patchFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
  reset: () => set({ filters: {} }),
}))
