import {
  COMPANY_ACTIVITY_TYPE,
  type CompanyActivityEvent,
  type CompanyActivityType,
} from '@/entities/company-activity'
import { apiClient } from '@/shared/api/apiClient'
import { isReal } from '@/shared/api/apiCapabilities'
import { toApiError } from '@/shared/api/errors'
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

interface ActivityDto {
  id: number
  company_id: number
  type: string
  actor_name: string
  action: string
  entity_label: string | null
  created_at: string
}

function mapActivity(dto: ActivityDto): CompanyActivityEvent {
  return {
    id: String(dto.id),
    companyId: String(dto.company_id),
    type: dto.type as CompanyActivityType,
    actorName: dto.actor_name,
    action: dto.action,
    entityLabel: dto.entity_label ?? undefined,
    createdAt: dto.created_at,
  }
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
    if (isReal('companies')) {
      try {
        const { data } = await apiClient.get<ActivityDto[]>('/companies/me/activity')
        let items = data.map(mapActivity)
        if (filter?.type) items = items.filter((e) => e.type === filter.type)
        if (filter?.limit != null) items = items.slice(0, filter.limit)
        return items
      } catch (error) {
        throw toApiError(error)
      }
    }
    await delay()
    let items = [...mockCompanyActivity]
    const companyId = filter?.companyId ?? CURRENT_COMPANY_ID
    items = items.filter((e) => e.companyId === companyId)
    if (filter?.type) items = items.filter((e) => e.type === filter.type)
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    if (filter?.limit != null) items = items.slice(0, filter.limit)
    return items
  },

  async append(event: AppendActivityInput): Promise<CompanyActivityEvent> {
    if (isReal('companies')) {
      // BE activity is write-through from other mutations; local append is no-op for persistence
      return {
        id: `act-local-${Date.now()}`,
        companyId: event.companyId ?? CURRENT_COMPANY_ID,
        type: event.type,
        actorName: event.actorName,
        action: event.action,
        entityLabel: event.entityLabel,
        createdAt: event.createdAt ?? new Date().toISOString(),
      }
    }
    await delay()
    return appendSync(event)
  },

  appendSync,
}

export { COMPANY_ACTIVITY_TYPE }
