import {
  COMPANY_ACTIVITY_TYPE,
  type CompanyActivityEvent,
  type CompanyActivityType,
} from '@/entities/company-activity'
import { delay } from '@/shared/lib/delay'
import { mockCompanyActivity } from '@/shared/mocks'
import { persistCompanyActivity } from '@/shared/mocks/hydrateMocks'
import { CURRENT_COMPANY_ID } from '@/shared/mocks/user'

export interface ActivityFilter {
  companyId?: string
  type?: CompanyActivityType
  limit?: number
}

export type AppendActivityInput = Omit<CompanyActivityEvent, 'id' | 'createdAt' | 'companyId'> & {
  companyId?: string
  createdAt?: string
}

function appendSync(event: AppendActivityInput): CompanyActivityEvent {
  const item: CompanyActivityEvent = {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    companyId: event.companyId ?? CURRENT_COMPANY_ID,
    type: event.type,
    actorName: event.actorName,
    action: event.action,
    entityLabel: event.entityLabel,
    createdAt: event.createdAt ?? new Date().toISOString(),
  }
  mockCompanyActivity.unshift(item)
  persistCompanyActivity()
  return item
}

export const activityApi = {
  async getAll(filter?: ActivityFilter): Promise<CompanyActivityEvent[]> {
    await delay()
    let items = [...mockCompanyActivity]
    const companyId = filter?.companyId ?? CURRENT_COMPANY_ID
    items = items.filter((e) => e.companyId === companyId)
    if (filter?.type) {
      items = items.filter((e) => e.type === filter.type)
    }
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    if (filter?.limit != null) {
      items = items.slice(0, filter.limit)
    }
    return items
  },

  async append(event: AppendActivityInput): Promise<CompanyActivityEvent> {
    await delay()
    return appendSync(event)
  },

  /** Sync helper for other mock APIs (no extra delay). */
  appendSync,
}

export { COMPANY_ACTIVITY_TYPE }
