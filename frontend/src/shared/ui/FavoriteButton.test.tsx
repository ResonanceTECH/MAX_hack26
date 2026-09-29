import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { FavoriteButton } from '@/shared/ui/FavoriteButton'
import { favoriteApi } from '@/shared/api/favoriteApi'
import { renderWithProviders } from '@/test/render'

const opportunityId = 'opp-audit-favorite'
const companyId = 'company-techflow'

describe('FavoriteButton', () => {
  afterEach(async () => {
    if (await favoriteApi.isFavorite('opportunity', opportunityId)) {
      await favoriteApi.toggle('opportunity', opportunityId)
    }
    // company-techflow is seeded as favorite — restore if test removed it
    if (!(await favoriteApi.isFavorite('company', companyId))) {
      await favoriteApi.toggle('company', companyId)
    }
  })

  it('toggles saved state and exposes it to assistive tech', async () => {
    const user = userEvent.setup()
    renderWithProviders(<FavoriteButton type="opportunity" targetId={opportunityId} />)
    const button = await screen.findByRole('button', { name: 'Сохранить' })
    expect(button).toHaveAttribute('aria-pressed', 'false')
    await user.click(button)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Убрать из избранного' })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
    })
  })

  it('renders company already in favorites as painted/active', async () => {
    renderWithProviders(<FavoriteButton type="company" targetId={companyId} />)
    const button = await screen.findByRole('button', { name: 'Убрать из избранного' })
    expect(button).toHaveAttribute('aria-pressed', 'true')
  })
})
