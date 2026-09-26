import type { ModerationHistoryEntry } from '@/entities/moderation'
import { isReal } from '@/shared/api/apiCapabilities'
import { moderationApi } from '@/shared/api/moderationApi'
import { delay } from '@/shared/lib/delay'
import { mockModerationHistory } from '@/shared/mocks/moderationHistory'

export interface HistoryFilters {
  entityType?: string | 'all'
  action?: string | 'all'
  query?: string
  moderatorId?: string | 'all'
}

function applyFilters(
  items: ModerationHistoryEntry[],
  filters?: HistoryFilters,
): ModerationHistoryEntry[] {
  let next = items
  if (filters?.entityType && filters.entityType !== 'all') {
    next = next.filter((h) => h.entityType === filters.entityType)
  }
  if (filters?.action && filters.action !== 'all') {
    next = next.filter((h) => h.decision.action === filters.action)
  }
  if (filters?.moderatorId && filters.moderatorId !== 'all') {
    next = next.filter((h) => h.decision.moderatorId === filters.moderatorId)
  }
  if (filters?.query) {
    const q = filters.query.toLowerCase()
    next = next.filter((h) =>
      `${h.title} ${h.companyName} ${h.decision.comment ?? ''} ${h.decision.moderatorName}`
        .toLowerCase()
        .includes(q),
    )
  }
  return next.sort(
    (a, b) => +new Date(b.decision.createdAt) - +new Date(a.decision.createdAt),
  )
}

/**
 * BE `/moderation/history` returns closed moderation items (not a decision log).
 * Real mode synthesizes one entry per closed item from last status.
 * Mock keeps the full synthetic decision history.
 * When a real decision-log endpoint appears, reconnect here.
 */
export const moderationHistoryApi = {
  async getAll(filters?: HistoryFilters): Promise<ModerationHistoryEntry[]> {
    if (!isReal('moderation')) {
      await delay()
      return applyFilters(
        mockModerationHistory.map((h) => ({ ...h, decision: { ...h.decision } })),
        filters,
      )
    }
    const items = await moderationApi.getHistory()
    return applyFilters(items, filters)
  },

  async getById(id: string): Promise<ModerationHistoryEntry> {
    const all = await this.getAll()
    const entry = all.find((h) => h.id === id)
    if (!entry) throw new Error('Запись истории не найдена')
    return entry
  },
}

/** True when history is derived from closed items, not a decision audit log. */
export function isSyntheticModerationHistory(): boolean {
  return isReal('moderation')
}
