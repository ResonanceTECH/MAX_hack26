import { delay } from '@/shared/lib/delay'
import { loadMockState, saveMockState } from '@/shared/lib/mockPersist'
import { apiClient } from '@/shared/api/apiClient'
import { isReal } from '@/shared/api/apiCapabilities'
import { toApiError } from '@/shared/api/errors'

export const OPPORTUNITY_INVITE_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  EXPIRED: 'EXPIRED',
} as const

export type OpportunityInviteStatus =
  (typeof OPPORTUNITY_INVITE_STATUS)[keyof typeof OPPORTUNITY_INVITE_STATUS]

export interface CompanyInvite {
  id: string
  opportunityId: string
  opportunityTitle: string
  companyId: string
  companyName: string
  invitingCompanyId?: string
  invitingCompanyName: string
  budgetMin?: number | null
  budgetMax?: number | null
  status: OpportunityInviteStatus
  createdAt: string
  respondedAt?: string | null
}

interface InviteDto {
  id: number
  opportunity_id: number
  opportunity_title: string
  company_id: number
  company_name: string
  inviting_company_id?: number | null
  inviting_company_name?: string
  budget_min?: number | null
  budget_max?: number | null
  status?: string
  created_at: string
  responded_at?: string | null
}

function mapInvite(dto: InviteDto): CompanyInvite {
  const invitingName =
    dto.inviting_company_name || dto.company_name || 'Компания'
  return {
    id: String(dto.id),
    opportunityId: String(dto.opportunity_id),
    opportunityTitle: dto.opportunity_title,
    companyId: String(dto.company_id),
    companyName: dto.company_name,
    invitingCompanyId:
      dto.inviting_company_id != null ? String(dto.inviting_company_id) : undefined,
    invitingCompanyName: invitingName,
    budgetMin: dto.budget_min ?? null,
    budgetMax: dto.budget_max ?? null,
    status: (dto.status as OpportunityInviteStatus) ?? OPPORTUNITY_INVITE_STATUS.PENDING,
    createdAt: dto.created_at,
    respondedAt: dto.responded_at ?? null,
  }
}

let invites = loadMockState<CompanyInvite[]>('invites', [])

export const inviteApi = {
  async getAll(): Promise<CompanyInvite[]> {
    if (isReal('opportunities')) {
      try {
        const { data } = await apiClient.get<InviteDto[]>('/invites/mine')
        return data.map(mapInvite)
      } catch (error) {
        throw toApiError(error)
      }
    }
    await delay()
    return [...invites]
  },

  async getForCompany(companyId: string): Promise<CompanyInvite[]> {
    const all = await inviteApi.getAll()
    return all.filter((i) => i.companyId === companyId)
  },

  async invite(params: {
    opportunityId: string
    opportunityTitle: string
    companyId: string
    companyName: string
  }): Promise<CompanyInvite> {
    if (isReal('opportunities')) {
      try {
        const { data } = await apiClient.post<InviteDto>(
          `/opportunities/${params.opportunityId}/invites`,
          { company_id: Number(params.companyId) },
        )
        return mapInvite(data)
      } catch (error) {
        throw toApiError(error)
      }
    }
    await delay()
    const existing = invites.find(
      (i) => i.opportunityId === params.opportunityId && i.companyId === params.companyId,
    )
    if (existing) return existing

    const invite: CompanyInvite = {
      id: `inv-${Date.now()}`,
      opportunityId: params.opportunityId,
      opportunityTitle: params.opportunityTitle,
      companyId: params.companyId,
      companyName: params.companyName,
      invitingCompanyName: 'Ваша компания',
      status: OPPORTUNITY_INVITE_STATUS.PENDING,
      createdAt: new Date().toISOString(),
    }
    invites = [invite, ...invites]
    saveMockState('invites', invites)
    return invite
  },

  async accept(inviteId: string): Promise<CompanyInvite> {
    if (isReal('opportunities')) {
      try {
        const { data } = await apiClient.post<InviteDto>(`/invites/${inviteId}/accept`)
        return mapInvite(data)
      } catch (error) {
        throw toApiError(error)
      }
    }
    await delay()
    const invite = invites.find((i) => i.id === inviteId)
    if (!invite) throw new Error('Приглашение не найдено')
    if (invite.status !== OPPORTUNITY_INVITE_STATUS.PENDING) {
      throw new Error('Приглашение уже обработано')
    }
    invite.status = OPPORTUNITY_INVITE_STATUS.ACCEPTED
    invite.respondedAt = new Date().toISOString()
    saveMockState('invites', invites)
    return { ...invite }
  },

  async decline(inviteId: string): Promise<CompanyInvite> {
    if (isReal('opportunities')) {
      try {
        const { data } = await apiClient.post<InviteDto>(`/invites/${inviteId}/decline`)
        return mapInvite(data)
      } catch (error) {
        throw toApiError(error)
      }
    }
    await delay()
    const invite = invites.find((i) => i.id === inviteId)
    if (!invite) throw new Error('Приглашение не найдено')
    if (invite.status !== OPPORTUNITY_INVITE_STATUS.PENDING) {
      throw new Error('Приглашение уже обработано')
    }
    invite.status = OPPORTUNITY_INVITE_STATUS.DECLINED
    invite.respondedAt = new Date().toISOString()
    saveMockState('invites', invites)
    return { ...invite }
  },
}
