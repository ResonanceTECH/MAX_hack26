import type { Proposal } from '@/entities/proposal'
import { delay } from '@/shared/lib/delay'
import {
  getCompanyById,
  getOpportunityById,
  getProposalById,
  getProposalsByOpportunity,
  mockProposals,
} from '@/shared/mocks'
import { CURRENT_COMPANY_ID } from '@/shared/mocks/user'

export interface CreateProposalPayload {
  opportunityId: string
  price: number
  currency: string
  durationDays: number
  description: string
  included: string[]
  excluded: string[]
  cases: string[]
  comment?: string
}

export const proposalApi = {
  async getByOpportunity(opportunityId: string): Promise<Proposal[]> {
    await delay()
    return getProposalsByOpportunity(opportunityId)
  },

  async getById(id: string): Promise<Proposal> {
    await delay()
    const item = getProposalById(id)
    if (!item) throw new Error('Предложение не найдено')
    return item
  },

  async getMine(companyId: string): Promise<Proposal[]> {
    await delay()
    return mockProposals.filter((p) => p.company.id === companyId)
  },

  async create(payload: CreateProposalPayload): Promise<Proposal> {
    await delay()
    const company = getCompanyById(CURRENT_COMPANY_ID)
    if (!company) throw new Error('Компания не найдена')
    const created: Proposal = {
      id: `prop-${Date.now()}`,
      opportunityId: payload.opportunityId,
      company,
      price: payload.price,
      currency: payload.currency,
      durationDays: payload.durationDays,
      description: payload.description,
      included: payload.included,
      excluded: payload.excluded,
      cases: payload.cases,
      status: 'submitted',
      createdAt: new Date().toISOString(),
    }
    mockProposals.unshift(created)
    const opp = getOpportunityById(payload.opportunityId)
    if (opp) {
      opp.proposalsCount += 1
      opp.newProposalsCount = (opp.newProposalsCount ?? 0) + 1
    }
    return created
  },

  async shortlist(id: string): Promise<Proposal> {
    await delay()
    const item = getProposalById(id)
    if (!item) throw new Error('Предложение не найдено')
    item.status = 'shortlisted'
    return item
  },

  async reject(id: string): Promise<Proposal> {
    await delay()
    const item = getProposalById(id)
    if (!item) throw new Error('Предложение не найдено')
    item.status = 'rejected'
    return item
  },
}
