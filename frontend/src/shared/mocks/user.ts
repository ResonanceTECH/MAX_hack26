import type { CompanyMemberRole } from '@/entities/company-member'
import type { User } from '@/entities/user'
import { SYSTEM_ROLES, USER_STATUS, type SystemRole } from '@/entities/user'
import {
  getDevPersona,
  type DevPersonaId,
} from '@/features/auth/model/devPersonas'
import { COMPANY_MEMBER_ROLES } from '@/entities/company-member'

export const CURRENT_COMPANY_ID = 'company-digital-lab'
export const WEBFORGE_COMPANY_ID = 'company-webforge'
export const MEBELPRO_COMPANY_ID = 'company-mebelpro'

/** Mock users for role switcher / company team */
export const mockUsers: User[] = [
  {
    id: 'user-dmitry-webforge',
    maxUserId: '7777003',
    firstName: 'Дмитрий',
    lastName: 'Волков',
    avatarUrl: null,
    companyId: WEBFORGE_COMPANY_ID,
    role: SYSTEM_ROLES.BUSINESS_USER,
    status: USER_STATUS.ACTIVE,
    createdAt: '2024-03-12T10:00:00.000Z',
    companyMemberRole: null,
    email: 'dmitry@webforge.example',
  },
  {
    id: 'user-anna-admin',
    maxUserId: '7777002',
    firstName: 'Анна',
    lastName: 'Смирнова',
    avatarUrl: null,
    companyId: CURRENT_COMPANY_ID,
    role: SYSTEM_ROLES.COMPANY_ADMIN,
    status: USER_STATUS.ACTIVE,
    createdAt: '2024-03-12T10:00:00.000Z',
    companyMemberRole: COMPANY_MEMBER_ROLES.COMPANY_ADMIN,
    email: 'anna.smirnova@digital-lab.example',
  },
  {
    id: 'user-igor-manager',
    maxUserId: '7777010',
    firstName: 'Игорь',
    lastName: 'Петров',
    avatarUrl: null,
    companyId: CURRENT_COMPANY_ID,
    role: SYSTEM_ROLES.BUSINESS_USER,
    status: USER_STATUS.ACTIVE,
    createdAt: '2024-05-01T09:00:00.000Z',
    companyMemberRole: COMPANY_MEMBER_ROLES.MANAGER,
    email: 'igor.petrov@digital-lab.example',
  },
  {
    id: 'user-maria-viewer',
    maxUserId: '7777011',
    firstName: 'Мария',
    lastName: 'Козлова',
    avatarUrl: null,
    companyId: CURRENT_COMPANY_ID,
    role: SYSTEM_ROLES.BUSINESS_USER,
    status: USER_STATUS.ACTIVE,
    createdAt: '2024-01-20T08:00:00.000Z',
    companyMemberRole: COMPANY_MEMBER_ROLES.VIEWER,
    email: 'maria.kozlova@digital-lab.example',
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
    maxUserId: '7777009',
    firstName: 'Елена',
    lastName: 'Морозова',
    avatarUrl: null,
    companyId: null,
    role: SYSTEM_ROLES.MODERATOR,
    status: USER_STATUS.ACTIVE,
    createdAt: '2023-11-01T09:00:00.000Z',
    companyMemberRole: null,
  },
  {
    id: 'user-platform-admin',
    maxUserId: '7777001',
    firstName: 'Александр',
    lastName: 'Иванов',
    avatarUrl: null,
    companyId: MEBELPRO_COMPANY_ID,
    role: SYSTEM_ROLES.PLATFORM_ADMIN,
    status: USER_STATUS.ACTIVE,
    createdAt: '2023-06-01T09:00:00.000Z',
    companyMemberRole: null,
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
]

const mockSessionsByRole: Record<SystemRole, User> = {
  [SYSTEM_ROLES.BUSINESS_USER]: mockUsers[0]!,
  [SYSTEM_ROLES.COMPANY_ADMIN]: mockUsers[1]!,
  [SYSTEM_ROLES.MODERATOR]: mockUsers[9]!,
  [SYSTEM_ROLES.PLATFORM_ADMIN]: mockUsers[10]!,
}

const mockSessionsByPersona: Record<DevPersonaId, User> = {
  business_user: mockUsers[0]!,
  company_admin: mockUsers[1]!,
  manager: mockUsers[2]!,
  viewer: mockUsers[3]!,
  moderator: mockUsers[9]!,
  platform_admin: mockUsers[10]!,
}

export function getMockUserByRole(role: SystemRole): User {
  return { ...mockSessionsByRole[role] }
}

export function getMockUserByPersona(personaId: DevPersonaId): User {
  const persona = getDevPersona(personaId)
  const base = mockSessionsByPersona[personaId]
  return {
    ...base,
    role: persona.systemRole,
    companyMemberRole: persona.companyMemberRole,
  }
}

/** Default demo user — BUSINESS_USER so marketplace e2e stays intact */
export const mockCurrentUser: User = getMockUserByRole(SYSTEM_ROLES.BUSINESS_USER)

export function getHomePathForRole(
  role: SystemRole,
  companyMemberRole?: CompanyMemberRole | null,
): string {
  if (
    role === SYSTEM_ROLES.BUSINESS_USER &&
    (companyMemberRole === COMPANY_MEMBER_ROLES.MANAGER ||
      companyMemberRole === COMPANY_MEMBER_ROLES.VIEWER)
  ) {
    return '/'
  }
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

export function getHomePathForPersona(personaId: DevPersonaId): string {
  const persona = getDevPersona(personaId)
  return getHomePathForRole(persona.systemRole, persona.companyMemberRole)
}
