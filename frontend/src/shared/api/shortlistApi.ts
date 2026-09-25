import type { ShortlistItem } from '@/entities/shortlist'
import { apiClient } from '@/shared/api/apiClient'
import { isReal } from '@/shared/api/apiCapabilities'
import type { ProposalDto, RequestDto } from '@/shared/api/dto/backend'
import { toApiError } from '@/shared/api/errors'
import { delay } from '@/shared/lib/delay'
import { persistShortlist } from '@/shared/mocks/hydrateMocks'
import { mockMatches } from '@/shared/mocks/matches'
import { getProposalById } from '@/shared/mocks/proposals'
import { mockShortlist } from '@/shared/mocks/shortlist'

const SHORTLIST_STATUSES = new Set(['shortlisted', 'negotiating', 'chosen'])

function persist() {
  persistShortlist()
}

function proposalToShortlistItem(p: ProposalDto): ShortlistItem {
  return {
    id: `sl-${p.id}`,
    opportunityId: String(p.request_id),
    companyId: String(p.company_id),
    proposalId: String(p.id),
    price: p.price,
    currency: 'RUB',
    durationDays: p.term_days,
    matchScore: 0,
    note: '',
  }
}

async function realGetAll(): Promise<ShortlistItem[]> {
  try {
    const mine = await apiClient.get<RequestDto[]>('/opportunities/mine')
    const items: ShortlistItem[] = []
    for (const req of mine.data) {
      try {
        const proposals = await apiClient.get<ProposalDto[]>(`/opportunities/${req.id}/proposals`)
        for (const p of proposals.data) {
          if (SHORTLIST_STATUSES.has(p.status)) {
            items.push(proposalToShortlistItem(p))
          }
        }
      } catch {
        // skip opportunities we cannot read proposals for
      }
    }
    return items
  } catch (error) {
    throw toApiError(error)
  }
}

export const shortlistApi = {
  async getAll(): Promise<ShortlistItem[]> {
    if (isReal('shortlist')) return realGetAll()
    await delay()
    return [...mockShortlist]
  },

  async add(params: {
    opportunityId: string
    companyId: string
    proposalId: string | null
    price: number | null
    currency: string
    durationDays: number | null
    matchScore?: number
    note?: string
  }): Promise<ShortlistItem> {
    if (isReal('shortlist')) {
      try {
        if (params.proposalId) {
          const { data } = await apiClient.post<ProposalDto>(
            `/proposals/${params.proposalId}/shortlist`,
          )
          return proposalToShortlistItem(data)
        }
        const { data } = await apiClient.post<ProposalDto>(
          `/opportunities/${params.opportunityId}/shortlist`,
          { company_id: Number(params.companyId) },
        )
        return proposalToShortlistItem(data)
      } catch (error) {
        throw toApiError(error)
      }
    }
    const existing = mockShortlist.find(
      (item) =>
        item.opportunityId === params.opportunityId &&
        item.companyId === params.companyId &&
        (params.proposalId == null || item.proposalId === params.proposalId),
    )
    if (existing) {
      if (params.proposalId) existing.proposalId = params.proposalId
      if (params.price != null) existing.price = params.price
      if (params.durationDays != null) existing.durationDays = params.durationDays
      if (params.matchScore != null) existing.matchScore = params.matchScore
      persist()
      await delay()
      return existing
    }

    const matchScore =
      params.matchScore ??
      mockMatches.find(
        (m) => m.opportunityId === params.opportunityId && m.companyId === params.companyId,
      )?.score ??
      80

    const item: ShortlistItem = {
      id: `sl-${Date.now()}`,
      opportunityId: params.opportunityId,
      companyId: params.companyId,
      proposalId: params.proposalId,
      price: params.price,
      currency: params.currency,
      durationDays: params.durationDays,
      matchScore,
      note: params.note ?? '',
    }
    mockShortlist.unshift(item)
    persist()
    await delay()
    return item
  },

  async addFromProposal(proposalId: string): Promise<ShortlistItem> {
    if (isReal('shortlist')) {
      try {
        const { data } = await apiClient.post<ProposalDto>(`/proposals/${proposalId}/shortlist`)
        return proposalToShortlistItem(data)
      } catch (error) {
        throw toApiError(error)
      }
    }
    const proposal = getProposalById(proposalId)
    if (!proposal) throw new Error('Предложение не найдено')
    return shortlistApi.add({
      opportunityId: proposal.opportunityId,
      companyId: proposal.company.id,
      proposalId: proposal.id,
      price: proposal.price,
      currency: proposal.currency,
      durationDays: proposal.durationDays,
    })
  },

  async remove(id: string): Promise<void> {
    if (isReal('shortlist')) {
      // Backend toggles shortlist; id is `sl-{proposalId}`
      const proposalId = id.startsWith('sl-') ? id.slice(3) : id
      try {
        await apiClient.post(`/proposals/${proposalId}/shortlist`)
        return
      } catch (error) {
        throw toApiError(error)
      }
    }
    const index = mockShortlist.findIndex((item) => item.id === id)
    if (index < 0) throw new Error('Запись shortlist не найдена')
    mockShortlist.splice(index, 1)
    persist()
    await delay()
  },

  async updateNote(id: string, note: string): Promise<ShortlistItem> {
    if (isReal('shortlist')) {
      // Notes not supported by backend — local-only no-op shape
      const items = await realGetAll()
      const item = items.find((entry) => entry.id === id)
      if (!item) throw new Error('Запись shortlist не найдена')
      return { ...item, note }
    }
    const item = mockShortlist.find((entry) => entry.id === id)
    if (!item) throw new Error('Запись shortlist не найдена')
    item.note = note
    persist()
    await delay(80)
    return item
  },
}
