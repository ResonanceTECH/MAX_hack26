export const COMPANY_DOCUMENT_STATUS = {
  PENDING: 'Pending',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
} as const

export type CompanyDocumentStatus =
  (typeof COMPANY_DOCUMENT_STATUS)[keyof typeof COMPANY_DOCUMENT_STATUS]

export const COMPANY_DOCUMENT_VERIFICATION_SOURCE = {
  COMPANY_DATA: 'COMPANY_DATA',
  MODEL_DATA: 'MODEL_DATA',
  PLATFORM_VERIFIED: 'PLATFORM_VERIFIED',
} as const

export type CompanyDocumentVerificationSource =
  (typeof COMPANY_DOCUMENT_VERIFICATION_SOURCE)[keyof typeof COMPANY_DOCUMENT_VERIFICATION_SOURCE]

export interface CompanyDocument {
  id: string
  companyId: string
  name: string
  type: string
  status: CompanyDocumentStatus
  uploadedAt: string
  fileName: string
  number?: string
  issuer?: string
  issuedAt?: string
  expiresAt?: string
  fileUrl?: string
  verificationSource?: CompanyDocumentVerificationSource
  updatedAt?: string
}
