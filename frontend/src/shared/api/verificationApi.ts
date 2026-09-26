import { apiClient } from '@/shared/api/apiClient'
import { isReal } from '@/shared/api/apiCapabilities'
import { toApiError } from '@/shared/api/errors'
import { delay } from '@/shared/lib/delay'
import { mockCompanyVerification, type CompanyVerification } from '@/shared/mocks'

interface VerificationDto {
  company_id: number
  status: CompanyVerification['status']
  blocks: CompanyVerification['blocks']
  updated_at: string
}

export const verificationApi = {
  async get(companyId?: string): Promise<CompanyVerification> {
    if (isReal('verification')) {
      try {
        const { data } = await apiClient.get<VerificationDto>('/companies/me/verification')
        return {
          companyId: String(data.company_id),
          status: data.status,
          blocks: data.blocks,
          updatedAt: data.updated_at,
        }
      } catch (error) {
        throw toApiError(error)
      }
    }
    await delay()
    if (!companyId) throw new Error('companyId required in mock mode')
    return { ...structuredClone(mockCompanyVerification), companyId }
  },

  async submit(companyId?: string): Promise<CompanyVerification> {
    if (isReal('verification')) {
      try {
        const { data } = await apiClient.post<VerificationDto>('/companies/me/verification')
        return {
          companyId: String(data.company_id),
          status: data.status,
          blocks: data.blocks,
          updatedAt: data.updated_at,
        }
      } catch (error) {
        throw toApiError(error)
      }
    }
    return verificationApi.get(companyId)
  },
}
