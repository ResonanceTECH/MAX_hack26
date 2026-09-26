import type { CompanyMemberRole } from '@/entities/company-member'
import type { SystemRole } from '@/entities/user'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import type { Permission } from '../model/permissions'
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  resolveEffectivePermissions,
} from '../model/hasPermission'
import { useCompanyMembership } from './useCompanyMembership'

/**
 * Effective company role: live membership > session.companyMemberRole.
 */
function useEffectiveCompanyRole(): {
  companyRole: CompanyMemberRole | null
  systemRole: SystemRole | null
  isLoading: boolean
  hasMembership: boolean
} {
  const systemRole = useSessionStore((s) => s.role)
  const sessionCompanyRole = useSessionStore((s) => s.companyMemberRole)
  const { companyRole, membership, isLoading } = useCompanyMembership()
  const effective = membership?.role ?? companyRole ?? sessionCompanyRole ?? null
  return {
    companyRole: effective,
    systemRole,
    isLoading,
    hasMembership: Boolean(membership || effective),
  }
}

/**
 * Checks permissions with company membership in mind (same resolution as
 * hasPermission / resolveEffectivePermissions).
 */
export function useCompanyPermission(permission: Permission): boolean {
  const { companyRole, systemRole } = useEffectiveCompanyRole()
  return hasPermission(systemRole, permission, companyRole)
}

export function useCompanyPermissions(): {
  has: (p: Permission) => boolean
  hasAny: (permissions: Permission[]) => boolean
  hasAll: (permissions: Permission[]) => boolean
  companyRole: CompanyMemberRole | null
  systemRole: SystemRole | null
  isLoading: boolean
  hasMembership: boolean
  effectivePermissions: Permission[]
} {
  const { companyRole, systemRole, isLoading, hasMembership } = useEffectiveCompanyRole()

  return {
    companyRole,
    systemRole,
    isLoading,
    hasMembership,
    effectivePermissions: resolveEffectivePermissions(systemRole, companyRole),
    has: (p) => hasPermission(systemRole, p, companyRole),
    hasAny: (permissions) => hasAnyPermission(systemRole, permissions, companyRole),
    hasAll: (permissions) => hasAllPermissions(systemRole, permissions, companyRole),
  }
}
