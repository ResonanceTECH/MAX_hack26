import type { Company } from '@/entities/company'
import type { User, SystemRole } from '@/entities/user'
import { apiClient } from '@/shared/api/apiClient'
import { isReal } from '@/shared/api/apiCapabilities'
import type { AuthResponseDto, CompanyDto, UserDto } from '@/shared/api/dto/backend'
import { toApiError } from '@/shared/api/errors'
import { mapCompanyDtoToModel } from '@/shared/api/mappers/companyMapper'
import {
  DEV_PERSONA_MAX_USER_IDS,
  DEV_ROLE_MAX_USER_IDS,
  mapUserDtoToModel,
  persistAccessToken,
} from '@/shared/api/mappers/userMapper'
import {
  getDevPersonaByMaxUserId,
  type DevPersonaId,
} from '@/features/auth/model/devPersonas'
import { delay } from '@/shared/lib/delay'
import {
  getCompanyById,
  getMockUserByPersona,
  getMockUserByRole,
  mockCurrentUser,
} from '@/shared/mocks'

export interface SessionPayload {
  user: User
  company: Company | null
  role: SystemRole
}

export interface GetSessionOptions {
  role?: SystemRole
  personaId?: DevPersonaId
  maxUserId?: number
}

function resolveMaxUserId(opts?: GetSessionOptions): number {
  if (opts?.maxUserId != null) return opts.maxUserId
  if (opts?.personaId) return DEV_PERSONA_MAX_USER_IDS[opts.personaId]
  if (opts?.role) return DEV_ROLE_MAX_USER_IDS[opts.role]
  return DEV_ROLE_MAX_USER_IDS.BUSINESS_USER
}

function enrichCompanyMemberRole(user: User): User {
  if (user.companyMemberRole != null) return user
  const persona = getDevPersonaByMaxUserId(user.maxUserId)
  if (persona) {
    return { ...user, companyMemberRole: persona.companyMemberRole }
  }
  return user
}

async function realAuth(opts?: GetSessionOptions): Promise<SessionPayload> {
  try {
    const maxUserId = resolveMaxUserId(opts)
    const auth = await apiClient.post<AuthResponseDto>('/auth/max', {
      dev_max_user_id: maxUserId,
    })
    persistAccessToken(auth.data.access_token)

    const me = await apiClient.get<UserDto>('/me')
    const user = enrichCompanyMemberRole(mapUserDtoToModel(me.data))

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

function normalizeOpts(
  roleOrOpts?: SystemRole | GetSessionOptions,
): GetSessionOptions | undefined {
  if (roleOrOpts == null) return undefined
  if (typeof roleOrOpts === 'string') return { role: roleOrOpts }
  return roleOrOpts
}

function mockSession(opts?: GetSessionOptions): SessionPayload {
  let user: User
  if (opts?.personaId) {
    user = getMockUserByPersona(opts.personaId)
  } else if (opts?.maxUserId != null) {
    const persona = getDevPersonaByMaxUserId(opts.maxUserId)
    user = persona ? getMockUserByPersona(persona.id) : { ...mockCurrentUser }
  } else if (opts?.role) {
    user = getMockUserByRole(opts.role)
  } else {
    user = { ...mockCurrentUser }
  }
  user = enrichCompanyMemberRole(user)
  const company = user.companyId ? (getCompanyById(user.companyId) ?? null) : null
  return { user, company, role: user.role }
}

export const authApi = {
  async getCurrentUser(roleOrOpts?: SystemRole | GetSessionOptions): Promise<User> {
    const opts = normalizeOpts(roleOrOpts)
    if (isReal('auth')) {
      const session = await realAuth(opts)
      return session.user
    }
    await delay()
    return mockSession(opts).user
  },

  /** @deprecated prefer getSession({ personaId }) */
  async getSessionByMaxUserId(maxUserId: number): Promise<SessionPayload> {
    return authApi.getSession({ maxUserId })
  },

  async getSession(roleOrOpts?: SystemRole | GetSessionOptions): Promise<SessionPayload> {
    const opts = normalizeOpts(roleOrOpts)
    if (isReal('auth')) {
      return realAuth(opts)
    }
    await delay()
    return mockSession(opts)
  },
}
