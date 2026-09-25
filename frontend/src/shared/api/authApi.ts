import type { Company } from '@/entities/company'
import type { User, SystemRole } from '@/entities/user'
import { apiClient } from '@/shared/api/apiClient'
import { isReal } from '@/shared/api/apiCapabilities'
import type { AuthResponseDto, CompanyDto, UserDto } from '@/shared/api/dto/backend'
import { toApiError } from '@/shared/api/errors'
import { mapCompanyDtoToModel } from '@/shared/api/mappers/companyMapper'
import {
  DEV_ROLE_MAX_USER_IDS,
  mapUserDtoToModel,
  persistAccessToken,
} from '@/shared/api/mappers/userMapper'
import { delay } from '@/shared/lib/delay'
import { getCompanyById, getMockUserByRole, mockCurrentUser } from '@/shared/mocks'

export interface SessionPayload {
  user: User
  company: Company | null
  role: SystemRole
}

async function realAuth(role?: SystemRole): Promise<SessionPayload> {
  try {
    const maxUserId = role ? DEV_ROLE_MAX_USER_IDS[role] : DEV_ROLE_MAX_USER_IDS.BUSINESS_USER
    const auth = await apiClient.post<AuthResponseDto>('/auth/max', {
      dev_max_user_id: maxUserId,
    })
    persistAccessToken(auth.data.access_token)

    const me = await apiClient.get<UserDto>('/me')
    const user = mapUserDtoToModel(me.data)

    let company: Company | null = null
    if (me.data.company_id != null) {
      try {
        const companyRes = await apiClient.get<CompanyDto>('/companies/me')
        company = mapCompanyDtoToModel(companyRes.data)
        user.companyId = company.id
      } catch {
        company = null
      }
    }

    return { user, company, role: user.role }
  } catch (error) {
    throw toApiError(error)
  }
}

export const authApi = {
  async getCurrentUser(role?: SystemRole): Promise<User> {
    if (isReal('auth')) {
      const session = await realAuth(role)
      return session.user
    }
    await delay()
    return role ? getMockUserByRole(role) : { ...mockCurrentUser }
  },

  async getSession(role?: SystemRole): Promise<SessionPayload> {
    if (isReal('auth')) {
      return realAuth(role)
    }
    await delay()
    const user = role ? getMockUserByRole(role) : { ...mockCurrentUser }
    const company = user.companyId ? (getCompanyById(user.companyId) ?? null) : null
    return { user, company, role: user.role }
  },
}
