import type { CompanyMemberRole } from '@/entities/company-member'
import type { SystemRole } from '@/entities/user'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import type { Permission } from '../model/permissions'
import { hasAllPermissions, hasAnyPermission, hasPermission } from '../model/hasPermission'

export function usePermission(permission: Permission): boolean {
  const role = useSessionStore((s) => s.role)
  const companyMemberRole = useSessionStore((s) => s.companyMemberRole)
  return hasPermission(role, permission, companyMemberRole)
}

export function usePermissions(): {
  has: (p: Permission) => boolean
  hasAny: (permissions: Permission[]) => boolean
  hasAll: (permissions: Permission[]) => boolean
  role: SystemRole | null
  companyMemberRole: CompanyMemberRole | null
} {
  const role = useSessionStore((s) => s.role)
  const companyMemberRole = useSessionStore((s) => s.companyMemberRole)
  return {
    role,
    companyMemberRole,
    has: (p: Permission) => hasPermission(role, p, companyMemberRole),
    hasAny: (permissions: Permission[]) => hasAnyPermission(role, permissions, companyMemberRole),
    hasAll: (permissions: Permission[]) => hasAllPermissions(role, permissions, companyMemberRole),
  }
}
