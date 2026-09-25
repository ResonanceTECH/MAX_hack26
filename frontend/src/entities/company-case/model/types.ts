export const COMPANY_CASE_STATUS = {
  PUBLISHED: 'published',
  HIDDEN: 'hidden',
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
}
