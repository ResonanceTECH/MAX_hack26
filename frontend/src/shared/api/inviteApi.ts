import { delay } from '@/shared/lib/delay'
import { loadMockState, saveMockState } from '@/shared/lib/mockPersist'
import { apiClient } from '@/shared/api/apiClient'
import { isReal } from '@/shared/api/apiCapabilities'
import { toApiError } from '@/shared/api/errors'

export interface CompanyInvite {
  id: string
  opportunityId: string
  opportunityTitle: string
  companyId: string
  companyName: string
  createdAt: string
}

interface InviteDto {
  id: number
  opportunity_id: number
  opportunity_title: string
  company_id: number
  company_name: string
  created_at: string
}

function mapInvite(dto: InviteDto): CompanyInvite {
  return {
    id: String(dto.id),
    opportunityId: String(dto.opportunity_id),
    opportunityTitle: dto.opportunity_title,
    companyId: String(dto.company_id),
    companyName: dto.company_name,
    createdAt: dto.created_at,
  }
}

let invites = loadMockState<CompanyInvite[]>('invites', [])

export const inviteApi = {
  async getAll(): Promise<CompanyInvite[]> {
    if (isReal('favorites')) {
      // reuse real mode flag via opportunities — use invites capability via companies gap; wire with shortlist-like
    }
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
      ...params,
      createdAt: new Date().toISOString(),
    }
    invites = [invite, ...invites]
    saveMockState('invites', invites)
    return invite
  },
}
