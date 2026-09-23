import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { CreateProposalPage } from '@/pages/CreateProposalPage/CreateProposalPage'
import { getProposalById, mockProposals } from '@/shared/mocks'
import { renderRouted } from '@/test/render'

describe('CreateProposalForm', () => {
  afterEach(() => {
    for (let i = mockProposals.length - 1; i >= 0; i -= 1) {
      if (mockProposals[i]?.id.startsWith('prop-') && !getProposalById(mockProposals[i]!.id)) {
        mockProposals.splice(i, 1)
      }
    }
    const extra = mockProposals.filter((p) => !/^prop-[1-8]$/.test(p.id))
    for (const item of extra) {
      const index = mockProposals.indexOf(item)
      if (index >= 0) mockProposals.splice(index, 1)
    }
  })

  it('renders the response form for a foreign request', async () => {
    renderRouted(
      <CreateProposalPage />,
      '/opportunities/opp-mobile-app/propose',
      '/opportunities/:id/propose',
    )
    expect(await screen.findByRole('heading', { name: 'Отклик на запрос' })).toBeInTheDocument()
    expect(screen.getByLabelText(/Стоимость/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Отправить предложение' })).toBeEnabled()
  })

  it('blocks empty, zero, and negative price, short text, and empty duration', async () => {
    const user = userEvent.setup()
    renderRouted(
      <CreateProposalPage />,
      '/opportunities/opp-wms-retail/propose',
      '/opportunities/:id/propose',
    )
    await screen.findByLabelText(/Стоимость/)
    await user.click(screen.getByRole('button', { name: 'Отправить предложение' }))
    expect(await screen.findByText('Укажите сумму больше 0')).toBeInTheDocument()
    expect(screen.getByText('Укажите срок в днях')).toBeInTheDocument()
    expect(screen.getByText('Минимум 10 символов')).toBeInTheDocument()
    expect(screen.getByLabelText(/Стоимость/)).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText(/Стоимость/)).toHaveAccessibleDescription(/больше 0/)

    await user.clear(screen.getByLabelText(/Стоимость/))
    await user.type(screen.getByLabelText(/Стоимость/), '0')
    await user.click(screen.getByRole('button', { name: 'Отправить предложение' }))
    expect(await screen.findByText('Укажите сумму больше 0')).toBeInTheDocument()

    await user.clear(screen.getByLabelText(/Стоимость/))
    await user.type(screen.getByLabelText(/Стоимость/), '-10')
    await user.click(screen.getByRole('button', { name: 'Отправить предложение' }))
    expect(screen.getByText('Укажите сумму больше 0')).toBeInTheDocument()
  })
})
