import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { getMatchForCompany, getOpportunityById } from '@/shared/mocks'
import { OpportunityCard } from '@/widgets/OpportunityCard/OpportunityCard'
import { renderWithProviders } from '@/test/render'

const opportunity = getOpportunityById('opp-crm-clinics')!
const match = getMatchForCompany('opp-crm-clinics', 'company-digital-lab')!

describe('OpportunityCard', () => {
  it('renders score, opens why-it-fits, and dismisses', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    renderWithProviders(
      <OpportunityCard opportunity={opportunity} match={match} onDismiss={onDismiss} />,
    )
    expect(screen.getByRole('heading', { name: opportunity.title })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Подробнее' })).toHaveAttribute(
      'href',
      '/opportunities/opp-crm-clinics',
    )
    await user.click(screen.getByRole('button', { name: 'Не интересно' }))
    expect(onDismiss).toHaveBeenCalledOnce()
    await user.click(screen.getByRole('button', { name: /Match Score 94/ }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Есть опыт Healthcare')
  })
})
