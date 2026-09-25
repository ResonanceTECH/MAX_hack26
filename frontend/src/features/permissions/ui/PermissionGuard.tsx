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
  children: ReactNode
}

export function PermissionGuard({
  permission,
  requireAll = false,
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
  return <Navigate to={ROUTES.ACCESS_DENIED} replace />
}
