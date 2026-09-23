import { create } from 'zustand'
import type { OpportunityFilters, OpportunitySort } from '@/shared/api/opportunityApi'

interface OpportunitySearchState {
  filters: OpportunityFilters
  sort: OpportunitySort
  setFilters: (filters: OpportunityFilters) => void
  patchFilters: (patch: Partial<OpportunityFilters>) => void
  setSort: (sort: OpportunitySort) => void
  reset: () => void
}

const defaultFilters: OpportunityFilters = {}

export const useOpportunitySearchStore = create<OpportunitySearchState>((set) => ({
  filters: defaultFilters,
  sort: 'match',
  setFilters: (filters) => set({ filters }),
  patchFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
  setSort: (sort) => set({ sort }),
  reset: () => set({ filters: defaultFilters, sort: 'match' }),
}))
