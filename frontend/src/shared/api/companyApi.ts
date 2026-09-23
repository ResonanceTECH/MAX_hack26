import type { Company } from '@/entities/company'
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

export const companyApi = {
  async getAll(filters?: CompanyFilters): Promise<Company[]> {
    await delay()
    return applyFilters(mockCompanies, filters)
  },

  async getById(id: string): Promise<Company> {
    await delay()
    const company = getCompanyById(id)
    if (!company) throw new Error('Компания не найдена')
    return company
  },
}
