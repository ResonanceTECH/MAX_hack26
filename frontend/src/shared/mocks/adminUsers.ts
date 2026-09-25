import { SYSTEM_ROLES, USER_STATUS, type SystemRole, type UserStatus } from '@/entities/user'

export interface AdminUser {
  id: string
  firstName: string
  lastName: string
  email: string
  companyName: string | null
  role: SystemRole
  status: UserStatus
  createdAt: string
  lastLoginAt: string | null
}

/** Mutable platform users for admin screens */
export const mockAdminUsers: AdminUser[] = [
  {
    id: 'user-anna',
    firstName: 'Анна',
    lastName: 'Смирнова',
    email: 'anna.smirnova@digital-lab.example',
    companyName: 'ООО «Digital Lab»',
    role: SYSTEM_ROLES.COMPANY_ADMIN,
    status: USER_STATUS.ACTIVE,
    createdAt: '2025-11-02T08:00:00.000Z',
    lastLoginAt: '2026-09-24T07:30:00.000Z',
  },
  {
    id: 'user-pavel',
    firstName: 'Павел',
    lastName: 'Нестеров',
    email: 'p.nesterov@techflow.example',
    companyName: 'ООО «TechFlow»',
    role: SYSTEM_ROLES.COMPANY_ADMIN,
    status: USER_STATUS.ACTIVE,
    createdAt: '2025-12-14T10:20:00.000Z',
    lastLoginAt: '2026-09-23T19:10:00.000Z',
  },
  {
    id: 'user-maria',
    firstName: 'Мария',
    lastName: 'Орлова',
    email: 'm.orlova@retailsoft.example',
    companyName: 'ООО «RetailSoft»',
    role: SYSTEM_ROLES.BUSINESS_USER,
    status: USER_STATUS.ACTIVE,
    createdAt: '2026-01-20T12:00:00.000Z',
    lastLoginAt: '2026-09-22T15:45:00.000Z',
  },
  {
    id: 'user-igor',
    firstName: 'Игорь',
    lastName: 'Васильев',
    email: 'i.vasiliev@medsupply.example',
    companyName: 'ООО «МедСнаб Плюс»',
    role: SYSTEM_ROLES.BUSINESS_USER,
    status: USER_STATUS.INVITED,
    createdAt: '2026-09-20T09:00:00.000Z',
    lastLoginAt: null,
  },
  {
    id: 'user-elena',
    firstName: 'Елена',
    lastName: 'Кузнецова',
    email: 'e.kuznetsova@cloudnest.example',
    companyName: 'ООО «CloudNest»',
    role: SYSTEM_ROLES.COMPANY_ADMIN,
    status: USER_STATUS.ACTIVE,
    createdAt: '2026-02-05T11:30:00.000Z',
    lastLoginAt: '2026-09-24T06:50:00.000Z',
  },
  {
    id: 'user-sergey',
    firstName: 'Сергей',
    lastName: 'Морозов',
    email: 's.morozov@steelworks.example',
    companyName: 'ООО «СтальПроф»',
    role: SYSTEM_ROLES.BUSINESS_USER,
    status: USER_STATUS.BLOCKED,
    createdAt: '2026-03-18T14:00:00.000Z',
    lastLoginAt: '2026-08-01T10:00:00.000Z',
  },
  {
    id: 'user-nikita',
    firstName: 'Никита',
    lastName: 'Сафонов',
    email: 'n.safonov@datacraft.example',
    companyName: 'ООО «DataCraft»',
    role: SYSTEM_ROLES.BUSINESS_USER,
    status: USER_STATUS.ACTIVE,
    createdAt: '2026-04-09T08:40:00.000Z',
    lastLoginAt: '2026-09-21T18:20:00.000Z',
  },
  {
    id: 'user-viktoria',
    firstName: 'Виктория',
    lastName: 'Лебедева',
    email: 'v.lebedeva@packpro.example',
    companyName: 'ООО «PackPro»',
    role: SYSTEM_ROLES.COMPANY_ADMIN,
    status: USER_STATUS.ACTIVE,
    createdAt: '2025-10-11T09:15:00.000Z',
    lastLoginAt: '2026-09-23T12:05:00.000Z',
  },
  {
    id: 'user-moderator',
    firstName: 'Наталья',
    lastName: 'Модератор',
    email: 'moderator@b2b-match.example',
    companyName: null,
    role: SYSTEM_ROLES.MODERATOR,
    status: USER_STATUS.ACTIVE,
    createdAt: '2025-08-01T07:00:00.000Z',
    lastLoginAt: '2026-09-24T08:00:00.000Z',
  },
  {
    id: 'user-admin',
    firstName: 'Ирина',
    lastName: 'Админ',
    email: 'admin@b2b-match.example',
    companyName: null,
    role: SYSTEM_ROLES.PLATFORM_ADMIN,
    status: USER_STATUS.ACTIVE,
    createdAt: '2025-07-15T07:00:00.000Z',
    lastLoginAt: '2026-09-24T08:15:00.000Z',
  },
  {
    id: 'user-alexey',
    firstName: 'Алексей',
    lastName: 'Григорьев',
    email: 'a.grigoriev@brandpulse.example',
    companyName: 'ООО «BrandPulse»',
    role: SYSTEM_ROLES.BUSINESS_USER,
    status: USER_STATUS.BLOCKED,
    createdAt: '2026-05-22T16:30:00.000Z',
    lastLoginAt: '2026-09-10T11:00:00.000Z',
  },
  {
    id: 'user-olga',
    firstName: 'Ольга',
    lastName: 'Белова',
    email: 'o.belova@logistics-one.example',
    companyName: 'ООО «Logistics One»',
    role: SYSTEM_ROLES.BUSINESS_USER,
    status: USER_STATUS.ACTIVE,
    createdAt: '2026-06-03T10:00:00.000Z',
    lastLoginAt: '2026-09-22T09:40:00.000Z',
  },
]

export function getAdminUserById(id: string): AdminUser | undefined {
  return mockAdminUsers.find((u) => u.id === id)
}
