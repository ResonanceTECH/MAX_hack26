import type { Report, ResolveReportInput, ReportStatus } from '@/entities/report'
import { REPORT_STATUS } from '@/entities/report'
import { MODERATION_ACTION, MODERATION_STATUS } from '@/entities/moderation'
import {
  canResolveReport,
  CURRENT_MODERATOR_ID,
  CURRENT_MODERATOR_NAME,
} from '@/features/moderation/model/businessRules'
import { delay } from '@/shared/lib/delay'
import { getReportById, mockReports } from '@/shared/mocks/reports'
import { getModerationItemByEntity, mockModerationItems } from '@/shared/mocks/moderation'
import { mockModerationHistory } from '@/shared/mocks/moderationHistory'
import { mockEscalations } from '@/shared/mocks/escalations'
import { ESCALATION_REASON, ESCALATION_STATUS } from '@/entities/escalation'
import {
  persistEscalations,
  persistModerationHistory,
  persistModerationItems,
  persistReports,
} from '@/shared/mocks/hydrateMocks'
import { isReal } from '@/shared/api/apiCapabilities'
import { createApiProxy, reportsReal } from '@/shared/api/real/moderationAdmin'

export interface ReportListFilters {
  status?: ReportStatus | 'all' | 'open_tab' | 'in_progress_tab' | 'closed_tab' | 'escalated_tab'
  query?: string
  type?: Report['type'] | 'all'
}

function readDelay() {
  return delay(200 + Math.floor(Math.random() * 400))
}

function decisionDelay() {
  return delay(400 + Math.floor(Math.random() * 400))
}

const mockReportsApi = {
  async getAll(filters?: ReportListFilters): Promise<Report[]> {
    await readDelay()
    let items = [...mockReports]
    if (filters?.status && filters.status !== 'all') {
      if (filters.status === 'open_tab') {
        items = items.filter((r) => r.status === REPORT_STATUS.OPEN)
      } else if (filters.status === 'in_progress_tab') {
        items = items.filter((r) => r.status === REPORT_STATUS.IN_PROGRESS)
      } else if (filters.status === 'closed_tab') {
        items = items.filter(
          (r) => r.status === REPORT_STATUS.CLOSED || r.status === REPORT_STATUS.RESOLVED,
        )
      } else if (filters.status === 'escalated_tab') {
        items = items.filter((r) => r.status === REPORT_STATUS.ESCALATED)
      } else {
        items = items.filter((r) => r.status === filters.status)
      }
    }
    if (filters?.type && filters.type !== 'all') {
      items = items.filter((r) => r.type === filters.type)
    }
    if (filters?.query) {
      const q = filters.query.toLowerCase()
      items = items.filter((r) =>
        `${r.id} ${r.targetName} ${r.reporterName} ${r.description} ${r.type}`.toLowerCase().includes(
          q,
        ),
      )
    }
    return items
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .map((r) => ({ ...r }))
  },

  /** @deprecated */
  async list(filters?: ReportListFilters): Promise<Report[]> {
    return this.getAll(filters)
  },

  async getById(id: string): Promise<Report> {
    await readDelay()
    const report = getReportById(id)
    if (!report) throw new Error('Жалоба не найдена')
    return { ...report }
  },

  async assignToMe(id: string): Promise<Report> {
    await decisionDelay()
    const report = getReportById(id)
    if (!report) throw new Error('Жалоба не найдена')
    if (report.status === REPORT_STATUS.OPEN) {
      report.status = REPORT_STATUS.IN_PROGRESS
    }
    report.assignedModeratorId = CURRENT_MODERATOR_ID
    persistReports()
    return { ...report }
  },

  async resolve(id: string, input: ResolveReportInput): Promise<Report> {
    await decisionDelay()
    const report = getReportById(id)
    if (!report) throw new Error('Жалоба не найдена')
    const guard = canResolveReport(report)
    if (!guard.allowed) throw new Error(guard.reason)

    report.status = REPORT_STATUS.RESOLVED
    report.resolvedAt = new Date().toISOString()
    report.resolvedBy = CURRENT_MODERATOR_ID
    report.resolutionCode = input.resolutionCode
    report.resolution = input.comment ?? input.resolutionCode

    if (input.applyAction && input.applyAction !== 'none' && report.targetType !== 'user') {
      const item = getModerationItemByEntity(report.targetType, report.targetId)
      if (item && item.status !== MODERATION_STATUS.BLOCKED) {
        if (input.applyAction === 'block') item.status = MODERATION_STATUS.BLOCKED
        if (input.applyAction === 'reject') item.status = MODERATION_STATUS.REJECTED
        if (input.applyAction === 'request_changes') item.status = MODERATION_STATUS.NEEDS_CHANGES
        item.updatedAt = new Date().toISOString()
        item.version += 1
        persistModerationItems()
      }
    }

    mockModerationHistory.unshift({
      id: `hist-report-${Date.now()}`,
      moderationItemId: report.id,
      entityType: report.targetType === 'user' ? 'company' : report.targetType,
      entityId: report.targetId,
      title: report.targetName,
      companyName: report.targetName,
      decision: {
        id: `dec-report-${Date.now()}`,
        moderationItemId: report.id,
        moderatorId: CURRENT_MODERATOR_ID,
        moderatorName: CURRENT_MODERATOR_NAME,
        action: MODERATION_ACTION.REPORT_RESOLVED,
        reasonCode: input.resolutionCode,
        comment: input.comment ?? null,
        previousStatus: MODERATION_STATUS.PENDING,
        newStatus: MODERATION_STATUS.APPROVED,
        createdAt: new Date().toISOString(),
        fieldsRequested: [],
        privateNote: null,
      },
    })
    persistModerationHistory()
    persistReports()
    return { ...report }
  },

  async escalate(id: string, comment: string): Promise<Report> {
    await decisionDelay()
    const report = getReportById(id)
    if (!report) throw new Error('Жалоба не найдена')
    report.status = REPORT_STATUS.ESCALATED
    report.resolution = comment
    mockEscalations.unshift({
      id: `esc-report-${Date.now()}`,
      moderationItemId: report.id,
      entityType: report.targetType,
      entityId: report.targetId,
      title: report.targetName,
      companyName: report.targetName,
      moderatorId: CURRENT_MODERATOR_ID,
      moderatorName: CURRENT_MODERATOR_NAME,
      reason: ESCALATION_REASON.FRAUD_SUSPICION,
      comment,
      status: ESCALATION_STATUS.OPEN,
      createdAt: new Date().toISOString(),
      resolvedAt: null,
      resolution: null,
      adminResponse: null,
    })
    persistEscalations()
    persistReports()
    return { ...report }
  },

  /** @deprecated */
  async close(id: string): Promise<Report> {
    return this.resolve(id, { resolutionCode: 'NO_VIOLATION', comment: 'Закрыто без нарушения' })
  },

  /** @deprecated */
  async applyAction(id: string, note?: string): Promise<Report> {
    return this.resolve(id, {
      resolutionCode: 'ACTION_TAKEN',
      comment: note,
      applyAction: 'request_changes',
    })
  },
}

export const reportsApi = createApiProxy(reportsReal, mockReportsApi, () => isReal('reports'))

// silence unused if tree-shaken oddly
void mockModerationItems
