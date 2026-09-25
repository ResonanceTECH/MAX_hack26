import { SYSTEM_ROLES, USER_STATUS, type SystemRole, type UserStatus } from '@/entities/user'

export interface AdminUser {
  id: string
  maxUserId: string
  firstName: string
  lastName: string
  email: string
  avatarUrl: string | null
  /** Primary system role field */
  systemRole: SystemRole
  /** @deprecated alias of systemRole — kept for page compat */
  role: SystemRole
  status: UserStatus
  companyId: string | null
  companyName: string | null
  createdAt: string
  lastActiveAt: string | null
  /** @deprecated alias of lastActiveAt */
  lastLoginAt: string | null
}

function adminUser(input: {
  id: string
  maxUserId: string
  firstName: string
  lastName: string
  email: string
  systemRole: SystemRole
  status: UserStatus
  companyId?: string | null
  companyName?: string | null
  avatarUrl?: string | null
  createdAt: string
  lastActiveAt?: string | null
}): AdminUser {
  return {
    id: input.id,
    maxUserId: input.maxUserId,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    avatarUrl: input.avatarUrl ?? null,
    systemRole: input.systemRole,
    role: input.systemRole,
    status: input.status,
    companyId: input.companyId ?? null,
    companyName: input.companyName ?? null,
    createdAt: input.createdAt,
    lastActiveAt: input.lastActiveAt ?? null,
    lastLoginAt: input.lastActiveAt ?? null,
  }
}

/** Mutable platform users for admin screens — min 20 */
export const mockAdminUsers: AdminUser[] = [
  adminUser({
    id: 'user-platform-admin',
    maxUserId: 'max-30001',
    firstName: 'Александр',
    lastName: 'Иванов',
    email: 'a.ivanov@b2b-match.example',
    systemRole: SYSTEM_ROLES.PLATFORM_ADMIN,
    status: USER_STATUS.ACTIVE,
    createdAt: '2023-06-01T09:00:00.000Z',
    lastActiveAt: '2026-09-24T08:15:00.000Z',
  }),
  adminUser({
    id: 'user-admin',
    maxUserId: 'max-30002',
    firstName: 'Ирина',
    lastName: 'Соколова',
    email: 'admin@b2b-match.example',
    systemRole: SYSTEM_ROLES.PLATFORM_ADMIN,
    status: USER_STATUS.ACTIVE,
    createdAt: '2025-07-15T07:00:00.000Z',
    lastActiveAt: '2026-09-24T07:45:00.000Z',
  }),
  adminUser({
    id: 'user-moderator',
    maxUserId: 'max-20001',
    firstName: 'Елена',
    lastName: 'Морозова',
    email: 'moderator@b2b-match.example',
    systemRole: SYSTEM_ROLES.MODERATOR,
    status: USER_STATUS.ACTIVE,
    createdAt: '2025-08-01T07:00:00.000Z',
    lastActiveAt: '2026-09-24T08:00:00.000Z',
  }),
  adminUser({
    id: 'user-moderator-2',
    maxUserId: 'max-20002',
    firstName: 'Павел',
    lastName: 'Соколов',
    email: 'p.sokolov@b2b-match.example',
    systemRole: SYSTEM_ROLES.MODERATOR,
    status: USER_STATUS.ACTIVE,
    createdAt: '2025-09-12T10:00:00.000Z',
    lastActiveAt: '2026-09-23T16:20:00.000Z',
  }),
  adminUser({
    id: 'user-anna',
    maxUserId: 'max-10001',
    firstName: 'Анна',
    lastName: 'Смирнова',
    email: 'anna.smirnova@digital-lab.example',
    systemRole: SYSTEM_ROLES.COMPANY_ADMIN,
    status: USER_STATUS.ACTIVE,
    companyId: 'company-digital-lab',
    companyName: 'ООО «Digital Lab»',
    createdAt: '2025-11-02T08:00:00.000Z',
    lastActiveAt: '2026-09-24T07:30:00.000Z',
  }),
  adminUser({
    id: 'user-pavel',
    maxUserId: 'max-10010',
    firstName: 'Павел',
    lastName: 'Нестеров',
    email: 'p.nesterov@techflow.example',
    systemRole: SYSTEM_ROLES.COMPANY_ADMIN,
    status: USER_STATUS.ACTIVE,
    companyId: 'company-techflow',
    companyName: 'ООО «TechFlow»',
    createdAt: '2025-12-14T10:20:00.000Z',
    lastActiveAt: '2026-09-23T19:10:00.000Z',
  }),
  adminUser({
    id: 'user-elena',
    maxUserId: 'max-10011',
    firstName: 'Елена',
    lastName: 'Кузнецова',
    email: 'e.kuznetsova@cloudnest.example',
    systemRole: SYSTEM_ROLES.COMPANY_ADMIN,
    status: USER_STATUS.ACTIVE,
    companyId: 'company-cloudnest',
    companyName: 'ООО «CloudNest»',
    createdAt: '2026-02-05T11:30:00.000Z',
    lastActiveAt: '2026-09-24T06:50:00.000Z',
  }),
  adminUser({
    id: 'user-viktoria',
    maxUserId: 'max-10012',
    firstName: 'Виктория',
    lastName: 'Лебедева',
    email: 'v.lebedeva@packpro.example',
    systemRole: SYSTEM_ROLES.COMPANY_ADMIN,
    status: USER_STATUS.ACTIVE,
    companyId: 'company-packpro',
    companyName: 'ООО «PackPro»',
    createdAt: '2025-10-11T09:15:00.000Z',
    lastActiveAt: '2026-09-23T12:05:00.000Z',
  }),
  adminUser({
    id: 'user-maria',
    maxUserId: 'max-10013',
    firstName: 'Мария',
    lastName: 'Орлова',
    email: 'm.orlova@retailsoft.example',
    systemRole: SYSTEM_ROLES.BUSINESS_USER,
    status: USER_STATUS.ACTIVE,
    companyId: 'company-retailsoft',
    companyName: 'ООО «RetailSoft»',
    createdAt: '2026-01-20T12:00:00.000Z',
    lastActiveAt: '2026-09-22T15:45:00.000Z',
  }),
  adminUser({
    id: 'user-nikita',
    maxUserId: 'max-10014',
    firstName: 'Никита',
    lastName: 'Сафонов',
    email: 'n.safonov@datacraft.example',
    systemRole: SYSTEM_ROLES.BUSINESS_USER,
    status: USER_STATUS.ACTIVE,
    companyId: 'company-datacraft',
    companyName: 'ООО «DataCraft»',
    createdAt: '2026-04-09T08:40:00.000Z',
    lastActiveAt: '2026-09-21T18:20:00.000Z',
  }),
  adminUser({
    id: 'user-olga',
    maxUserId: 'max-10015',
    firstName: 'Ольга',
    lastName: 'Белова',
    email: 'o.belova@logistics-one.example',
    systemRole: SYSTEM_ROLES.BUSINESS_USER,
    status: USER_STATUS.ACTIVE,
    companyId: 'company-logistics-one',
    companyName: 'ООО «Logistics One»',
    createdAt: '2026-06-03T10:00:00.000Z',
    lastActiveAt: '2026-09-22T09:40:00.000Z',
  }),
  adminUser({
    id: 'user-igor',
    maxUserId: 'max-10016',
    firstName: 'Игорь',
    lastName: 'Васильев',
    email: 'i.vasiliev@medsupply.example',
    systemRole: SYSTEM_ROLES.BUSINESS_USER,
    status: USER_STATUS.INVITED,
    companyId: 'company-medsupply',
    companyName: 'ООО «МедСнаб Плюс»',
    createdAt: '2026-09-20T09:00:00.000Z',
    lastActiveAt: null,
  }),
  adminUser({
    id: 'user-daria-invite',
    maxUserId: 'max-10017',
    firstName: 'Дарья',
    lastName: 'Фомина',
    email: 'd.fomina@steelworks.example',
    systemRole: SYSTEM_ROLES.BUSINESS_USER,
    status: USER_STATUS.INVITED,
    companyId: 'company-steelworks',
    companyName: 'ООО «СтальПроф»',
    createdAt: '2026-09-18T14:00:00.000Z',
    lastActiveAt: null,
  }),
  adminUser({
    id: 'user-sergey',
    maxUserId: 'max-10018',
    firstName: 'Сергей',
    lastName: 'Морозов',
    email: 's.morozov@steelworks.example',
    systemRole: SYSTEM_ROLES.BUSINESS_USER,
    status: USER_STATUS.BLOCKED,
    companyId: 'company-steelworks',
    companyName: 'ООО «СтальПроф»',
    createdAt: '2026-03-18T14:00:00.000Z',
    lastActiveAt: '2026-08-01T10:00:00.000Z',
  }),
  adminUser({
    id: 'user-alexey',
    maxUserId: 'max-10019',
    firstName: 'Алексей',
    lastName: 'Григорьев',
    email: 'a.grigoriev@brandpulse.example',
    systemRole: SYSTEM_ROLES.BUSINESS_USER,
    status: USER_STATUS.BLOCKED,
    companyId: 'company-brandpulse',
    companyName: 'ООО «BrandPulse»',
    createdAt: '2026-05-22T16:30:00.000Z',
    lastActiveAt: '2026-09-10T11:00:00.000Z',
  }),
  adminUser({
    id: 'user-timur',
    maxUserId: 'max-10020',
    firstName: 'Тимур',
    lastName: 'Алиев',
    email: 't.aliev@fastequip.example',
    systemRole: SYSTEM_ROLES.COMPANY_ADMIN,
    status: USER_STATUS.SUSPENDED,
    companyId: 'company-fastequip',
    companyName: 'ООО «FastEquip»',
    createdAt: '2026-01-08T09:00:00.000Z',
    lastActiveAt: '2026-09-01T12:00:00.000Z',
  }),
  adminUser({
    id: 'user-svetlana',
    maxUserId: 'max-10021',
    firstName: 'Светлана',
    lastName: 'Ершова',
    email: 's.ershova@greenpack.example',
    systemRole: SYSTEM_ROLES.BUSINESS_USER,
    status: USER_STATUS.SUSPENDED,
    companyId: 'company-greenpack',
    companyName: 'ООО «GreenPack»',
    createdAt: '2026-02-14T11:00:00.000Z',
    lastActiveAt: '2026-08-20T08:30:00.000Z',
  }),
  adminUser({
    id: 'user-roman',
    maxUserId: 'max-10022',
    firstName: 'Роман',
    lastName: 'Крылов',
    email: 'r.krylov@digital-lab.example',
    systemRole: SYSTEM_ROLES.BUSINESS_USER,
    status: USER_STATUS.ACTIVE,
    companyId: 'company-digital-lab',
    companyName: 'ООО «Digital Lab»',
    createdAt: '2026-03-01T10:00:00.000Z',
    lastActiveAt: '2026-09-23T14:00:00.000Z',
  }),
  adminUser({
    id: 'user-ksenia',
    maxUserId: 'max-10023',
    firstName: 'Ксения',
    lastName: 'Власова',
    email: 'k.vlasova@techflow.example',
    systemRole: SYSTEM_ROLES.BUSINESS_USER,
    status: USER_STATUS.ACTIVE,
    companyId: 'company-techflow',
    companyName: 'ООО «TechFlow»',
    createdAt: '2026-04-15T13:00:00.000Z',
    lastActiveAt: '2026-09-22T11:20:00.000Z',
  }),
  adminUser({
    id: 'user-andrey',
    maxUserId: 'max-10024',
    firstName: 'Андрей',
    lastName: 'Михайлов',
    email: 'a.mikhailov@datacraft.example',
    systemRole: SYSTEM_ROLES.COMPANY_ADMIN,
    status: USER_STATUS.ACTIVE,
    companyId: 'company-datacraft',
    companyName: 'ООО «DataCraft»',
    createdAt: '2025-11-20T08:00:00.000Z',
    lastActiveAt: '2026-09-24T05:10:00.000Z',
  }),
  adminUser({
    id: 'user-natalia',
    maxUserId: 'max-10025',
    firstName: 'Наталья',
    lastName: 'Громова',
    email: 'n.gromova@logistics-one.example',
    systemRole: SYSTEM_ROLES.BUSINESS_USER,
    status: USER_STATUS.INVITED,
    companyId: 'company-logistics-one',
    companyName: 'ООО «Logistics One»',
    createdAt: '2026-09-21T16:00:00.000Z',
    lastActiveAt: null,
  }),
  adminUser({
    id: 'user-blocked',
    maxUserId: 'max-10007',
    firstName: 'Павел',
    lastName: 'Заблокирован',
    email: 'blocked@digital-lab.example',
    systemRole: SYSTEM_ROLES.BUSINESS_USER,
    status: USER_STATUS.BLOCKED,
    companyId: 'company-digital-lab',
    companyName: 'ООО «Digital Lab»',
    createdAt: '2024-09-01T10:00:00.000Z',
    lastActiveAt: '2026-07-01T10:00:00.000Z',
  }),
]

export function getAdminUserById(id: string): AdminUser | undefined {
  return mockAdminUsers.find((u) => u.id === id)
}

/** Sync role aliases after mutation */
export function syncAdminUserAliases(user: AdminUser): void {
  user.role = user.systemRole
  user.lastLoginAt = user.lastActiveAt
}

export function isLastPlatformAdmin(users: AdminUser[], targetId?: string): boolean {
  const activeAdmins = users.filter(
    (u) =>
      (u.systemRole === SYSTEM_ROLES.PLATFORM_ADMIN || u.role === SYSTEM_ROLES.PLATFORM_ADMIN) &&
      u.status === USER_STATUS.ACTIVE,
  )
  if (targetId === undefined) return activeAdmins.length <= 1
  return activeAdmins.length <= 1 && activeAdmins.some((u) => u.id === targetId)
}
