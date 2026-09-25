import type { SystemRole } from '@/entities/user'
import type { Permission } from './permissions'
import { ROLE_PERMISSIONS } from './rolePermissions'

export function hasPermission(
  role: SystemRole | null | undefined,
  permission: Permission,
): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role].includes(permission)
}

export function hasAnyPermission(
  role: SystemRole | null | undefined,
  permissions: Permission[],
): boolean {
  return permissions.some((p) => hasPermission(role, p))
}

export function hasAllPermissions(
  role: SystemRole | null | undefined,
  permissions: Permission[],
): boolean {
  return permissions.every((p) => hasPermission(role, p))
}
