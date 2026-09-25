import { delay } from '@/shared/lib/delay'
import { mockAuditEvents, type AuditEvent, type AuditFilters } from '@/shared/mocks/audit'

export const auditApi = {
  async list(filters?: AuditFilters): Promise<AuditEvent[]> {
    await delay()
    let items = [...mockAuditEvents]
    if (filters?.actorId) {
      items = items.filter((e) => e.actorId === filters.actorId)
    }
    if (filters?.actor) {
      const q = filters.actor.toLowerCase()
      items = items.filter((e) => e.actorName.toLowerCase().includes(q))
    }
    if (filters?.action) {
      items = items.filter((e) => e.action.toLowerCase().includes(filters.action!.toLowerCase()))
    }
    if (filters?.targetType || filters?.entityType) {
      const t = filters.targetType ?? filters.entityType
      items = items.filter((e) => e.targetType === t || e.entityType === t)
    }
    if (filters?.query) {
      const q = filters.query.toLowerCase()
      items = items.filter((e) =>
        `${e.actorName} ${e.action} ${e.targetName ?? ''} ${e.entityLabel} ${e.details ?? ''}`
          .toLowerCase()
          .includes(q),
      )
    }
    if (filters?.from || filters?.dateFrom) {
      const from = +new Date(filters.from ?? filters.dateFrom!)
      items = items.filter((e) => +new Date(e.timestamp) >= from)
    }
    if (filters?.to || filters?.dateTo) {
      const to = +new Date(filters.to ?? filters.dateTo!)
      items = items.filter((e) => +new Date(e.timestamp) <= to)
    }
    return items.sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
  },
}

export type { AuditFilters }
