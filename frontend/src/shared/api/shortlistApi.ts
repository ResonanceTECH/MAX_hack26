import type { ShortlistItem } from '@/entities/shortlist'
import { delay } from '@/shared/lib/delay'
import { persistShortlist } from '@/shared/mocks/hydrateMocks'
import { mockMatches } from '@/shared/mocks/matches'
import { getProposalById } from '@/shared/mocks/proposals'
import { mockShortlist } from '@/shared/mocks/shortlist'

function persist() {
  persistShortlist()
}

export const shortlistApi = {
  async getAll(): Promise<ShortlistItem[]> {
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
    const index = mockShortlist.findIndex((item) => item.id === id)
    if (index < 0) throw new Error('Запись shortlist не найдена')
    mockShortlist.splice(index, 1)
    persist()
    await delay()
  },

  async updateNote(id: string, note: string): Promise<ShortlistItem> {
    const item = mockShortlist.find((entry) => entry.id === id)
    if (!item) throw new Error('Запись shortlist не найдена')
    item.note = note
    persist()
    await delay(80)
    return item
  },
}
