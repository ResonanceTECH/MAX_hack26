import type { Escalation } from '@/entities/escalation'
import { ESCALATION_STATUS } from '@/entities/escalation'
import { isReal } from '@/shared/api/apiCapabilities'
import { createApiProxy, escalationsReal } from '@/shared/api/real/moderationAdmin'
import { delay } from '@/shared/lib/delay'
import { getEscalationById, mockEscalations } from '@/shared/mocks/escalations'
import { appendAudit, AUDIT_ACTIONS } from '@/shared/mocks/audit'
import type { SystemRole } from '@/entities/user'

export interface ResolveEscalationInput {
  decision: string
  reason: string
  actor?: { id: string; name: string; role: SystemRole }
}

const mockEscalationsApi = {
  async getAll(): Promise<Escalation[]> {
    await delay(200 + Math.floor(Math.random() * 400))
    return [...mockEscalations]
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .map((e) => ({ ...e }))
  },

  async getById(id: string): Promise<Escalation> {
    await delay(200 + Math.floor(Math.random() * 400))
    const item = getEscalationById(id)
    if (!item) throw new Error('Эскалация не найдена')
    return { ...item }
  },

  async resolve(id: string, input: ResolveEscalationInput): Promise<Escalation> {
    await delay(300 + Math.floor(Math.random() * 300))
    const item = getEscalationById(id)
    if (!item) throw new Error('Эскалация не найдена')
    if (item.status === ESCALATION_STATUS.RESOLVED) {
      throw new Error('Эскалация уже закрыта')
    }
    item.status = ESCALATION_STATUS.RESOLVED
    item.resolvedAt = new Date().toISOString()
    item.resolution = input.decision
    item.adminResponse = input.decision
    if (input.actor) {
      appendAudit({
        actorId: input.actor.id,
        actorName: input.actor.name,
        role: input.actor.role,
        action: AUDIT_ACTIONS.ESCALATION_RESOLVED,
        entityType: 'escalation',
        entityId: id,
        entityName: item.title,
        reason: input.reason,
        after: { decision: input.decision, status: item.status },
      })
    }
    return { ...item }
  },
}

export const escalationsApi = createApiProxy(escalationsReal, mockEscalationsApi, () =>
  isReal('moderation'),
)
