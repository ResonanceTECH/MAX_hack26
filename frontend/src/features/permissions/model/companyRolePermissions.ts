import {
  COMPANY_MEMBER_ROLES,
  type CompanyMemberRole,
} from '@/entities/company-member'
import { Permission } from './permissions'

const MARKETPLACE_PERMISSIONS: Permission[] = [
  Permission.VIEW_OPPORTUNITIES,
  Permission.CREATE_OPPORTUNITY,
  Permission.CREATE_PROPOSAL,
  Permission.MANAGE_SHORTLIST,
  Permission.START_NEGOTIATION,
  Permission.VIEW_DEALS,
  Permission.VIEW_COMPANY_PROFILE,
  Permission.MANAGE_FAVORITES,
  Permission.VIEW_NOTIFICATIONS,
  Permission.VIEW_COMPANY,
]

const COMPANY_ADMIN_MANAGE: Permission[] = [
  Permission.EDIT_COMPANY,
  Permission.MANAGE_COMPANY_MEMBERS,
  Permission.INVITE_COMPANY_MEMBER,
  Permission.CHANGE_MEMBER_ROLE,
  Permission.REMOVE_COMPANY_MEMBER,
  Permission.MANAGE_COMPANY_SERVICES,
  Permission.MANAGE_COMPANY_CASES,
  Permission.MANAGE_COMPANY_DOCUMENTS,
  Permission.MANAGE_COMPANY_PERMISSIONS,
  Permission.VIEW_COMPANY_PERMISSIONS,
  Permission.MANAGE_COMPANY_SETTINGS,
  Permission.VIEW_COMPANY_VERIFICATION,
  Permission.VIEW_COMPANY_ACTIVITY,
  Permission.VIEW_COMPANY_SERVICES,
  Permission.VIEW_COMPANY_CASES,
  Permission.VIEW_COMPANY_DOCUMENTS,
]

/**
 * Single source of truth for company-scoped RBAC (CompanyMember.role).
 * PermissionMatrix and guards derive from this map.
 */
export const companyRolePermissions: Record<CompanyMemberRole, Permission[]> = {
  [COMPANY_MEMBER_ROLES.COMPANY_ADMIN]: [...MARKETPLACE_PERMISSIONS, ...COMPANY_ADMIN_MANAGE],
  [COMPANY_MEMBER_ROLES.MANAGER]: [
    Permission.VIEW_OPPORTUNITIES,
    Permission.CREATE_OPPORTUNITY,
    Permission.CREATE_PROPOSAL,
    Permission.MANAGE_SHORTLIST,
    Permission.START_NEGOTIATION,
    Permission.VIEW_DEALS,
    Permission.MANAGE_FAVORITES,
    Permission.VIEW_NOTIFICATIONS,
    Permission.VIEW_COMPANY_PROFILE,
    Permission.VIEW_COMPANY,
    Permission.MANAGE_COMPANY_SERVICES,
    Permission.MANAGE_COMPANY_CASES,
    Permission.VIEW_COMPANY_SERVICES,
    Permission.VIEW_COMPANY_CASES,
    Permission.VIEW_COMPANY_DOCUMENTS,
    Permission.VIEW_COMPANY_VERIFICATION,
    Permission.VIEW_COMPANY_ACTIVITY,
    Permission.VIEW_COMPANY_PERMISSIONS,
  ],
  [COMPANY_MEMBER_ROLES.VIEWER]: [
    Permission.VIEW_OPPORTUNITIES,
    Permission.VIEW_DEALS,
    Permission.VIEW_COMPANY_PROFILE,
    Permission.VIEW_COMPANY,
    Permission.VIEW_COMPANY_SERVICES,
    Permission.VIEW_COMPANY_CASES,
    Permission.VIEW_COMPANY_DOCUMENTS,
    Permission.VIEW_COMPANY_VERIFICATION,
    Permission.VIEW_COMPANY_ACTIVITY,
    Permission.VIEW_COMPANY_PERMISSIONS,
    Permission.VIEW_NOTIFICATIONS,
    Permission.MANAGE_FAVORITES,
  ],
}

/** Canonical export name used across FE. */
export const COMPANY_ROLE_PERMISSIONS = companyRolePermissions

/** Display rows for PermissionMatrix (cells derived from COMPANY_ROLE_PERMISSIONS). */
export const COMPANY_PERMISSION_MATRIX_ROWS: { permission: Permission; label: string }[] = [
  { permission: Permission.VIEW_COMPANY_PROFILE, label: 'Просмотр профиля компании' },
  { permission: Permission.EDIT_COMPANY, label: 'Редактирование профиля' },
  { permission: Permission.MANAGE_COMPANY_MEMBERS, label: 'Управление командой' },
  { permission: Permission.MANAGE_COMPANY_SERVICES, label: 'Управление услугами' },
  { permission: Permission.MANAGE_COMPANY_CASES, label: 'Управление кейсами' },
  { permission: Permission.MANAGE_COMPANY_DOCUMENTS, label: 'Управление документами' },
  { permission: Permission.VIEW_COMPANY_DOCUMENTS, label: 'Просмотр документов' },
  { permission: Permission.MANAGE_COMPANY_PERMISSIONS, label: 'Настройка прав доступа' },
  { permission: Permission.CREATE_OPPORTUNITY, label: 'Публикация запросов' },
  { permission: Permission.CREATE_PROPOSAL, label: 'Отклики' },
  { permission: Permission.MANAGE_SHORTLIST, label: 'Shortlist' },
  { permission: Permission.START_NEGOTIATION, label: 'Старт переговоров' },
]

export function companyRoleHasPermission(
  role: CompanyMemberRole | null | undefined,
  permission: Permission,
): boolean {
  if (!role) return false
  return companyRolePermissions[role].includes(permission)
}

export function companyRoleHasAnyPermission(
  role: CompanyMemberRole | null | undefined,
  permissions: Permission[],
): boolean {
  return permissions.some((p) => companyRoleHasPermission(role, p))
}

export function companyRoleHasAllPermissions(
  role: CompanyMemberRole | null | undefined,
  permissions: Permission[],
): boolean {
  return permissions.every((p) => companyRoleHasPermission(role, p))
}
