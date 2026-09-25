import type {
  ModerationDecision,
  ModerationEntityType,
  ModerationHistoryEntry,
  ModerationItem,
  ModerationQueueFilters,
  ModerationStatus,
  ModerationSummary,
} from '@/entities/moderation'
import { delay } from '@/shared/lib/delay'
import {
  getModerationItemByEntity,
  getModerationItemById,
  mockModerationItems,
} from '@/shared/mocks/moderation'
import { mockModerationHistory } from '@/shared/mocks/moderationHistory'
import { mockReports } from '@/shared/mocks/reports'

const MODERATOR = {
  id: 'user-moderator',
  name: 'Наталья Модератор',
}

function todayIsoPrefix(): string {
  return new Date().toISOString().slice(0, 10)
}

function applyQueueFilters(
  items: ModerationItem[],
  filters?: ModerationQueueFilters,
): ModerationItem[] {
  if (!filters) return items
  return items.filter((item) => {
    if (filters.type && filters.type !== 'all' && item.type !== filters.type) return false
    if (filters.status && filters.status !== 'all' && item.status !== filters.status) return false
    if (filters.query) {
      const q = filters.query.toLowerCase()
      const hay = `${item.title} ${item.companyName} ${item.authorName} ${item.summary}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}

function pushHistory(item: ModerationItem, decision: ModerationDecision): void {
  const entry: ModerationHistoryEntry = {
    id: `hist-${Date.now()}`,
    moderationItemId: item.id,
    entityType: item.type,
    entityId: item.entityId,
    title: item.title,
    companyName: item.companyName,
    decision,
  }
  mockModerationHistory.unshift(entry)
}

async function applyDecision(
  id: string,
  status: ModerationStatus,
  action: ModerationDecision['action'],
  reason?: string,
): Promise<ModerationItem> {
  await delay()
  const item = getModerationItemById(id)
  if (!item) throw new Error('Элемент модерации не найден')
  item.status = status
  const decision: ModerationDecision = {
    action,
    reason,
    timestamp: new Date().toISOString(),
    moderatorId: MODERATOR.id,
    moderatorName: MODERATOR.name,
  }
  pushHistory(item, decision)
  return { ...item }
}

export const moderationApi = {
  async getSummary(): Promise<ModerationSummary> {
    await delay()
    const today = todayIsoPrefix()
    const approvedToday = mockModerationHistory.filter(
      (h) => h.decision.action === 'approve' && h.decision.timestamp.startsWith(today),
    ).length
    const rejectedToday = mockModerationHistory.filter(
      (h) => h.decision.action === 'reject' && h.decision.timestamp.startsWith(today),
    ).length
    return {
      pending: mockModerationItems.filter((i) => i.status === 'pending').length,
      approvedToday,
      rejectedToday,
      needsChanges: mockModerationItems.filter((i) => i.status === 'needs_changes').length,
      blocked: mockModerationItems.filter((i) => i.status === 'blocked').length,
      openReports: mockReports.filter((r) => r.status === 'open').length,
    }
  },

  async getQueue(filters?: ModerationQueueFilters): Promise<ModerationItem[]> {
    await delay()
    return applyQueueFilters([...mockModerationItems], filters).sort(
      (a, b) => +new Date(b.submittedAt) - +new Date(a.submittedAt),
    )
  },

  async getById(type: string, entityId: string): Promise<ModerationItem> {
    await delay()
    const byId = getModerationItemById(entityId)
    if (byId) return { ...byId }
    if (type !== 'item') {
      const byEntity = getModerationItemByEntity(type as ModerationEntityType, entityId)
      if (byEntity) return { ...byEntity }
    }
    throw new Error('Элемент модерации не найден')
  },

  async getItem(id: string): Promise<ModerationItem> {
    await delay()
    const item = getModerationItemById(id)
    if (!item) throw new Error('Элемент модерации не найден')
    return { ...item }
  },

  async approve(id: string): Promise<ModerationItem> {
    return applyDecision(id, 'approved', 'approve')
  },

  async reject(id: string, reason: string): Promise<ModerationItem> {
    if (!reason.trim()) throw new Error('Укажите причину отклонения')
    return applyDecision(id, 'rejected', 'reject', reason.trim())
  },

  async requestChanges(id: string, reason: string): Promise<ModerationItem> {
    if (!reason.trim()) throw new Error('Укажите, что нужно исправить')
    return applyDecision(id, 'needs_changes', 'request_changes', reason.trim())
  },

  async block(id: string, reason: string): Promise<ModerationItem> {
    if (!reason.trim()) throw new Error('Укажите причину блокировки')
    return applyDecision(id, 'blocked', 'block', reason.trim())
  },

  async getHistory(): Promise<ModerationHistoryEntry[]> {
    await delay()
    return [...mockModerationHistory].sort(
      (a, b) => +new Date(b.decision.timestamp) - +new Date(a.decision.timestamp),
    )
  },
}
