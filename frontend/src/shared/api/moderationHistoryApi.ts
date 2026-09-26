import type { ModerationHistoryEntry } from '@/entities/moderation'
import { isReal } from '@/shared/api/apiCapabilities'
import { moderationApi } from '@/shared/api/moderationApi'

export interface HistoryFilters {
  entityType?: string | 'all'
  action?: string | 'all'
  query?: string
  moderatorId?: string | 'all'
}

export const moderationHistoryApi = {
  async getAll(filters?: HistoryFilters): Promise<ModerationHistoryEntry[]> {
    if (!isReal('moderation')) {
      return []
    }
    let items = await moderationApi.getHistory()
    if (filters?.entityType && filters.entityType !== 'all') {
      items = items.filter((h) => h.entityType === filters.entityType)
    }
    if (filters?.action && filters.action !== 'all') {
      items = items.filter((h) => h.decision.action === filters.action)
    }
    if (filters?.moderatorId && filters.moderatorId !== 'all') {
      items = items.filter((h) => h.decision.moderatorId === filters.moderatorId)
    }
    if (filters?.query) {
      const q = filters.query.toLowerCase()
      items = items.filter((h) =>
        `${h.title} ${h.companyName} ${h.decision.comment ?? ''} ${h.decision.moderatorName}`
          .toLowerCase()
          .includes(q),
      )
    }
    return items.sort(
      (a, b) => +new Date(b.decision.createdAt) - +new Date(a.decision.createdAt),
    )
  },

  async getById(id: string): Promise<ModerationHistoryEntry> {
    const all = await this.getAll()
    const entry = all.find((h) => h.id === id)
    if (!entry) throw new Error('Запись истории не найдена')
    return entry
  },
}
