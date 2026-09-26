import {
  COMPANY_MEMBER_ROLE_LABELS,
  COMPANY_MEMBER_ROLES,
  type CompanyMemberRole,
} from '@/entities/company-member'
import { SYSTEM_ROLES, type SystemRole } from '@/entities/user'
import { DEV_PERSONA_MAX_USER_IDS } from '@/shared/api/mappers/userMapper'

export type DevPersonaId =
  | 'business_user'
  | 'company_admin'
  | 'manager'
  | 'viewer'
  | 'moderator'
  | 'platform_admin'

export interface DevPersona {
  id: DevPersonaId
  maxUserId: number
  systemRole: SystemRole
  companyMemberRole: CompanyMemberRole | null
  name: string
  companyName: string | null
  label: string
}

function roleLabel(systemRole: SystemRole, memberRole: CompanyMemberRole | null): string {
  const system =
    systemRole === SYSTEM_ROLES.BUSINESS_USER
      ? 'Business User'
      : systemRole === SYSTEM_ROLES.COMPANY_ADMIN
        ? 'Company Admin'
        : systemRole === SYSTEM_ROLES.MODERATOR
          ? 'Moderator'
          : 'Platform Admin'
  if (!memberRole) return system
  return `${system} / ${COMPANY_MEMBER_ROLE_LABELS[memberRole]}`
}

function buildLabel(
  name: string,
  companyName: string | null,
  systemRole: SystemRole,
  memberRole: CompanyMemberRole | null,
): string {
  const parts = [name]
  if (companyName) parts.push(companyName)
  parts.push(roleLabel(systemRole, memberRole))
  return parts.join(' · ')
}

const PERSONA_DEFS: Omit<DevPersona, 'label'>[] = [
  {
    id: 'business_user',
    maxUserId: DEV_PERSONA_MAX_USER_IDS.business_user,
    systemRole: SYSTEM_ROLES.BUSINESS_USER,
    companyMemberRole: null,
    name: 'Дмитрий Волков',
    companyName: 'WebForge',
  },
  {
    id: 'company_admin',
    maxUserId: DEV_PERSONA_MAX_USER_IDS.company_admin,
    systemRole: SYSTEM_ROLES.COMPANY_ADMIN,
    companyMemberRole: COMPANY_MEMBER_ROLES.COMPANY_ADMIN,
    name: 'Анна Смирнова',
    companyName: 'DigitalLab',
  },
  {
    id: 'manager',
    maxUserId: DEV_PERSONA_MAX_USER_IDS.manager,
    systemRole: SYSTEM_ROLES.BUSINESS_USER,
    companyMemberRole: COMPANY_MEMBER_ROLES.MANAGER,
    name: 'Игорь Петров',
    companyName: 'DigitalLab',
  },
  {
    id: 'viewer',
    maxUserId: DEV_PERSONA_MAX_USER_IDS.viewer,
    systemRole: SYSTEM_ROLES.BUSINESS_USER,
    companyMemberRole: COMPANY_MEMBER_ROLES.VIEWER,
    name: 'Мария Козлова',
    companyName: 'DigitalLab',
  },
  {
    id: 'moderator',
    maxUserId: DEV_PERSONA_MAX_USER_IDS.moderator,
    systemRole: SYSTEM_ROLES.MODERATOR,
    companyMemberRole: null,
    name: 'Елена Морозова',
    companyName: null,
  },
  {
    id: 'platform_admin',
    maxUserId: DEV_PERSONA_MAX_USER_IDS.platform_admin,
    systemRole: SYSTEM_ROLES.PLATFORM_ADMIN,
    companyMemberRole: null,
    name: 'Александр Иванов',
    companyName: 'МебельПро',
  },
]

export const DEV_PERSONAS: DevPersona[] = PERSONA_DEFS.map((p) => ({
  ...p,
  label: buildLabel(p.name, p.companyName, p.systemRole, p.companyMemberRole),
}))

export function getDevPersona(id: DevPersonaId): DevPersona {
  const persona = DEV_PERSONAS.find((p) => p.id === id)
  if (!persona) throw new Error(`Unknown persona: ${id}`)
  return persona
}

export function getDevPersonaByMaxUserId(maxUserId: number | string): DevPersona | null {
  const n = Number(maxUserId)
  return DEV_PERSONAS.find((p) => p.maxUserId === n) ?? null
}
