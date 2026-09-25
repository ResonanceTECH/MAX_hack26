import { COMPANY_ACTIVITY_TYPE } from '@/entities/company-activity'
import type { Company } from '@/entities/company'
import {
  calculateCompanyProfileCompletion,
  canEditVerifiedField,
  type ProfileCompletionResult,
} from '@/features/company-management/model/businessRules'
import { delay } from '@/shared/lib/delay'
import {
  getCompanyById,
  mockCompanies,
  mockCompanyCases,
  mockCompanyDocuments,
  mockCompanyServices,
  CURRENT_COMPANY_ID,
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
  async getCurrent(companyId = CURRENT_COMPANY_ID): Promise<Company> {
    await delay()
    const company = getCompanyById(companyId)
    if (!company) throw new Error('Компания не найдена')
    return { ...company }
  },

  async getCompletion(companyId = CURRENT_COMPANY_ID): Promise<ProfileCompletionResult> {
    await delay()
    const company = getCompanyById(companyId)
    if (!company) throw new Error('Компания не найдена')
    return calculateCompanyProfileCompletion(company, {
      services: mockCompanyServices.filter((s) => s.companyId === companyId),
      cases: mockCompanyCases.filter((c) => c.companyId === companyId),
      documents: mockCompanyDocuments.filter((d) => d.companyId === companyId),
    })
  },

  async updateProfile(companyId: string, patch: CompanyProfileUpdate): Promise<Company> {
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
