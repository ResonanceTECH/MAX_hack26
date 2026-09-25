import { create } from 'zustand'
import type {
  DataOrigin,
  ModerationEntityType,
  ModerationPriority,
  ModerationQueueSort,
  ModerationReason,
  ModerationStatus,
} from '@/entities/moderation'

export interface QueueFiltersState {
  type: ModerationEntityType | 'all'
  status: ModerationStatus | 'all' | 'open'
  priority: ModerationPriority | 'all'
  query: string
  reason: ModerationReason | 'all'
  hasReports: boolean
  olderThanHours: number | null
  sort: ModerationQueueSort
  source: DataOrigin | 'all'
  openNextAfterDecision: boolean
  setType: (type: ModerationEntityType | 'all') => void
  setStatus: (status: ModerationStatus | 'all' | 'open') => void
  setPriority: (priority: ModerationPriority | 'all') => void
  setQuery: (query: string) => void
  setReason: (reason: ModerationReason | 'all') => void
  setHasReports: (hasReports: boolean) => void
  setOlderThanHours: (hours: number | null) => void
  setSort: (sort: ModerationQueueSort) => void
  setSource: (source: DataOrigin | 'all') => void
  setOpenNextAfterDecision: (value: boolean) => void
  resetFilters: () => void
  activeFilterCount: () => number
}

const defaults = {
  type: 'all' as const,
  status: 'open' as const,
  priority: 'all' as const,
  query: '',
  reason: 'all' as const,
  hasReports: false,
  olderThanHours: null as number | null,
  sort: 'urgent' as const,
  source: 'all' as const,
  openNextAfterDecision: true,
}

export const useQueueFiltersStore = create<QueueFiltersState>((set, get) => ({
  ...defaults,
  setType: (type) => set({ type }),
  setStatus: (status) => set({ status }),
  setPriority: (priority) => set({ priority }),
  setQuery: (query) => set({ query }),
  setReason: (reason) => set({ reason }),
  setHasReports: (hasReports) => set({ hasReports }),
  setOlderThanHours: (olderThanHours) => set({ olderThanHours }),
  setSort: (sort) => set({ sort }),
  setSource: (source) => set({ source }),
  setOpenNextAfterDecision: (openNextAfterDecision) => set({ openNextAfterDecision }),
  resetFilters: () => set({ ...defaults, openNextAfterDecision: get().openNextAfterDecision }),
  activeFilterCount: () => {
    const s = get()
    let n = 0
    if (s.type !== 'all') n += 1
    if (s.status !== 'open' && s.status !== 'all') n += 1
    if (s.priority !== 'all') n += 1
    if (s.reason !== 'all') n += 1
    if (s.hasReports) n += 1
    if (s.olderThanHours != null) n += 1
    if (s.source !== 'all') n += 1
    if (s.query.trim()) n += 1
    return n
  },
}))
