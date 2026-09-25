import type { User } from '@/entities/user'
import { SYSTEM_ROLES, USER_STATUS, type SystemRole } from '@/entities/user'

export const CURRENT_COMPANY_ID = 'company-digital-lab'

/** Mock users for role switcher / company team */
export const mockUsers: User[] = [
  {
    id: 'user-anna',
    maxUserId: 'max-10001',
    firstName: 'Анна',
    lastName: 'Смирнова',
    avatarUrl: null,
    companyId: CURRENT_COMPANY_ID,
    role: SYSTEM_ROLES.BUSINESS_USER,
    status: USER_STATUS.ACTIVE,
    createdAt: '2024-03-12T10:00:00.000Z',
  },
  {
    id: 'user-anna-admin',
    maxUserId: 'max-10001',
    firstName: 'Анна',
    lastName: 'Смирнова',
    avatarUrl: null,
    companyId: CURRENT_COMPANY_ID,
    role: SYSTEM_ROLES.COMPANY_ADMIN,
    status: USER_STATUS.ACTIVE,
    createdAt: '2024-03-12T10:00:00.000Z',
  },
  {
    id: 'user-igor',
    maxUserId: 'max-10002',
    firstName: 'Игорь',
    lastName: 'Петров',
    avatarUrl: null,
    companyId: CURRENT_COMPANY_ID,
    role: SYSTEM_ROLES.BUSINESS_USER,
    status: USER_STATUS.ACTIVE,
    createdAt: '2024-05-01T09:00:00.000Z',
  },
  {
    id: 'user-maria',
    maxUserId: 'max-10003',
    firstName: 'Мария',
    lastName: 'Козлова',
    avatarUrl: null,
    companyId: CURRENT_COMPANY_ID,
    role: SYSTEM_ROLES.COMPANY_ADMIN,
    status: USER_STATUS.ACTIVE,
    createdAt: '2024-01-20T08:00:00.000Z',
  },
  {
    id: 'user-dmitry',
    maxUserId: 'max-10004',
    firstName: 'Дмитрий',
    lastName: 'Орлов',
    avatarUrl: null,
    companyId: CURRENT_COMPANY_ID,
    role: SYSTEM_ROLES.BUSINESS_USER,
    status: USER_STATUS.ACTIVE,
    createdAt: '2024-06-15T11:00:00.000Z',
  },
  {
    id: 'user-elena',
    maxUserId: 'max-10005',
    firstName: 'Елена',
    lastName: 'Васильева',
    avatarUrl: null,
    companyId: CURRENT_COMPANY_ID,
    role: SYSTEM_ROLES.BUSINESS_USER,
    status: USER_STATUS.INVITED,
    createdAt: '2025-01-10T14:00:00.000Z',
  },
  {
    id: 'user-sergey',
    maxUserId: 'max-10006',
    firstName: 'Сергей',
    lastName: 'Новиков',
    avatarUrl: null,
    companyId: 'company-techflow',
    role: SYSTEM_ROLES.BUSINESS_USER,
    status: USER_STATUS.ACTIVE,
    createdAt: '2024-08-01T10:00:00.000Z',
  },
  {
    id: 'user-moderator',
    maxUserId: 'max-20001',
    firstName: 'Ольга',
    lastName: 'Модераторова',
    avatarUrl: null,
    companyId: null,
    role: SYSTEM_ROLES.MODERATOR,
    status: USER_STATUS.ACTIVE,
    createdAt: '2023-11-01T09:00:00.000Z',
  },
  {
    id: 'user-platform-admin',
    maxUserId: 'max-30001',
    firstName: 'Алексей',
    lastName: 'Админов',
    avatarUrl: null,
    companyId: null,
    role: SYSTEM_ROLES.PLATFORM_ADMIN,
    status: USER_STATUS.ACTIVE,
    createdAt: '2023-06-01T09:00:00.000Z',
  },
  {
    id: 'user-blocked',
    maxUserId: 'max-10007',
    firstName: 'Павел',
    lastName: 'Заблокирован',
    avatarUrl: null,
    companyId: CURRENT_COMPANY_ID,
    role: SYSTEM_ROLES.BUSINESS_USER,
    status: USER_STATUS.BLOCKED,
    createdAt: '2024-09-01T10:00:00.000Z',
  },
]

const mockSessionsByRole: Record<SystemRole, User> = {
  [SYSTEM_ROLES.BUSINESS_USER]: mockUsers[0],
  [SYSTEM_ROLES.COMPANY_ADMIN]: mockUsers[1],
  [SYSTEM_ROLES.MODERATOR]: mockUsers[7],
  [SYSTEM_ROLES.PLATFORM_ADMIN]: mockUsers[8],
}

export function getMockUserByRole(role: SystemRole): User {
  return { ...mockSessionsByRole[role] }
}

/** Default demo user — BUSINESS_USER so marketplace e2e stays intact */
export const mockCurrentUser: User = getMockUserByRole(SYSTEM_ROLES.BUSINESS_USER)

export function getHomePathForRole(role: SystemRole): string {
  switch (role) {
    case SYSTEM_ROLES.MODERATOR:
      return '/moderation'
    case SYSTEM_ROLES.PLATFORM_ADMIN:
      return '/admin'
    case SYSTEM_ROLES.COMPANY_ADMIN:
      return '/profile/company'
    case SYSTEM_ROLES.BUSINESS_USER:
    default:
      return '/'
  }
}
