export const COMPANY_SERVICE_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  HIDDEN: 'hidden',
  ARCHIVED: 'archived',
} as const

export type CompanyServiceStatus =
  (typeof COMPANY_SERVICE_STATUS)[keyof typeof COMPANY_SERVICE_STATUS]

export interface CompanyService {
  id: string
  companyId: string
  title: string
  description: string
  category: string
  status: CompanyServiceStatus
  shortDescription?: string
  priceMin?: number
  priceMax?: number
  currency?: string
  regions?: string[]
  remote?: boolean
  technologies?: string[]
  capabilities?: string[]
  targetIndustries?: string[]
  createdAt?: string
  updatedAt?: string
}
