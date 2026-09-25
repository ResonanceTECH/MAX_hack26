import type { ModerationHistoryEntry } from '@/entities/moderation'
import { delay } from '@/shared/lib/delay'
import { mockModerationHistory } from '@/shared/mocks/moderationHistory'

export interface HistoryFilters {
  entityType?: string | 'all'
  action?: string | 'all'
  query?: string
  moderatorId?: string | 'all'
}

export const moderationHistoryApi = {
  async getAll(filters?: HistoryFilters): Promise<ModerationHistoryEntry[]> {
    await delay(200 + Math.floor(Math.random() * 400))
    let items = [...mockModerationHistory]
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
    return items
      .sort((a, b) => +new Date(b.decision.createdAt) - +new Date(a.decision.createdAt))
      .map((h) => ({ ...h, decision: { ...h.decision } }))
  },

  async getById(id: string): Promise<ModerationHistoryEntry> {
    await delay(200 + Math.floor(Math.random() * 400))
    const entry = mockModerationHistory.find((h) => h.id === id)
    if (!entry) throw new Error('Запись истории не найдена')
    return { ...entry, decision: { ...entry.decision } }
  },
}
