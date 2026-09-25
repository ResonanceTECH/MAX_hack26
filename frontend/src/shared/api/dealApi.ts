import type { Deal } from '@/entities/deal'
import { delay } from '@/shared/lib/delay'
import { persistDeals } from '@/shared/mocks/hydrateMocks'
import { getDealById, mockDeals } from '@/shared/mocks'

export const dealApi = {
  async getAll(): Promise<Deal[]> {
    await delay()
    return [...mockDeals].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
  },

  async getById(id: string): Promise<Deal> {
    await delay()
    const deal = getDealById(id)
    if (!deal) throw new Error('Сделка не найдена')
    return {
      ...deal,
      events: [...deal.events].sort((a, b) => +new Date(a.date) - +new Date(b.date)),
    }
  },

  async startFromShortlist(params: {
    opportunityId: string
    opportunityTitle: string
    companyId: string
    companyName: string
    proposalId: string | null
    price: number | null
    currency: string
    durationDays: number | null
  }): Promise<Deal> {
    await delay()
    const existing = mockDeals.find(
      (d) =>
        d.opportunityId === params.opportunityId &&
        d.companyId === params.companyId &&
        (params.proposalId == null || d.proposalId === params.proposalId) &&
        d.status === 'negotiation',
    )
    if (existing) {
      return {
        ...existing,
        events: [...existing.events].sort((a, b) => +new Date(a.date) - +new Date(b.date)),
      }
    }

    const deal: Deal = {
      id: `deal-${Date.now()}`,
      ...params,
      status: 'negotiation',
      contactName: 'Анна Смирнова',
      nextAction: 'Назначить созвон',
      lastAction: 'Начаты переговоры',
      updatedAt: new Date().toISOString(),
      events: [
        {
          id: `ev-${Date.now()}`,
          date: new Date().toISOString(),
          title: 'Начаты переговоры',
          description: `Переговоры с ${params.companyName} по запросу «${params.opportunityTitle}»`,
          type: 'negotiation',
        },
      ],
    }
    mockDeals.unshift(deal)
    persistDeals()
    return deal
  },
}
