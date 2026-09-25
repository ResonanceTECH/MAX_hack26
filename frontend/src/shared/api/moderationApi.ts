import {
  DOCUMENT_VERIFICATION_STATUS,
  MODERATION_ACTION,
  MODERATION_ENTITY_TYPES,
  MODERATION_STATUS,
  type ApproveInput,
  type BlockInput,
  type EscalateInput,
  type ModerationDashboard,
  type ModerationDecision,
  type ModerationEntityType,
  type ModerationHistoryEntry,
  type ModerationItem,
  type ModerationQueueFilters,
  type RejectInput,
  type RequestChangesInput,
} from '@/entities/moderation'
import { ESCALATION_REASON, ESCALATION_STATUS, type Escalation } from '@/entities/escalation'
import {
  canApproveItem,
  canAssignItem,
  canBlockItem,
  canEscalateItem,
  canRejectItem,
  canRequestChanges,
  CURRENT_MODERATOR_ID,
  CURRENT_MODERATOR_NAME,
  getModerationPriorityRank,
  getQueueAgeHours,
  needsAttention,
} from '@/features/moderation/model/businessRules'
import { delay } from '@/shared/lib/delay'
import {
  getModerationItemByEntity,
  getModerationItemById,
  mockModerationItems,
} from '@/shared/mocks/moderation'
import { mockEscalations } from '@/shared/mocks/escalations'
import { mockModerationHistory, mockOwnerNotifications } from '@/shared/mocks/moderationHistory'
import { mockReports } from '@/shared/mocks/reports'
import {
  persistEscalations,
  persistModerationHistory,
  persistModerationItems,
  persistOwnerNotifications,
} from '@/shared/mocks/hydrateMocks'

const decisionInFlight = new Set<string>()

function decisionDelay(): Promise<void> {
  return delay(400 + Math.floor(Math.random() * 400))
}

function readDelay(): Promise<void> {
  return delay(200 + Math.floor(Math.random() * 400))
}

function assertAllowed(result: { allowed: boolean; reason?: string }) {
  if (!result.allowed) throw new Error(result.reason ?? 'Действие запрещено')
}

function assertVersion(item: ModerationItem, expectedVersion?: number) {
  if (expectedVersion != null && item.version !== expectedVersion) {
    throw new Error('Объект был изменён. Обновите данные перед принятием решения.')
  }
}

function isOpenQueueStatus(status: ModerationItem['status']): boolean {
  return (
    status === MODERATION_STATUS.PENDING ||
    status === MODERATION_STATUS.IN_REVIEW ||
    status === MODERATION_STATUS.NEEDS_CHANGES
  )
}

function applyQueueFilters(
  items: ModerationItem[],
  filters?: ModerationQueueFilters,
): ModerationItem[] {
  if (!filters) return items
  return items.filter((item) => {
    if (filters.type && filters.type !== 'all' && item.entityType !== filters.type) return false
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'open') {
        if (!isOpenQueueStatus(item.status)) return false
      } else if (item.status !== filters.status) return false
    }
    if (filters.priority && filters.priority !== 'all' && item.priority !== filters.priority) {
      return false
    }
    if (filters.reason && filters.reason !== 'all' && item.reason !== filters.reason) return false
    if (filters.hasReports && item.reportsCount < 1) return false
    if (filters.source && filters.source !== 'all' && item.dataOrigin !== filters.source) {
      return false
    }
    if (filters.olderThanHours != null) {
      if (getQueueAgeHours(item.submittedAt) < filters.olderThanHours) return false
    }
    if (filters.query) {
      const q = filters.query.toLowerCase()
      const inn = String(item.payload.inn ?? '')
      const hay =
        `${item.id} ${item.entityId} ${item.title} ${item.companyName} ${item.ownerName} ${inn} ${item.entityType}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}

function sortQueue(items: ModerationItem[], sort: ModerationQueueFilters['sort'] = 'urgent') {
  const copy = [...items]
  switch (sort) {
    case 'oldest':
      return copy.sort((a, b) => +new Date(a.submittedAt) - +new Date(b.submittedAt))
    case 'newest':
      return copy.sort((a, b) => +new Date(b.submittedAt) - +new Date(a.submittedAt))
    case 'reports':
      return copy.sort((a, b) => b.reportsCount - a.reportsCount)
    case 'priority':
      return copy.sort(
        (a, b) => getModerationPriorityRank(b.priority) - getModerationPriorityRank(a.priority),
      )
    case 'urgent':
    default:
      return copy.sort((a, b) => {
        const pr = getModerationPriorityRank(b.priority) - getModerationPriorityRank(a.priority)
        if (pr !== 0) return pr
        if (b.reportsCount !== a.reportsCount) return b.reportsCount - a.reportsCount
        return +new Date(a.submittedAt) - +new Date(b.submittedAt)
      })
  }
}

function pushHistory(item: ModerationItem, decision: ModerationDecision): void {
  const entry: ModerationHistoryEntry = {
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    moderationItemId: item.id,
    entityType: item.entityType,
    entityId: item.entityId,
    title: item.title,
    companyName: item.companyName,
    decision,
  }
  mockModerationHistory.unshift(entry)
  persistModerationHistory()
}

function notifyOwner(title: string, body: string) {
  mockOwnerNotifications.unshift({
    id: `own-${Date.now()}`,
    title,
    body,
    createdAt: new Date().toISOString(),
  })
  persistOwnerNotifications()
}

function createDecision(
  item: ModerationItem,
  action: ModerationDecision['action'],
  newStatus: ModerationItem['status'],
  extra: Partial<ModerationDecision> = {},
): ModerationDecision {
  return {
    id: `dec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    moderationItemId: item.id,
    moderatorId: CURRENT_MODERATOR_ID,
    moderatorName: CURRENT_MODERATOR_NAME,
    action,
    reasonCode: extra.reasonCode ?? null,
    comment: extra.comment ?? null,
    previousStatus: item.status,
    newStatus,
    createdAt: new Date().toISOString(),
    fieldsRequested: extra.fieldsRequested ?? [],
    privateNote: extra.privateNote ?? null,
  }
}

function todayPrefix() {
  return new Date().toISOString().slice(0, 10)
}

export const moderationApi = {
  async getDashboard(): Promise<ModerationDashboard> {
    await readDelay()
    const open = mockModerationItems.filter((i) => isOpenQueueStatus(i.status))
    const today = todayPrefix()
    const todayHist = mockModerationHistory.filter((h) => h.decision.createdAt.startsWith(today))
    const attention = sortQueue(
      open.filter((i) => needsAttention(i)),
      'urgent',
    ).slice(0, 5)
    return {
      pendingCompanies: open.filter((i) => i.entityType === 'company').length,
      pendingOpportunities: open.filter((i) => i.entityType === 'opportunity').length,
      pendingCases: open.filter((i) => i.entityType === 'case').length,
      pendingDocuments: open.filter((i) => i.entityType === 'document').length,
      pendingTotal: open.length,
      openReports: mockReports.filter((r) => r.status === 'OPEN' || r.status === 'IN_PROGRESS')
        .length,
      escalations: mockEscalations.filter((e) => e.status !== 'RESOLVED').length,
      todayProcessed: todayHist.length,
      approvedToday: todayHist.filter((h) => h.decision.action === MODERATION_ACTION.APPROVED)
        .length,
      rejectedToday: todayHist.filter((h) => h.decision.action === MODERATION_ACTION.REJECTED)
        .length,
      changesToday: todayHist.filter(
        (h) => h.decision.action === MODERATION_ACTION.CHANGES_REQUESTED,
      ).length,
      attentionItems: attention.map((i) => ({ ...i })),
      recentQueue: sortQueue(open, 'newest').slice(0, 5).map((i) => ({ ...i })),
    }
  },

  /** @deprecated use getDashboard */
  async getSummary(): Promise<ModerationDashboard> {
    return this.getDashboard()
  },

  async getQueue(filters?: ModerationQueueFilters): Promise<ModerationItem[]> {
    await readDelay()
    const filtered = applyQueueFilters([...mockModerationItems], filters)
    return sortQueue(filtered, filters?.sort).map((i) => ({ ...i }))
  },

  async getById(type: string, id: string): Promise<ModerationItem> {
    await readDelay()
    const byId = getModerationItemById(id)
    if (byId) return { ...byId }
    if (type !== 'item') {
      const byEntity = getModerationItemByEntity(type as ModerationEntityType, id)
      if (byEntity) return { ...byEntity }
    }
    throw new Error('Объект не найден')
  },

  async getItem(id: string): Promise<ModerationItem> {
    await readDelay()
    const item = getModerationItemById(id)
    if (!item) throw new Error('Объект не найден')
    return { ...item }
  },

  async getNextItem(afterId: string, filters?: ModerationQueueFilters): Promise<ModerationItem | null> {
    await readDelay()
    const queue = sortQueue(
      applyQueueFilters(
        mockModerationItems.filter((i) => isOpenQueueStatus(i.status)),
        { ...filters, status: filters?.status ?? 'open' },
      ),
      filters?.sort ?? 'urgent',
    )
    const idx = queue.findIndex((i) => i.id === afterId)
    const next = idx >= 0 ? queue[idx + 1] : queue[0]
    return next && next.id !== afterId ? { ...next } : queue.find((i) => i.id !== afterId) ?? null
  },

  async getRelatedData(id: string) {
    await readDelay()
    const item = getModerationItemById(id)
    if (!item) throw new Error('Объект не найден')
    const relatedReports = mockReports.filter(
      (r) =>
        item.relatedReportIds.includes(r.id) ||
        (r.targetType === item.entityType && r.targetId === item.entityId),
    )
    const history = mockModerationHistory.filter((h) => h.moderationItemId === item.id)
    const previousRejections = mockModerationHistory.filter(
      (h) =>
        h.companyName === item.companyName &&
        h.decision.action === MODERATION_ACTION.REJECTED,
    ).length
    const blockedItems = mockModerationItems.filter(
      (i) => i.companyName === item.companyName && i.status === MODERATION_STATUS.BLOCKED,
    ).length
    const similarTitles = mockModerationItems
      .filter((i) => i.entityType === item.entityType && i.id !== item.id)
      .slice(0, 3)
      .map((i) => i.title)
    return {
      item: { ...item },
      relatedReports: relatedReports.map((r) => ({ ...r })),
      history: history.map((h) => ({ ...h, decision: { ...h.decision } })),
      similarTitles,
      companyRisk: {
        previousRejections,
        reportsCount: relatedReports.length,
        blockedItems,
      },
    }
  },

  async assignToMe(id: string): Promise<ModerationItem> {
    await decisionDelay()
    const item = getModerationItemById(id)
    if (!item) throw new Error('Объект не найден')
    assertAllowed(canAssignItem(item))
    if (
      item.status === MODERATION_STATUS.IN_REVIEW &&
      item.assignedModeratorId === CURRENT_MODERATOR_ID
    ) {
      return { ...item }
    }
    const previous = item.status
    item.status = MODERATION_STATUS.IN_REVIEW
    item.assignedModeratorId = CURRENT_MODERATOR_ID
    item.assignedModeratorName = CURRENT_MODERATOR_NAME
    item.updatedAt = new Date().toISOString()
    item.version += 1
    const decision = createDecision(item, MODERATION_ACTION.ASSIGNED, item.status)
    decision.previousStatus = previous
    pushHistory(item, decision)
    persistModerationItems()
    return { ...item }
  },

  async approve(id: string, input: ApproveInput = {}): Promise<ModerationItem> {
    if (decisionInFlight.has(id)) throw new Error('Решение уже обрабатывается')
    decisionInFlight.add(id)
    try {
      await decisionDelay()
      const item = getModerationItemById(id)
      if (!item) throw new Error('Объект не найден')
      assertVersion(item, input.expectedVersion)
      assertAllowed(canApproveItem(item))
      const decision = createDecision(item, MODERATION_ACTION.APPROVED, MODERATION_STATUS.APPROVED, {
        privateNote: input.privateNote,
      })
      item.status = MODERATION_STATUS.APPROVED
      if (item.entityType === MODERATION_ENTITY_TYPES.DOCUMENT) {
        item.documentStatus = DOCUMENT_VERIFICATION_STATUS.VERIFIED
      }
      item.updatedAt = new Date().toISOString()
      item.version += 1
      item.previousDecisionId = decision.id
      if (input.privateNote) item.moderatorNote = input.privateNote
      pushHistory(item, decision)
      persistModerationItems()
      return { ...item }
    } finally {
      decisionInFlight.delete(id)
    }
  },

  async reject(id: string, input: RejectInput): Promise<ModerationItem> {
    if (decisionInFlight.has(id)) throw new Error('Решение уже обрабатывается')
    decisionInFlight.add(id)
    try {
      await decisionDelay()
      const item = getModerationItemById(id)
      if (!item) throw new Error('Объект не найден')
      assertVersion(item, input.expectedVersion)
      assertAllowed(canRejectItem(item))
      if (!input.reasonCode) throw new Error('Укажите причину отклонения')
      const decision = createDecision(item, MODERATION_ACTION.REJECTED, MODERATION_STATUS.REJECTED, {
        reasonCode: input.reasonCode,
        comment: input.comment,
        privateNote: input.privateNote,
      })
      item.status = MODERATION_STATUS.REJECTED
      if (item.entityType === MODERATION_ENTITY_TYPES.DOCUMENT) {
        item.documentStatus = DOCUMENT_VERIFICATION_STATUS.REJECTED
      }
      item.updatedAt = new Date().toISOString()
      item.version += 1
      item.previousDecisionId = decision.id
      pushHistory(item, decision)
      notifyOwner(
        item.entityType === 'opportunity' ? 'Ваш запрос отклонён' : 'Объект отклонён модератором',
        input.comment ?? input.reasonCode,
      )
      persistModerationItems()
      return { ...item }
    } finally {
      decisionInFlight.delete(id)
    }
  },

  async requestChanges(id: string, input: RequestChangesInput): Promise<ModerationItem> {
    if (decisionInFlight.has(id)) throw new Error('Решение уже обрабатывается')
    decisionInFlight.add(id)
    try {
      await decisionDelay()
      const item = getModerationItemById(id)
      if (!item) throw new Error('Объект не найден')
      assertVersion(item, input.expectedVersion)
      assertAllowed(canRequestChanges(item))
      const decision = createDecision(
        item,
        MODERATION_ACTION.CHANGES_REQUESTED,
        MODERATION_STATUS.NEEDS_CHANGES,
        {
          comment: input.comment,
          fieldsRequested: input.fields,
          privateNote: input.privateNote,
        },
      )
      item.status = MODERATION_STATUS.NEEDS_CHANGES
      if (item.entityType === MODERATION_ENTITY_TYPES.DOCUMENT) {
        item.documentStatus = DOCUMENT_VERIFICATION_STATUS.NEEDS_CHANGES
      }
      item.updatedAt = new Date().toISOString()
      item.version += 1
      item.previousDecisionId = decision.id
      if (input.privateNote) item.moderatorNote = input.privateNote
      pushHistory(item, decision)
      notifyOwner(
        item.entityType === 'company'
          ? 'Профиль компании требует исправлений'
          : item.entityType === 'opportunity'
            ? 'Ваш запрос требует изменений'
            : 'Требуются исправления',
        `Комментарий модератора: «${input.comment}»`,
      )
      persistModerationItems()
      return { ...item }
    } finally {
      decisionInFlight.delete(id)
    }
  },

  async block(id: string, input: BlockInput): Promise<ModerationItem> {
    if (decisionInFlight.has(id)) throw new Error('Решение уже обрабатывается')
    decisionInFlight.add(id)
    try {
      await decisionDelay()
      const item = getModerationItemById(id)
      if (!item) throw new Error('Объект не найден')
      assertVersion(item, input.expectedVersion)
      assertAllowed(canBlockItem(item))
      if (!input.reasonCode || !input.comment?.trim()) {
        throw new Error('Укажите причину блокировки')
      }
      const decision = createDecision(item, MODERATION_ACTION.BLOCKED, MODERATION_STATUS.BLOCKED, {
        reasonCode: input.reasonCode,
        comment: input.comment,
        privateNote: input.privateNote,
      })
      item.status = MODERATION_STATUS.BLOCKED
      item.updatedAt = new Date().toISOString()
      item.version += 1
      item.previousDecisionId = decision.id
      pushHistory(item, decision)
      persistModerationItems()
      return { ...item }
    } finally {
      decisionInFlight.delete(id)
    }
  },

  async escalate(id: string, input: EscalateInput): Promise<{ item: ModerationItem; escalation: Escalation }> {
    if (decisionInFlight.has(id)) throw new Error('Решение уже обрабатывается')
    decisionInFlight.add(id)
    try {
      await decisionDelay()
      const item = getModerationItemById(id)
      if (!item) throw new Error('Объект не найден')
      assertVersion(item, input.expectedVersion)
      assertAllowed(canEscalateItem(item))
      if (!input.reasonCode || !input.comment?.trim()) {
        throw new Error('Укажите причину эскалации')
      }
      const decision = createDecision(item, MODERATION_ACTION.ESCALATED, MODERATION_STATUS.ESCALATED, {
        reasonCode: input.reasonCode,
        comment: input.comment,
        privateNote: input.privateNote,
      })
      item.status = MODERATION_STATUS.ESCALATED
      item.updatedAt = new Date().toISOString()
      item.version += 1
      item.previousDecisionId = decision.id
      pushHistory(item, decision)

      const escalation: Escalation = {
        id: `esc-${Date.now()}`,
        moderationItemId: item.id,
        entityType: item.entityType,
        entityId: item.entityId,
        title: item.title,
        companyName: item.companyName,
        moderatorId: CURRENT_MODERATOR_ID,
        moderatorName: CURRENT_MODERATOR_NAME,
        reason:
          (Object.values(ESCALATION_REASON) as string[]).includes(input.reasonCode)
            ? (input.reasonCode as Escalation['reason'])
            : ESCALATION_REASON.OTHER,
        comment: input.comment,
        status: ESCALATION_STATUS.OPEN,
        createdAt: new Date().toISOString(),
        resolvedAt: null,
        resolution: null,
        adminResponse: null,
      }
      mockEscalations.unshift(escalation)
      persistEscalations()
      persistModerationItems()
      return { item: { ...item }, escalation: { ...escalation } }
    } finally {
      decisionInFlight.delete(id)
    }
  },

  /** Mock helper: owner resubmits after NEEDS_CHANGES */
  async resubmit(id: string, patch: Record<string, string | number | boolean | null>): Promise<ModerationItem> {
    await decisionDelay()
    const item = getModerationItemById(id)
    if (!item) throw new Error('Объект не найден')
    if (item.status !== MODERATION_STATUS.NEEDS_CHANGES) {
      throw new Error('Повторная отправка доступна только для объектов со статусом «Нужны исправления»')
    }
    item.previousSnapshot = { ...item.payload }
    item.payload = { ...item.payload, ...patch }
    item.currentSnapshot = { ...item.payload }
    item.status = MODERATION_STATUS.PENDING
    item.reason = 'RESUBMISSION'
    item.assignedModeratorId = null
    item.assignedModeratorName = null
    item.submittedAt = new Date().toISOString()
    item.updatedAt = item.submittedAt
    item.version += 1
    persistModerationItems()
    return { ...item }
  },

  async getHistory(): Promise<ModerationHistoryEntry[]> {
    await readDelay()
    return [...mockModerationHistory]
      .sort((a, b) => +new Date(b.decision.createdAt) - +new Date(a.decision.createdAt))
      .map((h) => ({ ...h, decision: { ...h.decision } }))
  },
}
