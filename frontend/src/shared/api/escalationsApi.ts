import type { Escalation } from '@/entities/escalation'
import { isReal } from '@/shared/api/apiCapabilities'
import { createApiProxy, escalationsReal } from '@/shared/api/real/moderationAdmin'
import { delay } from '@/shared/lib/delay'
import { getEscalationById, mockEscalations } from '@/shared/mocks/escalations'

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
}

export const escalationsApi = createApiProxy(escalationsReal, mockEscalationsApi, () =>
  isReal('moderation'),
)
