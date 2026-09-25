import { SYSTEM_ROLES, USER_STATUS, type SystemRole, type UserStatus } from '@/entities/user'
import type { AdminUser } from '@/shared/mocks/adminUsers'
import type { DictionaryItem } from '@/shared/mocks/dictionaries'
import type { PlatformCompanyStatus, VerificationStatus } from '@/shared/api/adminCompaniesApi'

export function isCurrentUser(targetId: string, currentUserId: string | null | undefined): boolean {
  return Boolean(currentUserId) && targetId === currentUserId
}

export function isLastPlatformAdmin(
  users: AdminUser[],
  targetId: string,
): boolean {
  const activeAdmins = users.filter(
    (u) =>
      (u.role === SYSTEM_ROLES.PLATFORM_ADMIN || u.systemRole === SYSTEM_ROLES.PLATFORM_ADMIN) &&
      u.status === USER_STATUS.ACTIVE,
  )
  return activeAdmins.length <= 1 && activeAdmins.some((u) => u.id === targetId)
}

export function canBlockUser(params: {
  target: AdminUser
  currentUserId: string | null | undefined
  allUsers: AdminUser[]
}): { allowed: boolean; reason?: string } {
  const { target, currentUserId, allUsers } = params
  if (isCurrentUser(target.id, currentUserId)) {
    return { allowed: false, reason: 'Нельзя заблокировать собственную учётную запись.' }
  }
  if (
    (target.role === SYSTEM_ROLES.PLATFORM_ADMIN ||
      target.systemRole === SYSTEM_ROLES.PLATFORM_ADMIN) &&
    isLastPlatformAdmin(allUsers, target.id)
  ) {
    return {
      allowed: false,
      reason: 'На платформе должен оставаться минимум один активный Platform Admin.',
    }
  }
  if (target.status === USER_STATUS.BLOCKED) {
    return { allowed: false, reason: 'Пользователь уже заблокирован.' }
  }
  return { allowed: true }
}

export function canChangeSystemRole(params: {
  target: AdminUser
  newRole: SystemRole
  currentUserId: string | null | undefined
  allUsers: AdminUser[]
}): { allowed: boolean; reason?: string } {
  const { target, newRole, currentUserId, allUsers } = params
  const currentRole = target.systemRole ?? target.role
  if (currentRole === newRole) {
    return { allowed: false, reason: 'Роль не изменилась.' }
  }
  const demotingAdmin =
    currentRole === SYSTEM_ROLES.PLATFORM_ADMIN && newRole !== SYSTEM_ROLES.PLATFORM_ADMIN
  if (demotingAdmin && isLastPlatformAdmin(allUsers, target.id)) {
    return {
      allowed: false,
      reason: 'На платформе должен оставаться минимум один активный Platform Admin.',
    }
  }
  if (isCurrentUser(target.id, currentUserId) && demotingAdmin) {
    const otherAdmins = allUsers.filter(
      (u) =>
        u.id !== target.id &&
        (u.role === SYSTEM_ROLES.PLATFORM_ADMIN || u.systemRole === SYSTEM_ROLES.PLATFORM_ADMIN) &&
        u.status === USER_STATUS.ACTIVE,
    )
    if (otherAdmins.length === 0) {
      return {
        allowed: false,
        reason: 'Нельзя понизить собственную роль — вы последний Platform Admin.',
      }
    }
  }
  return { allowed: true }
}

export function canBlockCompany(status: PlatformCompanyStatus): {
  allowed: boolean
  reason?: string
} {
  if (status === 'BLOCKED' || status === 'blocked') {
    return { allowed: false, reason: 'Компания уже заблокирована.' }
  }
  if (status === 'ARCHIVED' || status === 'archived') {
    return { allowed: false, reason: 'Архивированную компанию нельзя заблокировать.' }
  }
  return { allowed: true }
}

export function canChangeVerification(
  from: VerificationStatus,
  to: VerificationStatus,
): { allowed: boolean; reason?: string; requiresReason: boolean } {
  if (from === to) {
    return { allowed: false, reason: 'Статус не изменился.', requiresReason: false }
  }
  const sensitive =
    (from === 'PENDING' || from === 'pending') && (to === 'VERIFIED' || to === 'verified') ||
    (from === 'VERIFIED' || from === 'verified') &&
      (to === 'REQUIRES_UPDATE' || to === 'requires_update' || to === 'NOT_VERIFIED')
  return { allowed: true, requiresReason: true, ...(sensitive ? {} : {}) }
}

export function canArchiveDictionaryItem(item: DictionaryItem): {
  allowed: boolean
  reason?: string
  warning?: string
} {
  if (item.status === 'archived') {
    return { allowed: false, reason: 'Элемент уже в архиве.' }
  }
  const usage = item.usageCount ?? 0
  return {
    allowed: true,
    warning:
      usage > 0
        ? `Категория используется в ${usage} объектах. После архивирования новые объекты не смогут её выбирать.`
        : undefined,
  }
}

export function canEnableMaintenance(alreadyEnabled: boolean): {
  allowed: boolean
  reason?: string
} {
  if (alreadyEnabled) {
    return { allowed: false, reason: 'Режим обслуживания уже включён.' }
  }
  return { allowed: true }
}

export function canToggleFeatureFlag(): { allowed: boolean } {
  return { allowed: true }
}

export function canSuspendUser(params: {
  target: AdminUser
  currentUserId: string | null | undefined
  allUsers: AdminUser[]
}): { allowed: boolean; reason?: string } {
  const blockCheck = canBlockUser(params)
  if (!blockCheck.allowed) return blockCheck
  if (params.target.status === ('suspended' as UserStatus)) {
    return { allowed: false, reason: 'Пользователь уже приостановлен.' }
  }
  return { allowed: true }
}
