import type { Proposal } from '@/entities/proposal'
import { delay } from '@/shared/lib/delay'
import { persistOpportunities, persistProposals } from '@/shared/mocks/hydrateMocks'
import {
  getCompanyById,
  getOpportunityById,
  getProposalById,
  getProposalsByOpportunity,
  mockProposals,
} from '@/shared/mocks'
import { CURRENT_COMPANY_ID } from '@/shared/mocks/user'
import { shortlistApi } from './shortlistApi'

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

const BLOCKED_STATUSES = new Set(['expired', 'closed'])

export class ProposalApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProposalApiError'
  }
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
    const opportunity = getOpportunityById(payload.opportunityId)
    if (!opportunity) throw new ProposalApiError('Возможность не найдена')

    const company = getCompanyById(CURRENT_COMPANY_ID)
    if (!company) throw new ProposalApiError('Компания не найдена')

    if (opportunity.company.id === company.id) {
      throw new ProposalApiError('Нельзя откликнуться на собственный запрос')
    }
    if (BLOCKED_STATUSES.has(opportunity.status)) {
      throw new ProposalApiError(
        opportunity.status === 'expired' ? 'Приём предложений завершён' : 'Запрос закрыт',
      )
    }

    const existing = mockProposals.find(
      (p) =>
        p.opportunityId === payload.opportunityId &&
        p.company.id === company.id &&
        !['rejected', 'withdrawn'].includes(p.status),
    )
    if (existing) {
      existing.price = payload.price
      existing.currency = payload.currency
      existing.durationDays = payload.durationDays
      existing.description = payload.description
      existing.included = payload.included
      existing.excluded = payload.excluded
      existing.cases = payload.cases
      existing.status = 'submitted'
      existing.createdAt = new Date().toISOString()
      persistProposals()
      return existing
    }

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
    opportunity.proposalsCount += 1
    opportunity.newProposalsCount = (opportunity.newProposalsCount ?? 0) + 1
    persistProposals()
    persistOpportunities()
    return created
  },

  async shortlist(id: string): Promise<Proposal> {
    const item = getProposalById(id)
    if (!item) throw new Error('Предложение не найдено')
    item.status = 'shortlisted'
    await shortlistApi.addFromProposal(id)
    persistProposals()
    await delay()
    return item
  },

  async reject(id: string): Promise<Proposal> {
    await delay()
    const item = getProposalById(id)
    if (!item) throw new Error('Предложение не найдено')
    item.status = 'rejected'
    persistProposals()
    return item
  },
}
