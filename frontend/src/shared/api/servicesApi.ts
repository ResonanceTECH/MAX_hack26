import { COMPANY_ACTIVITY_TYPE } from '@/entities/company-activity'
import {
  COMPANY_SERVICE_STATUS,
  type CompanyService,
  type CompanyServiceStatus,
} from '@/entities/company-service'
import { isServicePublic } from '@/features/company-management/model/businessRules'
import { apiClient } from '@/shared/api/apiClient'
import { isReal } from '@/shared/api/apiCapabilities'
import { toApiError } from '@/shared/api/errors'
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

interface ServiceDto {
  id: number
  company_id: number
  title: string
  description: string
  category: string
  status: string
  short_description?: string | null
  price_min?: number | null
  price_max?: number | null
  currency?: string
  regions?: string[]
  remote?: boolean
  technologies?: string[]
  capabilities?: string[]
  target_industries?: string[]
  created_at?: string
  updated_at?: string
}

function mapService(dto: ServiceDto): CompanyService {
  return {
    id: String(dto.id),
    companyId: String(dto.company_id),
    title: dto.title,
    description: dto.description,
    category: dto.category,
    status: dto.status as CompanyServiceStatus,
    shortDescription: dto.short_description ?? undefined,
    priceMin: dto.price_min ?? undefined,
    priceMax: dto.price_max ?? undefined,
    currency: dto.currency,
    regions: dto.regions,
    remote: dto.remote,
    technologies: dto.technologies,
    capabilities: dto.capabilities,
    targetIndustries: dto.target_industries,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  }
}

function toServiceBody(input: ServiceInput) {
  return {
    title: input.title,
    description: input.description,
    category: input.category,
    status: input.status,
    short_description: input.shortDescription,
    price_min: input.priceMin,
    price_max: input.priceMax,
    currency: input.currency,
    regions: input.regions,
    remote: input.remote,
    technologies: input.technologies,
    capabilities: input.capabilities,
    target_industries: input.targetIndustries,
  }
}

export const servicesApi = {
  async list(companyId = CURRENT_COMPANY_ID): Promise<CompanyService[]> {
    if (isReal('services')) {
      try {
        const { data } = await apiClient.get<ServiceDto[]>('/companies/me/services')
        return data.map(mapService)
      } catch (error) {
        throw toApiError(error)
      }
    }
    await delay()
    return mockCompanyServices.filter((s) => s.companyId === companyId)
  },

  async listPublic(companyId = CURRENT_COMPANY_ID): Promise<CompanyService[]> {
    if (isReal('services')) {
      try {
        const { data } = await apiClient.get<ServiceDto[]>(`/companies/${companyId}/services`)
        return data.map(mapService)
      } catch (error) {
        throw toApiError(error)
      }
    }
    await delay()
    return mockCompanyServices.filter((s) => s.companyId === companyId && isServicePublic(s))
  },

  async getById(id: string): Promise<CompanyService> {
    if (isReal('services')) {
      const all = await servicesApi.list()
      const service = all.find((s) => s.id === id)
      if (!service) throw new Error('Услуга не найдена')
      return service
    }
    await delay()
    const service = mockCompanyServices.find((s) => s.id === id)
    if (!service) throw new Error('Услуга не найдена')
    return { ...service }
  },

  async create(input: ServiceInput, companyId = CURRENT_COMPANY_ID): Promise<CompanyService> {
    if (isReal('services')) {
      try {
        const { data } = await apiClient.post<ServiceDto>('/companies/me/services', toServiceBody(input))
        return mapService(data)
      } catch (error) {
        throw toApiError(error)
      }
    }
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
    if (isReal('services')) {
      try {
        const { data } = await apiClient.patch<ServiceDto>(
          `/companies/me/services/${id}`,
          toServiceBody(input as ServiceInput),
        )
        return mapService(data)
      } catch (error) {
        throw toApiError(error)
      }
    }
    await delay()
    const service = mockCompanyServices.find((s) => s.id === id)
    if (!service) throw new Error('Услуга не найдена')
    Object.assign(service, input, { updatedAt: new Date().toISOString() })
    persistCompanyServices()
    return { ...service }
  },

  async publish(id: string): Promise<CompanyService> {
    return servicesApi.update(id, { status: COMPANY_SERVICE_STATUS.ACTIVE })
  },

  async hide(id: string): Promise<CompanyService> {
    return servicesApi.update(id, { status: COMPANY_SERVICE_STATUS.HIDDEN })
  },

  async archive(id: string): Promise<CompanyService> {
    if (isReal('services')) {
      try {
        await apiClient.delete(`/companies/me/services/${id}`)
        const service = await servicesApi.getById(id).catch(() => null)
        if (service) return { ...service, status: COMPANY_SERVICE_STATUS.ARCHIVED }
        return {
          id,
          companyId: CURRENT_COMPANY_ID,
          title: '',
          description: '',
          category: '',
          status: COMPANY_SERVICE_STATUS.ARCHIVED,
        }
      } catch (error) {
        throw toApiError(error)
      }
    }
    await delay()
    const service = mockCompanyServices.find((s) => s.id === id)
    if (!service) throw new Error('Услуга не найдена')
    service.status = COMPANY_SERVICE_STATUS.ARCHIVED
    service.updatedAt = new Date().toISOString()
    persistCompanyServices()
    return { ...service }
  },

  async remove(id: string): Promise<void> {
    if (isReal('services')) {
      await apiClient.delete(`/companies/me/services/${id}`)
      return
    }
    await delay()
    const idx = mockCompanyServices.findIndex((s) => s.id === id)
    if (idx < 0) throw new Error('Услуга не найдена')
    mockCompanyServices.splice(idx, 1)
    persistCompanyServices()
  },
}
