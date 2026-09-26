export const SYSTEM_ROLES = {
  BUSINESS_USER: 'BUSINESS_USER',
  COMPANY_ADMIN: 'COMPANY_ADMIN',
  MODERATOR: 'MODERATOR',
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
} as const

export type SystemRole = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES]

/** @deprecated use SystemRole / SYSTEM_ROLES */
export type UserRole = SystemRole
/** @deprecated use SYSTEM_ROLES */
export const USER_ROLES = SYSTEM_ROLES

export const USER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  BLOCKED: 'blocked',
  INVITED: 'invited',
} as const

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS]

export interface User {
  id: string
  maxUserId: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  companyId: string | null
  role: SystemRole
  status: UserStatus
  createdAt: string
  companyMemberRole?: import('@/entities/company-member').CompanyMemberRole | null
  email?: string | null
}

export interface CurrentSession {
  user: User
  company?: import('@/entities/company').Company
  role: SystemRole
}
