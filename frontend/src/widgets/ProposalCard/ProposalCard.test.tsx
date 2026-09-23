import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { getProposalById } from '@/shared/mocks'
import { ProposalCard } from '@/widgets/ProposalCard/ProposalCard'
import { renderWithProviders } from '@/test/render'

describe('ProposalCard', () => {
  it('renders proposal data and fires shortlist and reject', async () => {
    const user = userEvent.setup()
    const proposal = getProposalById('prop-2')!
    const onShortlist = vi.fn()
    const onReject = vi.fn()
    renderWithProviders(
      <ProposalCard proposal={proposal} onShortlist={onShortlist} onReject={onReject} />,
    )
    expect(screen.getByRole('heading', { name: 'TechFlow' })).toBeInTheDocument()
    expect(screen.getByText('Просмотрено')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Подробнее' })).toHaveAttribute(
      'href',
      '/proposals/prop-2',
    )
    await user.click(screen.getByRole('button', { name: 'В shortlist' }))
    await user.click(screen.getByRole('button', { name: 'Отклонить' }))
    expect(onShortlist).toHaveBeenCalledWith('prop-2')
    expect(onReject).toHaveBeenCalledWith('prop-2')
  })
})
