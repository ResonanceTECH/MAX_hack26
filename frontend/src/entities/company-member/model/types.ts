export const COMPANY_MEMBER_ROLES = {
  COMPANY_ADMIN: 'COMPANY_ADMIN',
  MANAGER: 'MANAGER',
  VIEWER: 'VIEWER',
} as const

export type CompanyMemberRole = (typeof COMPANY_MEMBER_ROLES)[keyof typeof COMPANY_MEMBER_ROLES]

export const COMPANY_MEMBER_ROLE_LABELS: Record<CompanyMemberRole, string> = {
  COMPANY_ADMIN: 'Company Admin',
  MANAGER: 'Manager',
  VIEWER: 'Viewer',
}

export const COMPANY_MEMBER_STATUS = {
  ACTIVE: 'active',
  BLOCKED: 'blocked',
  INVITED: 'invited',
} as const

export type CompanyMemberStatus =
  (typeof COMPANY_MEMBER_STATUS)[keyof typeof COMPANY_MEMBER_STATUS]

export interface CompanyMember {
  id: string
  userId: string
  companyId: string
  firstName: string
  lastName: string
  email: string
  role: CompanyMemberRole
  status: CompanyMemberStatus
  invitedAt: string
}
