import type { SystemRole } from '@/entities/user'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import type { Permission } from '../model/permissions'
import { hasAllPermissions, hasAnyPermission, hasPermission } from '../model/hasPermission'

export function usePermission(permission: Permission): boolean {
  const role = useSessionStore((s) => s.role)
  return hasPermission(role, permission)
}

export function usePermissions(): {
  has: (p: Permission) => boolean
  hasAny: (permissions: Permission[]) => boolean
  hasAll: (permissions: Permission[]) => boolean
  role: SystemRole | null
} {
  const role = useSessionStore((s) => s.role)
  return {
    role,
    has: (p: Permission) => hasPermission(role, p),
    hasAny: (permissions: Permission[]) => hasAnyPermission(role, permissions),
    hasAll: (permissions: Permission[]) => hasAllPermissions(role, permissions),
  }
}
