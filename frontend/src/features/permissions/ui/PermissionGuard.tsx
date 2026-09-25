import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { ROUTES } from '@/shared/constants/routes'
import { LoadingState } from '@/shared/ui'
import { usePermissions } from '../hooks/usePermission'
import type { Permission } from '../model/permissions'

export interface PermissionGuardProps {
  permission: Permission | Permission[]
  requireAll?: boolean
  /** Appended as ?reason=… on access-denied redirect */
  denyReason?: string
  /** Alias for denyReason */
  deniedReason?: string
  /** Optional absolute path override (defaults to /access-denied) */
  deniedTo?: string
  children: ReactNode
}

export function PermissionGuard({
  permission,
  requireAll = false,
  denyReason,
  deniedReason,
  deniedTo,
  children,
}: PermissionGuardProps) {
  const isInitialized = useSessionStore((s) => s.isInitialized)
  const { has, hasAny, hasAll } = usePermissions()

  if (!isInitialized) {
    return <LoadingState variant="page" />
  }

  const list = Array.isArray(permission) ? permission : [permission]
  const allowed = requireAll ? hasAll(list) : list.length === 1 ? has(list[0]!) : hasAny(list)

  if (allowed) return <>{children}</>

  const reason = deniedReason ?? denyReason
  const base = deniedTo ?? ROUTES.ACCESS_DENIED
  const to = reason ? `${base}?reason=${encodeURIComponent(reason)}` : base
  return <Navigate to={to} replace />
}
