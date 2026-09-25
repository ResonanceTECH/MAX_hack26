import { COMPANY_ACTIVITY_TYPE } from '@/entities/company-activity'
import {
  COMPANY_SERVICE_STATUS,
  type CompanyService,
  type CompanyServiceStatus,
} from '@/entities/company-service'
import { isServicePublic } from '@/features/company-management/model/businessRules'
import { delay } from '@/shared/lib/delay'
import { CURRENT_COMPANY_ID, mockCompanyServices } from '@/shared/mocks'
import { persistCompanyServices } from '@/shared/mocks/hydrateMocks'
import { activityApi } from './activityApi'

export interface ServiceInput {
  title: string
  description: string
  category: string
  status?: CompanyServiceStatus
  shortDescription?: string
  priceMin?: number
  priceMax?: number
  currency?: string
  regions?: string[]
  remote?: boolean
  technologies?: string[]
  capabilities?: string[]
  targetIndustries?: string[]
}

const DEFAULT_ACTOR = 'Анна Смирнова'

export const servicesApi = {
  async list(companyId = CURRENT_COMPANY_ID): Promise<CompanyService[]> {
    await delay()
    return mockCompanyServices.filter((s) => s.companyId === companyId)
  },

  async listPublic(companyId = CURRENT_COMPANY_ID): Promise<CompanyService[]> {
    await delay()
    return mockCompanyServices.filter((s) => s.companyId === companyId && isServicePublic(s))
  },

  async getById(id: string): Promise<CompanyService> {
    await delay()
    const service = mockCompanyServices.find((s) => s.id === id)
    if (!service) throw new Error('Услуга не найдена')
    return { ...service }
  },

  async create(input: ServiceInput, companyId = CURRENT_COMPANY_ID): Promise<CompanyService> {
    await delay()
    const now = new Date().toISOString()
    const service: CompanyService = {
      id: `svc-${Date.now()}`,
      companyId,
      title: input.title,
      description: input.description,
      category: input.category,
      status: input.status ?? COMPANY_SERVICE_STATUS.DRAFT,
      shortDescription: input.shortDescription,
      priceMin: input.priceMin,
      priceMax: input.priceMax,
      currency: input.currency ?? 'RUB',
      regions: input.regions,
      remote: input.remote,
      technologies: input.technologies,
      capabilities: input.capabilities,
      targetIndustries: input.targetIndustries,
      createdAt: now,
      updatedAt: now,
    }
    mockCompanyServices.push(service)
    persistCompanyServices()
    activityApi.appendSync({
      companyId,
      type: COMPANY_ACTIVITY_TYPE.SERVICE_CREATED,
      actorName: DEFAULT_ACTOR,
      action: 'добавила услугу',
      entityLabel: service.title,
    })
    return service
  },

  async update(id: string, input: Partial<ServiceInput>): Promise<CompanyService> {
    await delay()
    const service = mockCompanyServices.find((s) => s.id === id)
    if (!service) throw new Error('Услуга не найдена')
    Object.assign(service, input, { updatedAt: new Date().toISOString() })
    persistCompanyServices()
    activityApi.appendSync({
      companyId: service.companyId,
      type: COMPANY_ACTIVITY_TYPE.SERVICE_UPDATED,
      actorName: DEFAULT_ACTOR,
      action: 'обновила услугу',
      entityLabel: service.title,
    })
    return { ...service }
  },

  async publish(id: string): Promise<CompanyService> {
    return servicesApi.update(id, { status: COMPANY_SERVICE_STATUS.ACTIVE })
  },

  async hide(id: string): Promise<CompanyService> {
    await delay()
    const service = mockCompanyServices.find((s) => s.id === id)
    if (!service) throw new Error('Услуга не найдена')
    service.status = COMPANY_SERVICE_STATUS.HIDDEN
    service.updatedAt = new Date().toISOString()
    persistCompanyServices()
    activityApi.appendSync({
      companyId: service.companyId,
      type: COMPANY_ACTIVITY_TYPE.SERVICE_HIDDEN,
      actorName: DEFAULT_ACTOR,
      action: 'скрыла услугу',
      entityLabel: service.title,
    })
    return { ...service }
  },

  async archive(id: string): Promise<CompanyService> {
    await delay()
    const service = mockCompanyServices.find((s) => s.id === id)
    if (!service) throw new Error('Услуга не найдена')
    service.status = COMPANY_SERVICE_STATUS.ARCHIVED
    service.updatedAt = new Date().toISOString()
    persistCompanyServices()
    activityApi.appendSync({
      companyId: service.companyId,
      type: COMPANY_ACTIVITY_TYPE.SERVICE_ARCHIVED,
      actorName: DEFAULT_ACTOR,
      action: 'архивировала услугу',
      entityLabel: service.title,
    })
    return { ...service }
  },

  async remove(id: string): Promise<void> {
    await delay()
    const idx = mockCompanyServices.findIndex((s) => s.id === id)
    if (idx < 0) throw new Error('Услуга не найдена')
    const [removed] = mockCompanyServices.splice(idx, 1)
    persistCompanyServices()
    if (removed) {
      activityApi.appendSync({
        companyId: removed.companyId,
        type: COMPANY_ACTIVITY_TYPE.SERVICE_ARCHIVED,
        actorName: DEFAULT_ACTOR,
        action: 'удалила услугу',
        entityLabel: removed.title,
      })
    }
  },
}
