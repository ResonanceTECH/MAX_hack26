import type { CompanyMemberRole } from '@/entities/company-member'
import { SYSTEM_ROLES, type SystemRole } from '@/entities/user'
import type { Permission } from './permissions'
import { COMPANY_ROLE_PERMISSIONS } from './companyRolePermissions'
import { ROLE_PERMISSIONS } from './rolePermissions'

export function resolveEffectivePermissions(
  systemRole: SystemRole | null | undefined,
  companyMemberRole?: CompanyMemberRole | null,
): Permission[] {
  if (!systemRole) return []

  if (
    systemRole === SYSTEM_ROLES.MODERATOR ||
    systemRole === SYSTEM_ROLES.PLATFORM_ADMIN
  ) {
    return ROLE_PERMISSIONS[systemRole]
  }

  if (systemRole === SYSTEM_ROLES.COMPANY_ADMIN) {
    return ROLE_PERMISSIONS[SYSTEM_ROLES.COMPANY_ADMIN]
  }

  if (systemRole === SYSTEM_ROLES.BUSINESS_USER) {
    if (companyMemberRole) {
      return COMPANY_ROLE_PERMISSIONS[companyMemberRole]
    }
    return ROLE_PERMISSIONS[SYSTEM_ROLES.BUSINESS_USER]
  }

  return ROLE_PERMISSIONS[systemRole] ?? []
}

export function hasPermission(
  role: SystemRole | null | undefined,
  permission: Permission,
  companyMemberRole?: CompanyMemberRole | null,
): boolean {
  if (!role) return false
  return resolveEffectivePermissions(role, companyMemberRole).includes(permission)
}

export function hasAnyPermission(
  role: SystemRole | null | undefined,
  permissions: Permission[],
  companyMemberRole?: CompanyMemberRole | null,
): boolean {
  return permissions.some((p) => hasPermission(role, p, companyMemberRole))
}

export function hasAllPermissions(
  role: SystemRole | null | undefined,
  permissions: Permission[],
  companyMemberRole?: CompanyMemberRole | null,
): boolean {
  return permissions.every((p) => hasPermission(role, p, companyMemberRole))
}
