import { apiClient } from '@/shared/api/apiClient'
import { isReal } from '@/shared/api/apiCapabilities'
import { toApiError } from '@/shared/api/errors'
import { delay } from '@/shared/lib/delay'
import type { CompanyMemberRole } from '@/entities/company-member'
import { COMPANY_MEMBER_STATUS, type CompanyMemberStatus } from '@/entities/company-member'
import { mockCompanyMembers } from '@/shared/mocks'

export interface CompanyInvitation {
  id: string
  companyId: string
  companyName: string
  firstName: string
  lastName: string
  email: string
  role: CompanyMemberRole
  status: CompanyMemberStatus
  invitedAt: string
  message?: string | null
}

interface InvitationDto {
  id: number
  company_id: number
  company_name: string
  first_name: string
  last_name: string
  email: string
  role: string
  status: string
  invited_at: string
  message?: string | null
}

function mapInvitation(dto: InvitationDto): CompanyInvitation {
  return {
    id: String(dto.id),
    companyId: String(dto.company_id),
    companyName: dto.company_name,
    firstName: dto.first_name,
    lastName: dto.last_name,
    email: dto.email,
    role: dto.role as CompanyMemberRole,
    status: dto.status as CompanyMemberStatus,
    invitedAt: dto.invited_at,
    message: dto.message,
  }
}

export const companyInvitationsApi = {
  async getById(id: string): Promise<CompanyInvitation> {
    if (isReal('team')) {
      try {
        const { data } = await apiClient.get<InvitationDto>(`/company-invitations/${id}`)
        return mapInvitation(data)
      } catch (error) {
        throw toApiError(error)
      }
    }
    await delay()
    const member = mockCompanyMembers.find((m) => m.id === id)
    if (!member) throw new Error('Приглашение не найдено')
    return {
      id: member.id,
      companyId: member.companyId,
      companyName: 'DigitalLab',
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      role: member.role,
      status: member.status,
      invitedAt: member.invitedAt,
    }
  },

  async accept(id: string): Promise<CompanyInvitation> {
    if (isReal('team')) {
      try {
        const { data } = await apiClient.post<InvitationDto>(`/company-invitations/${id}/accept`)
        return mapInvitation(data)
      } catch (error) {
        throw toApiError(error)
      }
    }
    await delay()
    const member = mockCompanyMembers.find((m) => m.id === id)
    if (!member) throw new Error('Приглашение не найдено')
    if (member.status !== COMPANY_MEMBER_STATUS.INVITED) {
      throw new Error('Приглашение уже обработано')
    }
    member.status = COMPANY_MEMBER_STATUS.ACTIVE
    member.joinedAt = new Date().toISOString()
    return {
      id: member.id,
      companyId: member.companyId,
      companyName: 'DigitalLab',
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      role: member.role,
      status: member.status,
      invitedAt: member.invitedAt,
    }
  },

  async decline(id: string): Promise<CompanyInvitation> {
    if (isReal('team')) {
      try {
        const { data } = await apiClient.post<InvitationDto>(`/company-invitations/${id}/decline`)
        return mapInvitation(data)
      } catch (error) {
        throw toApiError(error)
      }
    }
    await delay()
    const member = mockCompanyMembers.find((m) => m.id === id)
    if (!member) throw new Error('Приглашение не найдено')
    if (member.status !== COMPANY_MEMBER_STATUS.INVITED) {
      throw new Error('Приглашение уже обработано')
    }
    member.status = COMPANY_MEMBER_STATUS.DEACTIVATED
    return {
      id: member.id,
      companyId: member.companyId,
      companyName: 'DigitalLab',
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      role: member.role,
      status: member.status,
      invitedAt: member.invitedAt,
    }
  },
}
