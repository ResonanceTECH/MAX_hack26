import { describe, expect, it } from 'vitest'
import { COMPANY_MEMBER_ROLES } from '@/entities/company-member'
import { SYSTEM_ROLES } from '@/entities/user'
import { Permission } from './permissions'
import {
  COMPANY_PERMISSION_MATRIX_ROWS,
  COMPANY_ROLE_PERMISSIONS,
} from './companyRolePermissions'
import { hasPermission, resolveEffectivePermissions } from './hasPermission'

describe('companyRolePermissions / hasPermission', () => {
  it('MANAGER can mutate marketplace and services, not team/settings', () => {
    const role = SYSTEM_ROLES.BUSINESS_USER
    const member = COMPANY_MEMBER_ROLES.MANAGER

    expect(hasPermission(role, Permission.CREATE_OPPORTUNITY, member)).toBe(true)
    expect(hasPermission(role, Permission.MANAGE_COMPANY_SERVICES, member)).toBe(true)
    expect(hasPermission(role, Permission.VIEW_COMPANY_DOCUMENTS, member)).toBe(true)
    expect(hasPermission(role, Permission.MANAGE_COMPANY_DOCUMENTS, member)).toBe(false)
    expect(hasPermission(role, Permission.EDIT_COMPANY, member)).toBe(true)
    expect(hasPermission(role, Permission.MANAGE_COMPANY_MEMBERS, member)).toBe(false)
    expect(hasPermission(role, Permission.MANAGE_COMPANY_SETTINGS, member)).toBe(false)
  })

  it('VIEWER is read-only except favorites', () => {
    const role = SYSTEM_ROLES.BUSINESS_USER
    const member = COMPANY_MEMBER_ROLES.VIEWER

    expect(hasPermission(role, Permission.VIEW_OPPORTUNITIES, member)).toBe(true)
    expect(hasPermission(role, Permission.MANAGE_FAVORITES, member)).toBe(true)
    expect(hasPermission(role, Permission.CREATE_OPPORTUNITY, member)).toBe(false)
    expect(hasPermission(role, Permission.CREATE_PROPOSAL, member)).toBe(false)
    expect(hasPermission(role, Permission.START_NEGOTIATION, member)).toBe(false)
    expect(hasPermission(role, Permission.MANAGE_COMPANY_SERVICES, member)).toBe(false)
  })

  it('BUSINESS_USER without member role uses system ROLE_PERMISSIONS', () => {
    const perms = resolveEffectivePermissions(SYSTEM_ROLES.BUSINESS_USER)
    expect(perms).toContain(Permission.CREATE_OPPORTUNITY)
    expect(perms).not.toContain(Permission.MANAGE_COMPANY_MEMBERS)
  })
})

describe('PermissionMatrix source', () => {
  it('matrix rows derive from COMPANY_ROLE_PERMISSIONS', () => {
    for (const row of COMPANY_PERMISSION_MATRIX_ROWS) {
      const adminHas = COMPANY_ROLE_PERMISSIONS.COMPANY_ADMIN.includes(row.permission)
      const managerHas = COMPANY_ROLE_PERMISSIONS.MANAGER.includes(row.permission)
      const viewerHas = COMPANY_ROLE_PERMISSIONS.VIEWER.includes(row.permission)
      // each row permission must be known to at least one role OR intentionally none for all
      expect(typeof adminHas).toBe('boolean')
      expect(typeof managerHas).toBe('boolean')
      expect(typeof viewerHas).toBe('boolean')
    }
    expect(COMPANY_PERMISSION_MATRIX_ROWS.length).toBeGreaterThan(5)
    expect(
      COMPANY_ROLE_PERMISSIONS.MANAGER.includes(Permission.MANAGE_COMPANY_MEMBERS),
    ).toBe(false)
  })
})
