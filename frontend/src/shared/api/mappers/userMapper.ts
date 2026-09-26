import type { SystemRole, User } from '@/entities/user'
import { SYSTEM_ROLES, USER_STATUS } from '@/entities/user'
import type { UserDto } from '@/shared/api/dto/backend'

/** Seed MAX user ids → frontend demo roles (DEV_MODE). */
export const DEV_ROLE_MAX_USER_IDS: Record<SystemRole, number> = {
  [SYSTEM_ROLES.PLATFORM_ADMIN]: 7777001,
  [SYSTEM_ROLES.COMPANY_ADMIN]: 7777002,
  [SYSTEM_ROLES.BUSINESS_USER]: 7777003,
  [SYSTEM_ROLES.MODERATOR]: 7777009,
}

const ROLE_SET = new Set<string>(Object.values(SYSTEM_ROLES))

export function mapUserDtoToModel(dto: UserDto): User {
  let role: SystemRole = SYSTEM_ROLES.BUSINESS_USER
  if (dto.role && ROLE_SET.has(dto.role)) {
    role = dto.role as SystemRole
  } else if (dto.is_admin) {
    role = SYSTEM_ROLES.PLATFORM_ADMIN
  } else if (dto.company_id) {
    role = SYSTEM_ROLES.COMPANY_ADMIN
  }

  const status =
    dto.status === 'blocked' || dto.status === 'suspended' || dto.status === 'invited'
      ? dto.status
      : USER_STATUS.ACTIVE

  return {
    id: String(dto.id),
    maxUserId: String(dto.max_user_id),
    firstName: dto.first_name ?? '',
    lastName: dto.last_name ?? '',
    avatarUrl: null,
    companyId: dto.company_id != null ? String(dto.company_id) : null,
    role,
    status,
    createdAt: dto.created_at,
  }
}

export const TOKEN_STORAGE_KEY = 'b2b_match_token'

export function persistAccessToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

export function clearAccessToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}
