import { COMPANY_ACTIVITY_TYPE } from '@/entities/company-activity'
import type { Company } from '@/entities/company'
import {
  calculateCompanyProfileCompletion,
  canEditVerifiedField,
  type ProfileCompletionResult,
} from '@/features/company-management/model/businessRules'
import { apiClient } from '@/shared/api/apiClient'
import { isReal } from '@/shared/api/apiCapabilities'
import type { CompanyDto } from '@/shared/api/dto/backend'
import { toApiError } from '@/shared/api/errors'
import { mapCompanyDtoToModel } from '@/shared/api/mappers/companyMapper'
import { delay } from '@/shared/lib/delay'
import {
  getCompanyById,
  mockCompanies,
  mockCompanyCases,
  mockCompanyDocuments,
  mockCompanyServices,
} from '@/shared/mocks'
import { persistCompanies } from '@/shared/mocks/hydrateMocks'
import { activityApi } from './activityApi'

export interface CompanyProfileUpdate {
  description?: string
  website?: string | null
  region?: string
  industries?: string[]
  capabilities?: string[]
  technologies?: string[]
  services?: string[]
  shortName?: string
  logoUrl?: string | null
  priceFrom?: number | null
  priceTo?: number | null
  name?: string
  inn?: string
  ogrn?: string
}

const DEFAULT_ACTOR = 'Анна Смирнова'

const LOCKED_ON_VERIFIED = ['inn', 'ogrn', 'name'] as const

export const companyManagementApi = {
  async getCurrent(companyId?: string): Promise<Company> {
    if (isReal('companies')) {
      try {
        const { data } = await apiClient.get<CompanyDto>('/companies/me')
        return mapCompanyDtoToModel(data)
      } catch (error) {
        throw toApiError(error)
      }
    }
    await delay()
    if (!companyId) throw new Error('companyId required in mock mode')
    const company = getCompanyById(companyId)
    if (!company) throw new Error('Компания не найдена')
    return { ...company }
  },

  async getCompletion(companyId?: string): Promise<ProfileCompletionResult> {
    if (isReal('companies')) {
      const company = await companyManagementApi.getCurrent(companyId)
      return calculateCompanyProfileCompletion(company, {
        services: [],
        cases: [],
        documents: [],
      })
    }
    await delay()
    if (!companyId) throw new Error('companyId required in mock mode')
    const company = getCompanyById(companyId)
    if (!company) throw new Error('Компания не найдена')
    return calculateCompanyProfileCompletion(company, {
      services: mockCompanyServices.filter((s) => s.companyId === companyId),
      cases: mockCompanyCases.filter((c) => c.companyId === companyId),
      documents: mockCompanyDocuments.filter((d) => d.companyId === companyId),
    })
  },

  async updateProfile(companyId: string, patch: CompanyProfileUpdate): Promise<Company> {
    if (isReal('companies')) {
      try {
        const body: Record<string, unknown> = {}
        if (patch.name != null) body.name = patch.name
        if (patch.inn != null) body.inn = patch.inn
        if (patch.description != null) body.description = patch.description
        if (patch.website !== undefined) body.website = patch.website
        if (patch.region != null) body.regions = [patch.region]
        if (patch.industries != null) body.industries = patch.industries
        if (patch.services != null) body.services = patch.services
        if (patch.capabilities != null) body.competencies = patch.capabilities
        if (patch.priceFrom !== undefined) body.budget_min = patch.priceFrom
        if (patch.priceTo !== undefined) body.budget_max = patch.priceTo
        const { data } = await apiClient.patch<CompanyDto>(`/companies/${companyId}`, body)
        return mapCompanyDtoToModel(data)
      } catch (error) {
        throw toApiError(error)
      }
    }
    await delay()
    const company = getCompanyById(companyId)
    if (!company) throw new Error('Компания не найдена')

    for (const field of LOCKED_ON_VERIFIED) {
      if (field in patch && patch[field] !== undefined && !canEditVerifiedField(field, company)) {
        throw new Error(`Поле «${field}» нельзя изменить у верифицированной компании`)
      }
    }

    Object.assign(company, patch)
    void mockCompanies
    persistCompanies()
    activityApi.appendSync({
      companyId,
      type: COMPANY_ACTIVITY_TYPE.PROFILE_UPDATED,
      actorName: DEFAULT_ACTOR,
      action: 'обновила профиль компании',
      entityLabel: company.shortName,
    })
    return { ...company }
  },

  /** Alias for updateProfile */
  async update(companyId: string, patch: CompanyProfileUpdate): Promise<Company> {
    return companyManagementApi.updateProfile(companyId, patch)
  },
}
