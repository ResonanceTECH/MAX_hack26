import { COMPANY_ACTIVITY_TYPE } from '@/entities/company-activity'
import {
  COMPANY_MEMBER_STATUS,
  type CompanyMember,
  type CompanyMemberRole,
} from '@/entities/company-member'
import {
  canChangeMemberRole,
  canRemoveMember,
  canSuspendMember,
  LAST_ADMIN_MESSAGE,
} from '@/features/company-management/model/businessRules'
import { delay } from '@/shared/lib/delay'
import { CURRENT_COMPANY_ID, mockCompanyMembers } from '@/shared/mocks'
import { persistCompanyMembers } from '@/shared/mocks/hydrateMocks'
import { activityApi } from './activityApi'

export class TeamApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TeamApiError'
  }
}

const DEFAULT_ACTOR = 'Анна Смирнова'

function companyMembers(companyId: string): CompanyMember[] {
  return mockCompanyMembers.filter((m) => m.companyId === companyId)
}

function assertAllowed(result: { allowed: boolean; reason?: string }): void {
  if (!result.allowed) {
    throw new TeamApiError(result.reason ?? LAST_ADMIN_MESSAGE)
  }
}

export interface InviteMemberInput {
  email: string
  firstName: string
  lastName: string
  role: CompanyMemberRole
  message?: string
  optionalMessage?: string
}

export const teamApi = {
  async list(companyId = CURRENT_COMPANY_ID): Promise<CompanyMember[]> {
    await delay()
    return companyMembers(companyId)
  },

  async getById(memberId: string): Promise<CompanyMember> {
    await delay()
    const member = mockCompanyMembers.find((m) => m.id === memberId)
    if (!member) throw new TeamApiError('Сотрудник не найден')
    return { ...member }
  },

  async invite(input: InviteMemberInput, companyId = CURRENT_COMPANY_ID): Promise<CompanyMember> {
    await delay()
    const email = input.email.trim().toLowerCase()
    const duplicate = mockCompanyMembers.find(
      (m) =>
        m.companyId === companyId &&
        m.email.toLowerCase() === email &&
        m.status !== COMPANY_MEMBER_STATUS.DEACTIVATED,
    )
    if (duplicate) {
      throw new TeamApiError('Сотрудник с таким email уже есть в компании')
    }

    const member: CompanyMember = {
      id: `member-${Date.now()}`,
      userId: `user-invited-${Date.now()}`,
      companyId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email.trim(),
      role: input.role,
      status: COMPANY_MEMBER_STATUS.INVITED,
      invitedAt: new Date().toISOString(),
    }
    mockCompanyMembers.push(member)
    persistCompanyMembers()
    activityApi.appendSync({
      companyId,
      type: COMPANY_ACTIVITY_TYPE.MEMBER_INVITED,
      actorName: DEFAULT_ACTOR,
      action: 'пригласила сотрудника',
      entityLabel: `${member.firstName} ${member.lastName}`,
    })
    return member
  },

  async updateRole(memberId: string, role: CompanyMemberRole): Promise<CompanyMember> {
    await delay()
    const member = mockCompanyMembers.find((m) => m.id === memberId)
    if (!member) throw new TeamApiError('Сотрудник не найден')
    assertAllowed(canChangeMemberRole(companyMembers(member.companyId), member, role))
    member.role = role
    persistCompanyMembers()
    activityApi.appendSync({
      companyId: member.companyId,
      type: COMPANY_ACTIVITY_TYPE.MEMBER_ROLE_CHANGED,
      actorName: DEFAULT_ACTOR,
      action: 'изменила роль сотрудника',
      entityLabel: `${member.firstName} ${member.lastName}`,
    })
    return { ...member }
  },

  async suspend(memberId: string): Promise<CompanyMember> {
    await delay()
    const member = mockCompanyMembers.find((m) => m.id === memberId)
    if (!member) throw new TeamApiError('Сотрудник не найден')
    assertAllowed(canSuspendMember(companyMembers(member.companyId), member))
    member.status = COMPANY_MEMBER_STATUS.SUSPENDED
    persistCompanyMembers()
    activityApi.appendSync({
      companyId: member.companyId,
      type: COMPANY_ACTIVITY_TYPE.MEMBER_SUSPENDED,
      actorName: DEFAULT_ACTOR,
      action: 'приостановила доступ сотрудника',
      entityLabel: `${member.firstName} ${member.lastName}`,
    })
    return { ...member }
  },

  /** @deprecated use suspend */
  async block(memberId: string): Promise<CompanyMember> {
    return teamApi.suspend(memberId)
  },

  async activate(memberId: string): Promise<CompanyMember> {
    await delay()
    const member = mockCompanyMembers.find((m) => m.id === memberId)
    if (!member) throw new TeamApiError('Сотрудник не найден')
    if (member.status === COMPANY_MEMBER_STATUS.INVITED) {
      return { ...member }
    }
    member.status = COMPANY_MEMBER_STATUS.ACTIVE
    member.joinedAt = member.joinedAt ?? new Date().toISOString()
    persistCompanyMembers()
    return { ...member }
  },

  async remove(memberId: string): Promise<void> {
    await delay()
    const member = mockCompanyMembers.find((m) => m.id === memberId)
    if (!member) throw new TeamApiError('Сотрудник не найден')
    assertAllowed(canRemoveMember(companyMembers(member.companyId), member))
    member.status = COMPANY_MEMBER_STATUS.DEACTIVATED
    persistCompanyMembers()
    activityApi.appendSync({
      companyId: member.companyId,
      type: COMPANY_ACTIVITY_TYPE.MEMBER_REMOVED,
      actorName: DEFAULT_ACTOR,
      action: 'деактивировала сотрудника',
      entityLabel: `${member.firstName} ${member.lastName}`,
    })
  },
}
