import { delay } from '@/shared/lib/delay'
import {
  getAuditEventById,
  mockAuditEvents,
  type AuditEvent,
  type AuditFilters,
} from '@/shared/mocks/audit'

export const auditApi = {
  async getAll(filters?: AuditFilters): Promise<AuditEvent[]> {
    return this.list(filters)
  },

  async list(filters?: AuditFilters): Promise<AuditEvent[]> {
    await delay(200 + Math.floor(Math.random() * 400))
    let items = [...mockAuditEvents]
    if (filters?.actorId) items = items.filter((e) => e.actorId === filters.actorId)
    if (filters?.actor) {
      const q = filters.actor.toLowerCase()
      items = items.filter((e) => e.actorName.toLowerCase().includes(q))
    }
    if (filters?.role) {
      items = items.filter((e) => e.actorRole === filters.role || e.role === filters.role)
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
        `${e.actorName} ${e.action} ${e.targetName ?? ''} ${e.entityName} ${e.entityLabel} ${e.reason ?? ''} ${e.details ?? ''}`
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

  async getById(id: string): Promise<AuditEvent> {
    await delay(200 + Math.floor(Math.random() * 200))
    const event = getAuditEventById(id)
    if (!event) throw new Error('Событие не найдено')
    return { ...event }
  },
}

export type { AuditFilters, AuditEvent }
