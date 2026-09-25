export const COMPANY_DOCUMENT_STATUS = {
  PENDING: 'Pending',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
} as const

export type CompanyDocumentStatus =
  (typeof COMPANY_DOCUMENT_STATUS)[keyof typeof COMPANY_DOCUMENT_STATUS]

export interface CompanyDocument {
  id: string
  companyId: string
  name: string
  type: string
  status: CompanyDocumentStatus
  uploadedAt: string
  fileName: string
}
