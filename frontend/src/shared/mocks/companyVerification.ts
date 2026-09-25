import { CURRENT_COMPANY_ID } from './user'

export type CompanyVerificationBlockStatus = 'complete' | 'incomplete' | 'pending'

export type CompanyVerificationSource =
  | 'COMPANY_DATA'
  | 'MODEL_DATA'
  | 'PLATFORM_VERIFIED'

export type CompanyVerificationOverallStatus =
  | 'NOT_VERIFIED'
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED'
  | 'REQUIRES_UPDATE'

export interface CompanyVerificationBlock {
  id: string
  label: string
  status: CompanyVerificationBlockStatus
  source: CompanyVerificationSource
  description?: string
}

export interface CompanyVerification {
  companyId: string
  status: CompanyVerificationOverallStatus
  blocks: CompanyVerificationBlock[]
  updatedAt: string
}

export const mockCompanyVerification: CompanyVerification = {
  companyId: CURRENT_COMPANY_ID,
  status: 'VERIFIED',
  updatedAt: '2025-06-01T10:00:00.000Z',
  blocks: [
    {
      id: 'legal-entity',
      label: 'Юридическое лицо',
      status: 'complete',
      source: 'MODEL_DATA',
      description: 'ООО «Digital Lab»',
    },
    {
      id: 'inn',
      label: 'ИНН',
      status: 'complete',
      source: 'MODEL_DATA',
      description: '7701234567',
    },
    {
      id: 'ogrn',
      label: 'ОГРН',
      status: 'complete',
      source: 'MODEL_DATA',
      description: '1027700123456',
    },
    {
      id: 'representative',
      label: 'Представитель компании',
      status: 'complete',
      source: 'COMPANY_DATA',
      description: 'Анна Смирнова',
    },
    {
      id: 'basics',
      label: 'Основные данные',
      status: 'complete',
      source: 'COMPANY_DATA',
      description: 'Профиль заполнен',
    },
    {
      id: 'documents',
      label: 'Документы',
      status: 'pending',
      source: 'PLATFORM_VERIFIED',
      description: 'Часть документов на проверке',
    },
  ],
}
