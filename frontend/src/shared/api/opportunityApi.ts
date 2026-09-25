import type { Opportunity } from '@/entities/opportunity'
import { delay } from '@/shared/lib/delay'
import { persistOpportunities } from '@/shared/mocks/hydrateMocks'
import { getCompanyById, getOpportunityById, mockOpportunities } from '@/shared/mocks'
import { mockMatches } from '@/shared/mocks/matches'
import { CURRENT_COMPANY_ID } from '@/shared/mocks/user'

export interface OpportunityFilters {
  query?: string
  category?: string
  industries?: string[]
  region?: string
  budgetMin?: number
  budgetMax?: number
  technologies?: string[]
  remoteAllowed?: boolean
  status?: string
  minMatchScore?: number
}

export type OpportunitySort = 'match' | 'newest' | 'budget_asc' | 'budget_desc' | 'deadline'

export interface CreateOpportunityPayload {
  title: string
  description: string
  type: string
  category: string
  subcategory: string
  industries: string[]
  skills: string[]
  technologies: string[]
  budgetMin: number | null
  budgetMax: number | null
  currency: string
  region: string
  remoteAllowed: boolean
  proposalDeadline: string
  executionDeadline: string | null
}

function scoreFor(opportunityId: string): number {
  return (
    mockMatches.find(
      (m) => m.opportunityId === opportunityId && m.companyId === CURRENT_COMPANY_ID,
    )?.score ?? 0
  )
}

function applyFilters(items: Opportunity[], filters?: OpportunityFilters): Opportunity[] {
  if (!filters) return items
  return items.filter((o) => {
    if (filters.query) {
      const q = filters.query.toLowerCase()
      const hay = [
        o.title,
        o.description,
        o.company.shortName,
        o.category,
        ...o.skills,
        ...o.technologies,
        ...o.industries,
      ]
        .join(' ')
        .toLowerCase()
      if (!hay.includes(q)) return false
    }
    if (filters.category && o.category !== filters.category) return false
    if (filters.industries?.length && !filters.industries.some((i) => o.industries.includes(i))) {
      return false
    }
    if (filters.region && o.region !== filters.region) return false
    if (filters.budgetMin != null && o.budgetMax != null && o.budgetMax < filters.budgetMin) {
      return false
    }
    if (filters.budgetMax != null && o.budgetMin != null && o.budgetMin > filters.budgetMax) {
      return false
    }
    if (
      filters.technologies?.length &&
      !filters.technologies.some((t) => o.technologies.includes(t))
    ) {
      return false
    }
    if (filters.remoteAllowed != null && o.remoteAllowed !== filters.remoteAllowed) return false
    if (filters.status && o.status !== filters.status) return false
    if (filters.minMatchScore != null && scoreFor(o.id) < filters.minMatchScore) return false
    return true
  })
}

function applySort(items: Opportunity[], sort?: OpportunitySort): Opportunity[] {
  const sorted = [...items]
  switch (sort) {
    case 'newest':
      return sorted.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    case 'budget_asc':
      return sorted.sort((a, b) => (a.budgetMin ?? 0) - (b.budgetMin ?? 0))
    case 'budget_desc':
      return sorted.sort((a, b) => (b.budgetMax ?? 0) - (a.budgetMax ?? 0))
    case 'deadline':
      return sorted.sort((a, b) => +new Date(a.proposalDeadline) - +new Date(b.proposalDeadline))
    case 'match':
      return sorted.sort((a, b) => scoreFor(b.id) - scoreFor(a.id))
    default:
      return sorted
  }
}

export const opportunityApi = {
  async getAll(filters?: OpportunityFilters, sort?: OpportunitySort): Promise<Opportunity[]> {
    await delay()
    return applySort(applyFilters(mockOpportunities, filters), sort)
  },

  async getById(id: string): Promise<Opportunity> {
    await delay()
    const item = getOpportunityById(id)
    if (!item) throw new Error('Возможность не найдена')
    return item
  },

  async create(payload: CreateOpportunityPayload): Promise<Opportunity> {
    await delay()
    const company = getCompanyById(CURRENT_COMPANY_ID) ?? mockOpportunities[0]?.company
    if (!company) throw new Error('Нет данных компании')
    const created: Opportunity = {
      id: `opp-${Date.now()}`,
      title: payload.title,
      description: payload.description,
      type: payload.type as Opportunity['type'],
      company,
      category: payload.category,
      subcategory: payload.subcategory,
      industries: payload.industries,
      skills: payload.skills,
      technologies: payload.technologies,
      requiredRequirements: payload.technologies.slice(0, 3),
      desiredRequirements: payload.skills.slice(0, 2),
      budgetMin: payload.budgetMin,
      budgetMax: payload.budgetMax,
      currency: payload.currency,
      region: payload.region,
      remoteAllowed: payload.remoteAllowed,
      proposalDeadline: payload.proposalDeadline,
      executionDeadline: payload.executionDeadline,
      status: 'draft',
      createdAt: new Date().toISOString(),
      proposalsCount: 0,
      newProposalsCount: 0,
    }
    mockOpportunities.unshift(created)
    persistOpportunities()
    return created
  },

  async update(id: string, payload: Partial<CreateOpportunityPayload>): Promise<Opportunity> {
    await delay()
    const item = getOpportunityById(id)
    if (!item) throw new Error('Возможность не найдена')
    Object.assign(item, payload)
    persistOpportunities()
    return item
  },

  async publish(id: string): Promise<Opportunity> {
    await delay()
    const item = getOpportunityById(id)
    if (!item) throw new Error('Возможность не найдена')
    item.status = 'published'
    persistOpportunities()
    return item
  },

  async saveDraft(payload: CreateOpportunityPayload): Promise<Opportunity> {
    return opportunityApi.create(payload)
  },

  async getMine(companyId: string): Promise<Opportunity[]> {
    await delay()
    return mockOpportunities.filter((o) => o.company.id === companyId)
  },
}
