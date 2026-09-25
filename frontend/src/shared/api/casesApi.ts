import { COMPANY_ACTIVITY_TYPE } from '@/entities/company-activity'
import {
  COMPANY_CASE_STATUS,
  type CompanyCase,
  type CompanyCaseStatus,
} from '@/entities/company-case'
import { isCasePublic } from '@/features/company-management/model/businessRules'
import { delay } from '@/shared/lib/delay'
import { CURRENT_COMPANY_ID, mockCompanyCases } from '@/shared/mocks'
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

export const casesApi = {
  async list(companyId = CURRENT_COMPANY_ID): Promise<CompanyCase[]> {
    await delay()
    return mockCompanyCases.filter((c) => c.companyId === companyId)
  },

  async listPublic(companyId = CURRENT_COMPANY_ID): Promise<CompanyCase[]> {
    await delay()
    return mockCompanyCases.filter((c) => c.companyId === companyId && isCasePublic(c))
  },

  async getById(id: string): Promise<CompanyCase> {
    await delay()
    const item = mockCompanyCases.find((c) => c.id === id)
    if (!item) throw new Error('Кейс не найден')
    return { ...item }
  },

  async create(input: CaseInput, companyId = CURRENT_COMPANY_ID): Promise<CompanyCase> {
    await delay()
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
    await delay()
    const item = mockCompanyCases.find((c) => c.id === id)
    if (!item) throw new Error('Кейс не найден')
    Object.assign(item, input)
    persistCompanyCases()
    activityApi.appendSync({
      companyId: item.companyId,
      type: COMPANY_ACTIVITY_TYPE.CASE_UPDATED,
      actorName: DEFAULT_ACTOR,
      action: 'обновила кейс',
      entityLabel: item.title,
    })
    return { ...item }
  },

  async publish(id: string): Promise<CompanyCase> {
    return casesApi.update(id, { status: COMPANY_CASE_STATUS.PUBLISHED })
  },

  async hide(id: string): Promise<CompanyCase> {
    return casesApi.update(id, { status: COMPANY_CASE_STATUS.HIDDEN })
  },

  async archive(id: string): Promise<CompanyCase> {
    await delay()
    const item = mockCompanyCases.find((c) => c.id === id)
    if (!item) throw new Error('Кейс не найден')
    item.status = COMPANY_CASE_STATUS.ARCHIVED
    persistCompanyCases()
    activityApi.appendSync({
      companyId: item.companyId,
      type: COMPANY_ACTIVITY_TYPE.CASE_ARCHIVED,
      actorName: DEFAULT_ACTOR,
      action: 'архивировала кейс',
      entityLabel: item.title,
    })
    return { ...item }
  },

  async remove(id: string): Promise<void> {
    await delay()
    const idx = mockCompanyCases.findIndex((c) => c.id === id)
    if (idx < 0) throw new Error('Кейс не найден')
    const [removed] = mockCompanyCases.splice(idx, 1)
    persistCompanyCases()
    if (removed) {
      activityApi.appendSync({
        companyId: removed.companyId,
        type: COMPANY_ACTIVITY_TYPE.CASE_ARCHIVED,
        actorName: DEFAULT_ACTOR,
        action: 'удалила кейс',
        entityLabel: removed.title,
      })
    }
  },
}
