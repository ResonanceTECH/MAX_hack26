export const USER_ROLES = {
  COMPANY_OWNER: 'company_owner',
  COMPANY_MANAGER: 'company_manager',
  COMPANY_VIEWER: 'company_viewer',
  MODERATOR: 'moderator',
  PLATFORM_ADMIN: 'platform_admin',
} as const

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]

export interface User {
  id: string
  maxUserId: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  companyId: string
  role: UserRole
}
