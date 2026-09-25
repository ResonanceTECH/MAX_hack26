import { delay } from '@/shared/lib/delay'
import { loadMockState, saveMockState } from '@/shared/lib/mockPersist'

export interface CompanyInvite {
  id: string
  opportunityId: string
  opportunityTitle: string
  companyId: string
  companyName: string
  createdAt: string
}

let invites = loadMockState<CompanyInvite[]>('invites', [])

export const inviteApi = {
  async getAll(): Promise<CompanyInvite[]> {
    await delay()
    return [...invites]
  },

  async getForCompany(companyId: string): Promise<CompanyInvite[]> {
    await delay()
    return invites.filter((i) => i.companyId === companyId)
  },

  async invite(params: {
    opportunityId: string
    opportunityTitle: string
    companyId: string
    companyName: string
  }): Promise<CompanyInvite> {
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
