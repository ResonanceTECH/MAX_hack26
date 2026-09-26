import { apiClient } from '@/shared/api/apiClient'
import { isReal } from '@/shared/api/apiCapabilities'
import { toApiError } from '@/shared/api/errors'
import { delay } from '@/shared/lib/delay'
import { mockCompanyVerification, type CompanyVerification } from '@/shared/mocks'
import { CURRENT_COMPANY_ID } from '@/shared/mocks/user'

interface VerificationDto {
  company_id: number
  status: CompanyVerification['status']
  blocks: CompanyVerification['blocks']
  updated_at: string
}

export const verificationApi = {
  async get(companyId = CURRENT_COMPANY_ID): Promise<CompanyVerification> {
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
    return { ...structuredClone(mockCompanyVerification), companyId }
  },

  async submit(): Promise<CompanyVerification> {
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
    return verificationApi.get()
  },
}
