import { SYSTEM_ROLES, USER_STATUS, type SystemRole, type UserStatus } from '@/entities/user'
import { delay } from '@/shared/lib/delay'
import { saveMockState } from '@/shared/lib/mockPersist'
import {
  getAdminUserById,
  isLastPlatformAdmin,
  mockAdminUsers,
  syncAdminUserAliases,
  type AdminUser,
} from '@/shared/mocks/adminUsers'
import { AUDIT_ACTIONS, appendAudit } from '@/shared/mocks/audit'
import { isReal } from '@/shared/api/apiCapabilities'
import { adminUsersReal, createApiProxy } from '@/shared/api/real/moderationAdmin'

export interface AdminUserFilters {
  query?: string
  role?: SystemRole | 'all'
  status?: UserStatus | 'all'
  companyId?: string
  sort?: 'name' | 'created' | 'activity' | 'role' | 'status'
}

export interface AdminActor {
  id: string
  name: string
  role: SystemRole
}

function persistAdminUsers() {
  saveMockState('adminUsers', mockAdminUsers)
}

function applyFilters(users: AdminUser[], filters?: AdminUserFilters): AdminUser[] {
  if (!filters) return users
  return users.filter((u) => {
    if (filters.role && filters.role !== 'all' && u.systemRole !== filters.role && u.role !== filters.role) {
      return false
    }
    if (filters.status && filters.status !== 'all' && u.status !== filters.status) return false
    if (filters.companyId && u.companyId !== filters.companyId) return false
    if (filters.query) {
      const q = filters.query.toLowerCase()
      const hay =
        `${u.id} ${u.maxUserId} ${u.firstName} ${u.lastName} ${u.email} ${u.companyName ?? ''} ${u.companyId ?? ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}

function sortUsers(users: AdminUser[], sort?: AdminUserFilters['sort']): AdminUser[] {
  const list = [...users]
  switch (sort) {
    case 'name':
      return list.sort((a, b) =>
        `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, 'ru'),
      )
    case 'activity':
      return list.sort(
        (a, b) => +new Date(b.lastActiveAt ?? 0) - +new Date(a.lastActiveAt ?? 0),
      )
    case 'role':
      return list.sort((a, b) => a.systemRole.localeCompare(b.systemRole))
    case 'status':
      return list.sort((a, b) => a.status.localeCompare(b.status))
    case 'created':
    default:
      return list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  }
}

function displayName(u: AdminUser) {
  return `${u.firstName} ${u.lastName}`
}

const mockAdminUsersApi = {
  async getAll(filters?: AdminUserFilters): Promise<AdminUser[]> {
    return this.list(filters)
  },

  async list(filters?: AdminUserFilters): Promise<AdminUser[]> {
    await delay(200 + Math.floor(Math.random() * 400))
    return sortUsers(applyFilters([...mockAdminUsers], filters), filters?.sort)
  },

  async getById(id: string): Promise<AdminUser> {
    await delay(200 + Math.floor(Math.random() * 300))
    const user = getAdminUserById(id)
    if (!user) throw new Error('Пользователь не найден')
    return { ...user }
  },

  async block(
    id: string,
    input: { reason: string; actor: AdminActor; currentUserId?: string },
  ): Promise<AdminUser> {
    await delay(400 + Math.floor(Math.random() * 500))
    const currentUserId = input.currentUserId ?? input.actor.id
    if (id === currentUserId) {
      throw new Error('Нельзя заблокировать собственную учётную запись.')
    }
    const user = getAdminUserById(id)
    if (!user) throw new Error('Пользователь не найден')
    if (user.status === USER_STATUS.BLOCKED) throw new Error('Пользователь уже заблокирован')
    if (
      user.systemRole === SYSTEM_ROLES.PLATFORM_ADMIN &&
      isLastPlatformAdmin(mockAdminUsers, id)
    ) {
      throw new Error('На платформе должен оставаться минимум один активный Platform Admin.')
    }
    const previous = user.status
    user.status = USER_STATUS.BLOCKED
    syncAdminUserAliases(user)
    persistAdminUsers()
    appendAudit({
      actorId: input.actor.id,
      actorName: input.actor.name,
      actorRole: input.actor.role,
      role: input.actor.role,
      action: AUDIT_ACTIONS.USER_BLOCKED,
      entityType: 'user',
      entityId: user.id,
      entityName: displayName(user),
      entityLabel: displayName(user),
      previousValue: previous,
      newValue: USER_STATUS.BLOCKED,
      before: { status: previous },
      after: { status: USER_STATUS.BLOCKED },
      reason: input.reason,
      source: 'platform_admin',
    })
    return { ...user }
  },

  async unblock(
    id: string,
    input: { reason?: string; actor: AdminActor },
  ): Promise<AdminUser> {
    await delay(400 + Math.floor(Math.random() * 400))
    const user = getAdminUserById(id)
    if (!user) throw new Error('Пользователь не найден')
    const previous = user.status
    user.status = USER_STATUS.ACTIVE
    syncAdminUserAliases(user)
    persistAdminUsers()
    appendAudit({
      actorId: input.actor.id,
      actorName: input.actor.name,
      actorRole: input.actor.role,
      role: input.actor.role,
      action: AUDIT_ACTIONS.USER_UNBLOCKED,
      entityType: 'user',
      entityId: user.id,
      entityName: displayName(user),
      entityLabel: displayName(user),
      previousValue: previous,
      newValue: USER_STATUS.ACTIVE,
      before: { status: previous },
      after: { status: USER_STATUS.ACTIVE },
      reason: input.reason,
      source: 'platform_admin',
    })
    return { ...user }
  },

  async suspend(
    id: string,
    input: { reason: string; actor: AdminActor; currentUserId?: string },
  ): Promise<AdminUser> {
    await delay(400 + Math.floor(Math.random() * 400))
    const currentUserId = input.currentUserId ?? input.actor.id
    if (id === currentUserId) {
      throw new Error('Нельзя приостановить собственную учётную запись.')
    }
    const user = getAdminUserById(id)
    if (!user) throw new Error('Пользователь не найден')
    if (
      user.systemRole === SYSTEM_ROLES.PLATFORM_ADMIN &&
      isLastPlatformAdmin(mockAdminUsers, id)
    ) {
      throw new Error('На платформе должен оставаться минимум один активный Platform Admin.')
    }
    const previous = user.status
    user.status = USER_STATUS.SUSPENDED
    syncAdminUserAliases(user)
    persistAdminUsers()
    appendAudit({
      actorId: input.actor.id,
      actorName: input.actor.name,
      actorRole: input.actor.role,
      role: input.actor.role,
      action: AUDIT_ACTIONS.USER_SUSPENDED,
      entityType: 'user',
      entityId: user.id,
      entityName: displayName(user),
      entityLabel: displayName(user),
      previousValue: previous,
      newValue: USER_STATUS.SUSPENDED,
      before: { status: previous },
      after: { status: USER_STATUS.SUSPENDED },
      reason: input.reason,
      source: 'platform_admin',
    })
    return { ...user }
  },

  async activate(
    id: string,
    input: { reason?: string; actor: AdminActor },
  ): Promise<AdminUser> {
    await delay(300 + Math.floor(Math.random() * 300))
    const user = getAdminUserById(id)
    if (!user) throw new Error('Пользователь не найден')
    const previous = user.status
    user.status = USER_STATUS.ACTIVE
    syncAdminUserAliases(user)
    persistAdminUsers()
    appendAudit({
      actorId: input.actor.id,
      actorName: input.actor.name,
      actorRole: input.actor.role,
      role: input.actor.role,
      action: AUDIT_ACTIONS.USER_ACTIVATED,
      entityType: 'user',
      entityId: user.id,
      entityName: displayName(user),
      entityLabel: displayName(user),
      previousValue: previous,
      newValue: USER_STATUS.ACTIVE,
      before: { status: previous },
      after: { status: USER_STATUS.ACTIVE },
      reason: input.reason,
      source: 'platform_admin',
    })
    return { ...user }
  },

  async changeRole(
    id: string,
    input: { newRole: SystemRole; reason: string; actor: AdminActor; currentUserId?: string },
  ): Promise<AdminUser> {
    await delay(500 + Math.floor(Math.random() * 400))
    const user = getAdminUserById(id)
    if (!user) throw new Error('Пользователь не найден')
    const previous = user.systemRole
    if (previous === input.newRole) throw new Error('Роль не изменилась')

    const demoting =
      previous === SYSTEM_ROLES.PLATFORM_ADMIN && input.newRole !== SYSTEM_ROLES.PLATFORM_ADMIN
    if (demoting && isLastPlatformAdmin(mockAdminUsers, id)) {
      throw new Error('На платформе должен оставаться минимум один активный Platform Admin.')
    }

    user.systemRole = input.newRole
    syncAdminUserAliases(user)
    persistAdminUsers()
    appendAudit({
      actorId: input.actor.id,
      actorName: input.actor.name,
      actorRole: input.actor.role,
      role: input.actor.role,
      action: AUDIT_ACTIONS.USER_ROLE_CHANGED,
      entityType: 'user',
      entityId: user.id,
      entityName: displayName(user),
      entityLabel: displayName(user),
      previousValue: previous,
      newValue: input.newRole,
      before: { role: previous },
      after: { role: input.newRole },
      reason: input.reason,
      source: 'platform_admin',
    })
    return { ...user }
  },
}

export const adminUsersApi = createApiProxy(adminUsersReal, mockAdminUsersApi, () => isReal('admin'))

export type { AdminUser }
