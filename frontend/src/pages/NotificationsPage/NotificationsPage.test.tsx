import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NotificationsPage } from '@/pages/NotificationsPage/NotificationsPage'
import { useNotificationsStore } from '@/features/notifications/model/notificationsStore'
import { mockNotifications } from '@/shared/mocks'
import { renderWithProviders } from '@/test/render'

vi.mock('@/shared/api/inviteApi', () => ({
  OPPORTUNITY_INVITE_STATUS: {
    PENDING: 'PENDING',
    ACCEPTED: 'ACCEPTED',
    DECLINED: 'DECLINED',
    EXPIRED: 'EXPIRED',
  },
  inviteApi: {
    getAll: vi.fn(async () => []),
    accept: vi.fn(),
    decline: vi.fn(),
  },
}))

const fetchAll = vi.fn(async () => undefined)

describe('Notification item', () => {
  afterEach(() => {
    useNotificationsStore.setState({
      items: [],
      isLoading: false,
      error: null,
      fetchAll: useNotificationsStore.getInitialState().fetchAll,
    })
  })

  it('renders a notification and follows its entity link', async () => {
    const user = userEvent.setup()
    const item = mockNotifications[0]!
    useNotificationsStore.setState({
      items: [{ ...item, read: false }],
      isLoading: false,
      error: null,
      fetchAll,
      markAsRead: vi.fn(async () => undefined),
    })
    renderWithProviders(
      <Routes>
        <Route path="/" element={<NotificationsPage />} />
        <Route path="/opportunities/opp-bi-dashboard" element={<h1>BI target</h1>} />
      </Routes>,
    )
    expect(screen.getByText('Новый подходящий заказ')).toBeInTheDocument()
    await user.click(screen.getByText('Новый подходящий заказ'))
    expect(await screen.findByRole('heading', { name: 'BI target' })).toBeInTheDocument()
  })

  it('[NOT-05] negotiation notification has its own type', () => {
    const negotiation = mockNotifications.find((item) => item.title === 'Начались переговоры')
    expect(negotiation, 'FAIL: нет уведомления о переговорах').toBeTruthy()
    expect(
      negotiation?.type,
      'FAIL: «Начались переговоры» записано как new_proposal, типа negotiation нет',
    ).not.toBe('new_proposal')
  })
})
