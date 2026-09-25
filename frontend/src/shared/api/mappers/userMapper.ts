import type { SystemRole, User } from '@/entities/user'
import { SYSTEM_ROLES, USER_STATUS } from '@/entities/user'
import type { UserDto } from '@/shared/api/dto/backend'

/** Seed MAX user ids → frontend demo roles (DEV_MODE). */
export const DEV_ROLE_MAX_USER_IDS: Record<SystemRole, number> = {
  [SYSTEM_ROLES.PLATFORM_ADMIN]: 7777001,
  [SYSTEM_ROLES.COMPANY_ADMIN]: 7777001,
  [SYSTEM_ROLES.BUSINESS_USER]: 7777002,
  [SYSTEM_ROLES.MODERATOR]: 7777001, // backend has no moderator — map to admin seed
}

export function mapUserDtoToModel(dto: UserDto): User {
  const role: SystemRole = dto.is_admin
    ? SYSTEM_ROLES.PLATFORM_ADMIN
    : dto.company_id
      ? SYSTEM_ROLES.COMPANY_ADMIN
      : SYSTEM_ROLES.BUSINESS_USER

  return {
    id: String(dto.id),
    maxUserId: String(dto.max_user_id),
    firstName: dto.first_name ?? '',
    lastName: dto.last_name ?? '',
    avatarUrl: null,
    companyId: dto.company_id != null ? String(dto.company_id) : null,
    role,
    status: USER_STATUS.ACTIVE,
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
