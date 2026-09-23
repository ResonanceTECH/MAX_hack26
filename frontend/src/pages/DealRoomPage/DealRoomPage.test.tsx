import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { DealRoomPage } from '@/pages/DealRoomPage/DealRoomPage'
import { mockDeals } from '@/shared/mocks'
import type { Deal } from '@/entities/deal'
import { renderRouted } from '@/test/render'

const unsorted: Deal = {
  id: 'deal-unsorted-audit',
  opportunityId: 'opp-crm-clinics',
  opportunityTitle: 'Разработка CRM для сети клиник',
  companyId: 'company-techflow',
  companyName: 'TechFlow',
  proposalId: 'prop-2',
  price: 520000,
  currency: 'RUB',
  durationDays: 75,
  status: 'negotiation',
  contactName: 'Иван',
  nextAction: 'Созвон',
  lastAction: 'Старт',
  updatedAt: '2026-09-25T14:00:00.000Z',
  events: [
    {
      id: 'late',
      date: '2026-09-25T14:00:00.000Z',
      title: 'Позднее событие',
      description: 'Позже',
      type: 'negotiation',
    },
    {
      id: 'early',
      date: '2026-09-01T10:00:00.000Z',
      title: 'Раннее событие',
      description: 'Раньше',
      type: 'proposal',
    },
  ],
}

describe('DealRoom timeline', () => {
  afterEach(() => {
    const index = mockDeals.findIndex((deal) => deal.id === unsorted.id)
    if (index >= 0) mockDeals.splice(index, 1)
  })

  it('[DEAL-10] timeline events are ordered by date', async () => {
    mockDeals.unshift(unsorted)
    const user = userEvent.setup()
    renderRouted(<DealRoomPage />, '/deals/deal-unsorted-audit', '/deals/:id')
    await screen.findByRole('tab', { name: 'История' })
    await user.click(screen.getByRole('tab', { name: 'История' }))
    const titles = screen.getAllByRole('heading', { level: 4 }).map((node) => node.textContent)
    expect(titles, 'FAIL: события timeline выводятся в порядке массива и не сортируются по дате').toEqual([
      'Раннее событие',
      'Позднее событие',
    ])
  })
})
