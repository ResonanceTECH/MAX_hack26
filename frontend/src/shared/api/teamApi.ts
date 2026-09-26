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
import { apiClient } from '@/shared/api/apiClient'
import { isReal } from '@/shared/api/apiCapabilities'
import { toApiError } from '@/shared/api/errors'
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

interface MemberDto {
  id: number
  user_id: number | null
  company_id: number
  first_name: string
  last_name: string
  email: string
  role: string
  status: string
  invited_at: string
  joined_at: string | null
  last_active_at: string | null
}

function mapMember(dto: MemberDto): CompanyMember {
  return {
    id: String(dto.id),
    userId: dto.user_id != null ? String(dto.user_id) : `pending-${dto.id}`,
    companyId: String(dto.company_id),
    firstName: dto.first_name,
    lastName: dto.last_name,
    email: dto.email,
    role: dto.role as CompanyMemberRole,
    status: dto.status as CompanyMember['status'],
    invitedAt: dto.invited_at,
    joinedAt: dto.joined_at ?? undefined,
    lastActiveAt: dto.last_active_at ?? undefined,
  }
}

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
    if (isReal('team')) {
      try {
        const { data } = await apiClient.get<MemberDto[]>('/companies/me/members')
        return data.map(mapMember)
      } catch (error) {
        throw toApiError(error)
      }
    }
    await delay()
    return companyMembers(companyId)
  },

  async getById(memberId: string): Promise<CompanyMember> {
    if (isReal('team')) {
      const members = await teamApi.list()
      const member = members.find((m) => m.id === memberId)
      if (!member) throw new TeamApiError('Сотрудник не найден')
      return member
    }
    await delay()
    const member = mockCompanyMembers.find((m) => m.id === memberId)
    if (!member) throw new TeamApiError('Сотрудник не найден')
    return { ...member }
  },

  async invite(input: InviteMemberInput, companyId = CURRENT_COMPANY_ID): Promise<CompanyMember> {
    if (isReal('team')) {
      try {
        const { data } = await apiClient.post<MemberDto>('/companies/me/members', {
          email: input.email,
          first_name: input.firstName,
          last_name: input.lastName,
          role: input.role,
          message: input.message ?? input.optionalMessage,
        })
        return mapMember(data)
      } catch (error) {
        throw new TeamApiError(toApiError(error).message)
      }
    }
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
    if (isReal('team')) {
      try {
        const { data } = await apiClient.patch<MemberDto>(`/companies/me/members/${memberId}`, {
          role,
        })
        return mapMember(data)
      } catch (error) {
        throw new TeamApiError(toApiError(error).message)
      }
    }
    await delay()
    const member = mockCompanyMembers.find((m) => m.id === memberId)
    if (!member) throw new TeamApiError('Сотрудник не найден')
    assertAllowed(canChangeMemberRole(companyMembers(member.companyId), member, role))
    member.role = role
    persistCompanyMembers()
    return { ...member }
  },

  async suspend(memberId: string): Promise<CompanyMember> {
    if (isReal('team')) {
      try {
        const { data } = await apiClient.patch<MemberDto>(`/companies/me/members/${memberId}`, {
          status: 'suspended',
        })
        return mapMember(data)
      } catch (error) {
        throw new TeamApiError(toApiError(error).message)
      }
    }
    await delay()
    const member = mockCompanyMembers.find((m) => m.id === memberId)
    if (!member) throw new TeamApiError('Сотрудник не найден')
    assertAllowed(canSuspendMember(companyMembers(member.companyId), member))
    member.status = COMPANY_MEMBER_STATUS.SUSPENDED
    persistCompanyMembers()
    return { ...member }
  },

  async block(memberId: string): Promise<CompanyMember> {
    return teamApi.suspend(memberId)
  },

  async activate(memberId: string): Promise<CompanyMember> {
    if (isReal('team')) {
      try {
        const { data } = await apiClient.patch<MemberDto>(`/companies/me/members/${memberId}`, {
          status: 'active',
        })
        return mapMember(data)
      } catch (error) {
        throw new TeamApiError(toApiError(error).message)
      }
    }
    await delay()
    const member = mockCompanyMembers.find((m) => m.id === memberId)
    if (!member) throw new TeamApiError('Сотрудник не найден')
    member.status = COMPANY_MEMBER_STATUS.ACTIVE
    member.joinedAt = member.joinedAt ?? new Date().toISOString()
    persistCompanyMembers()
    return { ...member }
  },

  async remove(memberId: string): Promise<void> {
    if (isReal('team')) {
      try {
        await apiClient.delete(`/companies/me/members/${memberId}`)
        return
      } catch (error) {
        throw new TeamApiError(toApiError(error).message)
      }
    }
    await delay()
    const member = mockCompanyMembers.find((m) => m.id === memberId)
    if (!member) throw new TeamApiError('Сотрудник не найден')
    assertAllowed(canRemoveMember(companyMembers(member.companyId), member))
    member.status = COMPANY_MEMBER_STATUS.DEACTIVATED
    persistCompanyMembers()
  },
}
