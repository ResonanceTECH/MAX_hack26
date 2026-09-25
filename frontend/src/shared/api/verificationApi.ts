import { delay } from '@/shared/lib/delay'
import {
  mockCompanyVerification,
  type CompanyVerification,
} from '@/shared/mocks'
import { CURRENT_COMPANY_ID } from '@/shared/mocks/user'

export const verificationApi = {
  async get(companyId = CURRENT_COMPANY_ID): Promise<CompanyVerification> {
    await delay()
    return {
      ...structuredClone(mockCompanyVerification),
      companyId,
    }
  },
}
