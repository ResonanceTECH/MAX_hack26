import type { Company } from '@/entities/company'
import { apiClient } from '@/shared/api/apiClient'
import { isReal } from '@/shared/api/apiCapabilities'
import type { CompanyDto } from '@/shared/api/dto/backend'
import { toApiError } from '@/shared/api/errors'
import { mapCompanyDtoToModel } from '@/shared/api/mappers/companyMapper'
import { delay } from '@/shared/lib/delay'
import { getCompanyById, mockCompanies } from '@/shared/mocks'

export interface CompanyFilters {
  query?: string
  industries?: string[]
  services?: string[]
  technologies?: string[]
  region?: string
  priceFrom?: number
  priceTo?: number
  minRating?: number
  verified?: boolean
  hasCases?: boolean
}

function applyFilters(companies: Company[], filters?: CompanyFilters): Company[] {
  if (!filters) return companies
  return companies.filter((c) => {
    if (filters.query) {
      const q = filters.query.toLowerCase()
      const hay = `${c.name} ${c.shortName} ${c.description}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    if (filters.industries?.length && !filters.industries.some((i) => c.industries.includes(i))) {
      return false
    }
    if (filters.services?.length && !filters.services.some((s) => c.services.includes(s))) {
      return false
    }
    if (
      filters.technologies?.length &&
      !filters.technologies.some((t) => c.technologies.includes(t))
    ) {
      return false
    }
    if (filters.region && c.region !== filters.region) return false
    if (filters.priceFrom != null && c.priceFrom != null && c.priceFrom < filters.priceFrom) {
      return false
    }
    if (filters.priceTo != null && c.priceFrom != null && c.priceFrom > filters.priceTo) {
      return false
    }
    if (filters.minRating != null && c.rating < filters.minRating) return false
    if (filters.verified != null && c.verified !== filters.verified) return false
    if (filters.hasCases && c.casesCount <= 0) return false
    return true
  })
}

async function realGetAll(filters?: CompanyFilters): Promise<Company[]> {
  try {
    const { data } = await apiClient.get<CompanyDto[]>('/companies', {
      params: {
        q: filters?.query,
        category: filters?.industries?.[0],
        region: filters?.region,
        verified_only: filters?.verified === true ? true : undefined,
        limit: 100,
      },
    })
    let companies = data.map(mapCompanyDtoToModel)
    // Client-side for unsupported filters
    companies = applyFilters(companies, {
      services: filters?.services,
      technologies: filters?.technologies,
      priceFrom: filters?.priceFrom,
      priceTo: filters?.priceTo,
      minRating: filters?.minRating,
      hasCases: filters?.hasCases,
    })
    return companies
  } catch (error) {
    throw toApiError(error)
  }
}

export const companyApi = {
  async getAll(filters?: CompanyFilters): Promise<Company[]> {
    if (isReal('companies')) return realGetAll(filters)
    await delay()
    return applyFilters(mockCompanies, filters)
  },

  async getById(id: string): Promise<Company> {
    if (isReal('companies')) {
      try {
        const { data } = await apiClient.get<CompanyDto>(`/companies/${id}`)
        return mapCompanyDtoToModel(data)
      } catch (error) {
        throw toApiError(error)
      }
    }
    await delay()
    const company = getCompanyById(id)
    if (!company) throw new Error('Компания не найдена')
    return company
  },
}
