import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { FavoriteButton } from '@/shared/ui/FavoriteButton'
import { favoriteApi } from '@/shared/api/favoriteApi'
import { renderWithProviders } from '@/test/render'

const targetId = 'opp-audit-favorite'

describe('FavoriteButton', () => {
  afterEach(async () => {
    if (await favoriteApi.isFavorite('opportunity', targetId)) {
      await favoriteApi.toggle('opportunity', targetId)
    }
  })

  it('toggles saved state and exposes it to assistive tech', async () => {
    const user = userEvent.setup()
    renderWithProviders(<FavoriteButton type="opportunity" targetId={targetId} />)
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
})
