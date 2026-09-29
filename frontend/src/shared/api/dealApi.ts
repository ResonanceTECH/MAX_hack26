import type { Deal } from '@/entities/deal'
import { apiClient } from '@/shared/api/apiClient'
import { isReal } from '@/shared/api/apiCapabilities'
import type { DealDto, DealTermsDto } from '@/shared/api/dto/backend'
import { toApiError } from '@/shared/api/errors'
import { mapDealDtoToModel } from '@/shared/api/mappers/dealMapper'
import { delay } from '@/shared/lib/delay'
import { persistDeals } from '@/shared/mocks/hydrateMocks'
import { getDealById, mockDeals } from '@/shared/mocks'

export type FixDealTermsInput = {
  termsSummary: string
  agreedPrice?: number | null
  agreedTermDays?: number | null
}

export const dealApi = {
  async getAll(): Promise<Deal[]> {
    if (isReal('deals')) {
      try {
        const { data } = await apiClient.get<DealDto[]>('/deals')
        return data.map(mapDealDtoToModel).sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
      } catch (error) {
        throw toApiError(error)
      }
    }
    await delay()
    return [...mockDeals].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
  },

  async getById(id: string): Promise<Deal> {
    if (isReal('deals')) {
      try {
        const { data } = await apiClient.get<DealDto>(`/deals/${id}`)
        return mapDealDtoToModel(data)
      } catch (error) {
        throw toApiError(error)
      }
    }
    await delay()
    const deal = getDealById(id)
    if (!deal) throw new Error('Сделка не найдена')
    return {
      ...deal,
      files: deal.files ?? [],
      termsSummary: deal.termsSummary ?? null,
      agreedPrice: deal.agreedPrice ?? null,
      agreedTermDays: deal.agreedTermDays ?? null,
      events: [...deal.events].sort((a, b) => +new Date(a.date) - +new Date(b.date)),
    }
  },

  async fixTerms(dealId: string, input: FixDealTermsInput): Promise<Deal> {
    const summary = input.termsSummary.trim()
    if (summary.length < 3) throw new Error('Опишите согласованные условия')

    if (isReal('deals')) {
      try {
        const body: DealTermsDto = {
          terms_summary: summary,
          agreed_price: input.agreedPrice ?? null,
          agreed_term_days: input.agreedTermDays ?? null,
        }
        const { data } = await apiClient.post<DealDto>(`/deals/${dealId}/terms`, body)
        return mapDealDtoToModel(data)
      } catch (error) {
        throw toApiError(error)
      }
    }

    await delay()
    const deal = getDealById(dealId)
    if (!deal) throw new Error('Сделка не найдена')
    const now = new Date().toISOString()
    deal.termsSummary = summary
    deal.agreedPrice = input.agreedPrice ?? deal.price
    deal.agreedTermDays = input.agreedTermDays ?? deal.durationDays
    if (deal.agreedPrice != null) deal.price = deal.agreedPrice
    if (deal.agreedTermDays != null) deal.durationDays = deal.agreedTermDays
    deal.status = 'agreement'
    deal.nextAction = 'Условия зафиксированы — загрузите договор во вкладке «Файлы»'
    deal.lastAction = 'Условия зафиксированы'
    deal.updatedAt = now
    deal.events = [
      ...deal.events,
      {
        id: `ev-terms-${Date.now()}`,
        date: now,
        title: 'Условия зафиксированы',
        description: summary,
        type: 'status',
      },
    ]
    persistDeals()
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
    if (isReal('deals')) {
      if (!params.proposalId) {
        throw new Error('Для создания сделки нужен proposalId')
      }
      try {
        const { data } = await apiClient.post<DealDto>('/deals', {
          opportunity_id: Number(params.opportunityId),
          proposal_id: Number(params.proposalId),
        })
        return mapDealDtoToModel(data)
      } catch (error) {
        throw toApiError(error)
      }
    }
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
        termsSummary: existing.termsSummary ?? null,
        agreedPrice: existing.agreedPrice ?? null,
        agreedTermDays: existing.agreedTermDays ?? null,
        events: [...existing.events].sort((a, b) => +new Date(a.date) - +new Date(b.date)),
      }
    }

    const deal: Deal = {
      id: `deal-${Date.now()}`,
      ...params,
      status: 'negotiation',
      contactName: 'Анна Смирнова',
      nextAction: 'Откройте «Обзор» и зафиксируйте условия',
      lastAction: 'Начаты переговоры',
      updatedAt: new Date().toISOString(),
      files: [],
      termsSummary: null,
      agreedPrice: null,
      agreedTermDays: null,
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
