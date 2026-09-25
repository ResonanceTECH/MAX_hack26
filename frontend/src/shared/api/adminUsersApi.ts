import { USER_STATUS, type SystemRole, type UserStatus } from '@/entities/user'
import { delay } from '@/shared/lib/delay'
import {
  getAdminUserById,
  mockAdminUsers,
  type AdminUser,
} from '@/shared/mocks/adminUsers'

export interface AdminUserFilters {
  query?: string
  role?: SystemRole | 'all'
  status?: UserStatus | 'all'
}

function applyFilters(users: AdminUser[], filters?: AdminUserFilters): AdminUser[] {
  if (!filters) return users
  return users.filter((u) => {
    if (filters.role && filters.role !== 'all' && u.role !== filters.role) return false
    if (filters.status && filters.status !== 'all' && u.status !== filters.status) return false
    if (filters.query) {
      const q = filters.query.toLowerCase()
      const hay = `${u.firstName} ${u.lastName} ${u.email} ${u.companyName ?? ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}

export const adminUsersApi = {
  async list(filters?: AdminUserFilters): Promise<AdminUser[]> {
    await delay()
    return applyFilters([...mockAdminUsers], filters).sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
    )
  },

  async getById(id: string): Promise<AdminUser> {
    await delay()
    const user = getAdminUserById(id)
    if (!user) throw new Error('Пользователь не найден')
    return { ...user }
  },

  async block(id: string, currentUserId: string): Promise<AdminUser> {
    await delay()
    if (id === currentUserId) throw new Error('Нельзя заблокировать самого себя')
    const user = getAdminUserById(id)
    if (!user) throw new Error('Пользователь не найден')
    user.status = USER_STATUS.BLOCKED
    return { ...user }
  },

  async unblock(id: string): Promise<AdminUser> {
    await delay()
    const user = getAdminUserById(id)
    if (!user) throw new Error('Пользователь не найден')
    user.status = USER_STATUS.ACTIVE
    return { ...user }
  },
}
