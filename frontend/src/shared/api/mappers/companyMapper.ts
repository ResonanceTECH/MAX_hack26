import type { Company } from '@/entities/company'
import type { CompanyDto } from '@/shared/api/dto/backend'

function shortName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return name.slice(0, 12)
  return parts.map((p) => p[0]).join('').toUpperCase().slice(0, 6) || name.slice(0, 12)
}

export function mapCompanyDtoToModel(dto: CompanyDto): Company {
  const cases = dto.cases ?? []
  return {
    id: String(dto.id),
    name: dto.name,
    shortName: shortName(dto.name),
    inn: dto.inn ?? '',
    ogrn: '',
    logoUrl: null,
    description: dto.description ?? '',
    website: dto.website,
    region: dto.regions?.[0] ?? '',
    industries: dto.industries ?? [],
    services: dto.services ?? [],
    capabilities: dto.competencies ?? [],
    technologies: [],
    priceFrom: dto.budget_min,
    priceTo: dto.budget_max,
    rating: dto.rating ?? 0,
    reviewsCount: 0,
    verified: Boolean(dto.is_verified),
    casesCount: cases.length,
    verificationStatus: dto.is_verified ? 'verified' : 'pending',
    status: 'active',
  }
}

export function companySummaryFromIds(
  companyId: number,
  companyName: string,
  extras?: Partial<Company>,
): Company {
  return {
    id: String(companyId),
    name: companyName || `Компания #${companyId}`,
    shortName: shortName(companyName || `C${companyId}`),
    inn: '',
    ogrn: '',
    logoUrl: null,
    description: '',
    website: null,
    region: '',
    industries: [],
    services: [],
    capabilities: [],
    technologies: [],
    priceFrom: null,
    priceTo: null,
    rating: 0,
    reviewsCount: 0,
    verified: false,
    casesCount: 0,
    verificationStatus: 'pending',
    status: 'active',
    ...extras,
  }
}
