import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { OpportunityDetailsPage } from '@/pages/OpportunityDetailsPage/OpportunityDetailsPage'
import { getOpportunityById, mockOpportunities } from '@/shared/mocks'
import { loginAsBusinessUser, renderRouted } from '@/test/render'

function injectStatus(id: string, status: 'expired' | 'closed') {
  const source = getOpportunityById('opp-mobile-app')
  if (!source) throw new Error('seed opportunity missing')
  mockOpportunities.unshift({ ...source, id, status })
}

describe('OpportunityDetails guards', () => {
  afterEach(() => {
    for (const id of ['opp-expired-audit', 'opp-closed-audit']) {
      const index = mockOpportunities.findIndex((item) => item.id === id)
      if (index >= 0) mockOpportunities.splice(index, 1)
    }
  })

  it('[OD-17] expired request cannot be answered', async () => {
    loginAsBusinessUser()
    injectStatus('opp-expired-audit', 'expired')
    renderRouted(<OpportunityDetailsPage />, '/opportunities/opp-expired-audit', '/opportunities/:id')
    expect(await screen.findByText('Истёк')).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Предложить решение' }),
      'FAIL: на статус EXPIRED можно нажать «Предложить решение»',
    ).not.toBeInTheDocument()
  })

  it('[OD-18] closed request cannot be answered', async () => {
    loginAsBusinessUser()
    injectStatus('opp-closed-audit', 'closed')
    renderRouted(<OpportunityDetailsPage />, '/opportunities/opp-closed-audit', '/opportunities/:id')
    expect(await screen.findByText('Закрыт')).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Предложить решение' }),
      'FAIL: на статус CLOSED можно нажать «Предложить решение»',
    ).not.toBeInTheDocument()
  })
})
