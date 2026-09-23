import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OpportunitiesPage } from '@/pages/OpportunitiesPage/OpportunitiesPage'
import { CompaniesPage } from '@/pages/CompaniesPage/CompaniesPage'
import { ProposalsPage } from '@/pages/ProposalsPage/ProposalsPage'
import { NotificationsPage } from '@/pages/NotificationsPage/NotificationsPage'
import { useNotificationsStore } from '@/features/notifications/model/notificationsStore'
import { renderRouted, renderWithProviders } from '@/test/render'

const opportunityQuery = vi.hoisted(() => ({
  current: {
    data: [] as unknown[],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  },
}))

const companyQuery = vi.hoisted(() => ({
  current: {
    data: [] as unknown[],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  },
}))

const proposalQuery = vi.hoisted(() => ({
  current: {
    data: [] as unknown[],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  },
}))

const opportunityDetail = vi.hoisted(() => ({
  current: {
    data: { id: 'opp-brand-video', title: 'Видеопродакшн для B2B-кампании' },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  },
}))

vi.mock('@/entities/opportunity/api/queries', () => ({
  useOpportunities: () => opportunityQuery.current,
  useOpportunity: () => opportunityDetail.current,
  useMyOpportunities: () => opportunityQuery.current,
  useRecommendedOpportunities: () => opportunityQuery.current,
  opportunityKeys: { all: ['opportunities'], mine: () => ['opportunities'] },
}))

vi.mock('@/entities/company/api/queries', () => ({
  useCompanies: () => companyQuery.current,
  useCompany: () => companyQuery.current,
}))

vi.mock('@/entities/proposal/api/queries', () => ({
  useProposals: () => proposalQuery.current,
  useProposal: () => proposalQuery.current,
  useMyProposals: () => proposalQuery.current,
  proposalKeys: {
    all: ['proposals'],
    byOpportunity: (id: string) => ['proposals', id],
    detail: (id: string) => ['proposals', id],
    mine: (id: string) => ['proposals', id],
  },
}))

vi.mock('@/entities/match/api/queries', () => ({
  useMatches: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }),
  useMatch: () => ({ data: null, isLoading: false, isError: false, refetch: vi.fn() }),
}))

describe('async states', () => {
  beforeEach(() => {
    opportunityQuery.current = {
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }
    companyQuery.current = {
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }
    proposalQuery.current = {
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }
    opportunityDetail.current = {
      data: { id: 'opp-brand-video', title: 'Видеопродакшн для B2B-кампании' },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }
  })

  it('[OPP-15] opportunities error state is explicit', () => {
    opportunityQuery.current.isError = true
    renderWithProviders(<OpportunitiesPage />)
    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось загрузить данные')
  })

  it('[OPP-16] opportunities retry calls refetch', async () => {
    const user = userEvent.setup()
    opportunityQuery.current.isError = true
    renderWithProviders(<OpportunitiesPage />)
    await user.click(screen.getByRole('button', { name: 'Повторить' }))
    expect(opportunityQuery.current.refetch).toHaveBeenCalled()
  })

  it('opportunities loading is announced', () => {
    opportunityQuery.current.isLoading = true
    renderWithProviders(<OpportunitiesPage />)
    expect(screen.getByLabelText('Загрузка')).toBeInTheDocument()
  })

  it('companies loading, empty, error, and retry', async () => {
    const user = userEvent.setup()
    companyQuery.current.isLoading = true
    const loading = renderWithProviders(<CompaniesPage />)
    expect(screen.getByLabelText('Загрузка')).toBeInTheDocument()
    loading.unmount()

    companyQuery.current.isLoading = false
    const empty = renderWithProviders(<CompaniesPage />)
    expect(screen.getByText('Компании не найдены')).toBeInTheDocument()
    empty.unmount()

    companyQuery.current.isError = true
    renderWithProviders(<CompaniesPage />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Повторить' }))
    expect(companyQuery.current.refetch).toHaveBeenCalled()
  })

  it('proposals loading and retry', async () => {
    const user = userEvent.setup()
    proposalQuery.current.isLoading = true
    const loading = renderRouted(
      <ProposalsPage />,
      '/opportunities/opp-brand-video/proposals',
      '/opportunities/:id/proposals',
    )
    expect(screen.getByLabelText('Загрузка')).toBeInTheDocument()
    loading.unmount()

    proposalQuery.current.isLoading = false
    proposalQuery.current.isError = true
    renderRouted(
      <ProposalsPage />,
      '/opportunities/opp-brand-video/proposals',
      '/opportunities/:id/proposals',
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Повторить' }))
    expect(proposalQuery.current.refetch).toHaveBeenCalled()
  })

  it('[PROP-12] proposals error state is explicit', () => {
    proposalQuery.current.isError = true
    renderRouted(
      <ProposalsPage />,
      '/opportunities/opp-brand-video/proposals',
      '/opportunities/:id/proposals',
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось загрузить данные')
  })

  it('notifications loading, empty, and error', () => {
    const fetchAll = vi.fn(async () => undefined)
    useNotificationsStore.setState({ items: [], isLoading: true, error: null, fetchAll })
    const loading = renderWithProviders(<NotificationsPage />)
    expect(screen.getByLabelText('Загрузка')).toBeInTheDocument()
    loading.unmount()

    useNotificationsStore.setState({ items: [], isLoading: false, error: null, fetchAll })
    const empty = renderWithProviders(<NotificationsPage />)
    expect(screen.getByText('Нет уведомлений')).toBeInTheDocument()
    empty.unmount()

    useNotificationsStore.setState({
      items: [],
      isLoading: false,
      error: 'Ошибка загрузки',
      fetchAll,
    })
    renderWithProviders(<NotificationsPage />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
