import { COMPANY_ACTIVITY_TYPE } from '@/entities/company-activity'
import {
  COMPANY_CASE_STATUS,
  type CompanyCase,
  type CompanyCaseStatus,
} from '@/entities/company-case'
import { isCasePublic } from '@/features/company-management/model/businessRules'
import { apiClient } from '@/shared/api/apiClient'
import { isReal } from '@/shared/api/apiCapabilities'
import { toApiError } from '@/shared/api/errors'
import { delay } from '@/shared/lib/delay'
import { mockCompanyCases } from '@/shared/mocks'
import { persistCompanyCases } from '@/shared/mocks/hydrateMocks'
import { activityApi } from './activityApi'

export interface CaseInput {
  title: string
  industry: string
  description: string
  result: string
  technologies: string[]
  status?: CompanyCaseStatus
  clientName?: string
  clientVisible?: boolean
  solution?: string
  startDate?: string
  endDate?: string
  coverUrl?: string
  externalUrl?: string
  capabilities?: string[]
}

const DEFAULT_ACTOR = 'Анна Смирнова'

interface CaseDto {
  id: number
  company_id: number
  title: string
  industry: string
  description: string
  result: string
  technologies: string[]
  status: string
  client_name?: string | null
  client_visible?: boolean
  solution?: string | null
  start_date?: string | null
  end_date?: string | null
  cover_url?: string | null
  external_url?: string | null
  capabilities?: string[]
}

function mapCase(dto: CaseDto): CompanyCase {
  return {
    id: String(dto.id),
    companyId: String(dto.company_id),
    title: dto.title,
    industry: dto.industry,
    description: dto.description,
    result: dto.result,
    technologies: dto.technologies ?? [],
    status: dto.status as CompanyCaseStatus,
    clientName: dto.client_name ?? undefined,
    clientVisible: dto.client_visible,
    solution: dto.solution ?? undefined,
    startDate: dto.start_date ?? undefined,
    endDate: dto.end_date ?? undefined,
    coverUrl: dto.cover_url ?? undefined,
    externalUrl: dto.external_url ?? undefined,
    capabilities: dto.capabilities,
  }
}

function toCaseBody(input: Partial<CaseInput>) {
  return {
    title: input.title,
    industry: input.industry,
    description: input.description,
    result: input.result,
    technologies: input.technologies,
    status: input.status,
    client_name: input.clientName,
    client_visible: input.clientVisible,
    solution: input.solution,
    start_date: input.startDate,
    end_date: input.endDate,
    cover_url: input.coverUrl,
    external_url: input.externalUrl,
    capabilities: input.capabilities,
  }
}

export const casesApi = {
  async list(companyId?: string): Promise<CompanyCase[]> {
    if (isReal('cases')) {
      try {
        const { data } = await apiClient.get<CaseDto[]>('/companies/me/cases')
        return data.map(mapCase)
      } catch (error) {
        throw toApiError(error)
      }
    }
    await delay()
    if (!companyId) throw new Error('companyId required in mock mode')
    return mockCompanyCases.filter((c) => c.companyId === companyId)
  },

  async listPublic(companyId: string): Promise<CompanyCase[]> {
    if (isReal('cases')) {
      try {
        const { data } = await apiClient.get<CaseDto[]>(`/companies/${companyId}/cases`)
        return data.map(mapCase)
      } catch (error) {
        throw toApiError(error)
      }
    }
    await delay()
    return mockCompanyCases.filter((c) => c.companyId === companyId && isCasePublic(c))
  },

  async getById(id: string, companyId?: string): Promise<CompanyCase> {
    if (isReal('cases')) {
      const all = await casesApi.list(companyId)
      const item = all.find((c) => c.id === id)
      if (!item) throw new Error('Кейс не найден')
      return item
    }
    await delay()
    const item = mockCompanyCases.find((c) => c.id === id)
    if (!item) throw new Error('Кейс не найден')
    return { ...item }
  },

  async create(input: CaseInput, companyId?: string): Promise<CompanyCase> {
    if (isReal('cases')) {
      try {
        const { data } = await apiClient.post<CaseDto>('/companies/me/cases', toCaseBody(input))
        return mapCase(data)
      } catch (error) {
        throw toApiError(error)
      }
    }
    await delay()
    if (!companyId) throw new Error('companyId required in mock mode')
    const item: CompanyCase = {
      id: `case-${Date.now()}`,
      companyId,
      title: input.title,
      industry: input.industry,
      description: input.description,
      result: input.result,
      technologies: input.technologies,
      status: input.status ?? COMPANY_CASE_STATUS.DRAFT,
      clientName: input.clientName,
      clientVisible: input.clientVisible,
      solution: input.solution,
      startDate: input.startDate,
      endDate: input.endDate,
      coverUrl: input.coverUrl,
      externalUrl: input.externalUrl,
      capabilities: input.capabilities,
    }
    mockCompanyCases.push(item)
    persistCompanyCases()
    activityApi.appendSync({
      companyId,
      type: COMPANY_ACTIVITY_TYPE.CASE_CREATED,
      actorName: DEFAULT_ACTOR,
      action: 'добавила кейс',
      entityLabel: item.title,
    })
    return item
  },

  async update(id: string, input: Partial<CaseInput>): Promise<CompanyCase> {
    if (isReal('cases')) {
      try {
        const { data } = await apiClient.patch<CaseDto>(`/companies/me/cases/${id}`, toCaseBody(input))
        return mapCase(data)
      } catch (error) {
        throw toApiError(error)
      }
    }
    await delay()
    const item = mockCompanyCases.find((c) => c.id === id)
    if (!item) throw new Error('Кейс не найден')
    Object.assign(item, input)
    persistCompanyCases()
    return { ...item }
  },

  async publish(id: string): Promise<CompanyCase> {
    return casesApi.update(id, { status: COMPANY_CASE_STATUS.PUBLISHED })
  },

  async hide(id: string): Promise<CompanyCase> {
    return casesApi.update(id, { status: COMPANY_CASE_STATUS.HIDDEN })
  },

  async archive(id: string): Promise<CompanyCase> {
    if (isReal('cases')) {
      try {
        await apiClient.delete(`/companies/me/cases/${id}`)
        return { ...(await casesApi.getById(id).catch(() => null)), status: COMPANY_CASE_STATUS.ARCHIVED } as CompanyCase
      } catch (error) {
        throw toApiError(error)
      }
    }
    await delay()
    const item = mockCompanyCases.find((c) => c.id === id)
    if (!item) throw new Error('Кейс не найден')
    item.status = COMPANY_CASE_STATUS.ARCHIVED
    persistCompanyCases()
    return { ...item }
  },

  async remove(id: string): Promise<void> {
    if (isReal('cases')) {
      await apiClient.delete(`/companies/me/cases/${id}`)
      return
    }
    await delay()
    const idx = mockCompanyCases.findIndex((c) => c.id === id)
    if (idx < 0) throw new Error('Кейс не найден')
    mockCompanyCases.splice(idx, 1)
    persistCompanyCases()
  },
}
