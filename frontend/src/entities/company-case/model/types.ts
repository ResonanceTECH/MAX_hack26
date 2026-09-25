export const COMPANY_CASE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  HIDDEN: 'hidden',
  ARCHIVED: 'archived',
} as const

export type CompanyCaseStatus = (typeof COMPANY_CASE_STATUS)[keyof typeof COMPANY_CASE_STATUS]

export interface CompanyCase {
  id: string
  companyId: string
  title: string
  industry: string
  description: string
  result: string
  technologies: string[]
  status: CompanyCaseStatus
  clientName?: string
  clientVisible?: boolean
  solution?: string
  startDate?: string
  endDate?: string
  coverUrl?: string
  externalUrl?: string
  capabilities?: string[]
}
