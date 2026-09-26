import { COMPANY_ACTIVITY_TYPE } from '@/entities/company-activity'
import {
  COMPANY_MEMBER_STATUS,
  type CompanyInvitation,
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
import { getCompanyById, mockCompanyMembers } from '@/shared/mocks'
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
  async list(companyId?: string): Promise<CompanyMember[]> {
    if (isReal('team')) {
      try {
        const { data } = await apiClient.get<MemberDto[]>('/companies/me/members')
        return data.map(mapMember)
      } catch (error) {
        throw toApiError(error)
      }
    }
    await delay()
    if (!companyId) throw new Error('companyId required in mock mode')
    return companyMembers(companyId)
  },

  async getById(memberId: string, companyId?: string): Promise<CompanyMember> {
    if (isReal('team')) {
      const members = await teamApi.list(companyId)
      const member = members.find((m) => m.id === memberId)
      if (!member) throw new TeamApiError('Сотрудник не найден')
      return member
    }
    await delay()
    const member = mockCompanyMembers.find((m) => m.id === memberId)
    if (!member) throw new TeamApiError('Сотрудник не найден')
    return { ...member }
  },

  async invite(input: InviteMemberInput, companyId?: string): Promise<CompanyMember> {
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
    if (!companyId) throw new Error('companyId required in mock mode')
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
      inviteToken: `inv-${Date.now()}`,
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

  async resendInvite(memberId: string): Promise<CompanyMember> {
    if (isReal('team')) {
      try {
        const { data } = await apiClient.post<MemberDto>(
          `/companies/me/members/${memberId}/resend`,
        )
        return mapMember(data)
      } catch (error) {
        throw new TeamApiError(toApiError(error).message)
      }
    }
    await delay()
    const member = mockCompanyMembers.find((m) => m.id === memberId)
    if (!member) throw new TeamApiError('Сотрудник не найден')
    if (member.status !== COMPANY_MEMBER_STATUS.INVITED) {
      throw new TeamApiError('Повторная отправка только для приглашённых')
    }
    member.invitedAt = new Date().toISOString()
    persistCompanyMembers()
    return { ...member }
  },

  async getInvitationByToken(token: string): Promise<CompanyInvitation> {
    if (isReal('team')) {
      try {
        const { data } = await apiClient.get<{
          token: string
          company_id: number
          company_name: string
          role: string
          invited_by: string
          email: string
          status: string
          expires_at: string | null
          first_name?: string
          last_name?: string
        }>(`/company-invitations/${token}`)
        return {
          token: data.token,
          companyId: String(data.company_id),
          companyName: data.company_name,
          role: data.role as CompanyMemberRole,
          invitedBy: data.invited_by,
          email: data.email,
          status: data.status as CompanyInvitation['status'],
          expiresAt: data.expires_at,
          firstName: data.first_name,
          lastName: data.last_name,
        }
      } catch (error) {
        throw new TeamApiError(toApiError(error).message)
      }
    }
    await delay()
    const member = mockCompanyMembers.find((m) => m.inviteToken === token)
    if (!member) throw new TeamApiError('Приглашение не найдено')
    const company = getCompanyById(member.companyId)
    let status: CompanyInvitation['status'] = 'pending'
    if (member.status === COMPANY_MEMBER_STATUS.ACTIVE) status = 'accepted'
    else if (member.status === COMPANY_MEMBER_STATUS.DEACTIVATED) status = 'declined'
    else if (member.status === COMPANY_MEMBER_STATUS.INVITED) {
      const invitedAt = +new Date(member.invitedAt)
      if (Date.now() - invitedAt > 1000 * 60 * 60 * 24 * 30) status = 'expired'
    }
    return {
      token,
      companyId: member.companyId,
      companyName: company?.shortName ?? member.companyId,
      role: member.role,
      invitedBy: 'Анна Смирнова',
      email: member.email,
      status,
      expiresAt: null,
      firstName: member.firstName,
      lastName: member.lastName,
    }
  },

  async acceptInvitation(token: string): Promise<CompanyInvitation> {
    if (isReal('team')) {
      try {
        const { data } = await apiClient.post<{
          token: string
          company_id: number
          company_name: string
          role: string
          invited_by: string
          email: string
          status: string
          expires_at: string | null
        }>(`/company-invitations/${token}/accept`)
        return {
          token: data.token,
          companyId: String(data.company_id),
          companyName: data.company_name,
          role: data.role as CompanyMemberRole,
          invitedBy: data.invited_by,
          email: data.email,
          status: data.status as CompanyInvitation['status'],
          expiresAt: data.expires_at,
        }
      } catch (error) {
        throw new TeamApiError(toApiError(error).message)
      }
    }
    await delay()
    const invitation = await teamApi.getInvitationByToken(token)
    if (invitation.status === 'expired') {
      throw new TeamApiError('Срок действия приглашения истёк')
    }
    if (invitation.status !== 'pending') {
      throw new TeamApiError('Приглашение уже обработано')
    }
    const member = mockCompanyMembers.find((m) => m.inviteToken === token)
    if (!member) throw new TeamApiError('Приглашение не найдено')
    member.status = COMPANY_MEMBER_STATUS.ACTIVE
    member.joinedAt = new Date().toISOString()
    persistCompanyMembers()
    return { ...invitation, status: 'accepted' }
  },

  async declineInvitation(token: string): Promise<CompanyInvitation> {
    if (isReal('team')) {
      try {
        const { data } = await apiClient.post<{
          token: string
          company_id: number
          company_name: string
          role: string
          invited_by: string
          email: string
          status: string
          expires_at: string | null
        }>(`/company-invitations/${token}/decline`)
        return {
          token: data.token,
          companyId: String(data.company_id),
          companyName: data.company_name,
          role: data.role as CompanyMemberRole,
          invitedBy: data.invited_by,
          email: data.email,
          status: data.status as CompanyInvitation['status'],
          expiresAt: data.expires_at,
        }
      } catch (error) {
        throw new TeamApiError(toApiError(error).message)
      }
    }
    await delay()
    const invitation = await teamApi.getInvitationByToken(token)
    if (invitation.status !== 'pending') {
      throw new TeamApiError('Приглашение уже обработано')
    }
    const member = mockCompanyMembers.find((m) => m.inviteToken === token)
    if (!member) throw new TeamApiError('Приглашение не найдено')
    member.status = COMPANY_MEMBER_STATUS.DEACTIVATED
    persistCompanyMembers()
    return { ...invitation, status: 'declined' }
  },
}
