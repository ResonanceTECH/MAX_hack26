import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CreateOpportunityPage } from '@/pages/CreateOpportunityPage/CreateOpportunityPage'
import { renderWithProviders } from '@/test/render'

const TEXT =
  'Нужен подрядчик на разработку CRM для медицинской компании. Бюджет до 500 тысяч. React, интеграция с 1С.'

describe('CreateOpportunityForm', () => {
  it('rejects a too-short description and parses a normal one', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateOpportunityPage />)
    expect(screen.getByRole('heading', { name: 'Создание запроса' })).toBeInTheDocument()
    const field = screen.getByLabelText('Описание задачи')
    await user.type(field, 'коротко')
    expect(screen.getByRole('button', { name: 'Продолжить' })).toBeDisabled()
    await user.clear(field)
    await user.type(field, TEXT)
    await user.click(screen.getByRole('button', { name: 'Продолжить' }))
    expect(await screen.findByRole('heading', { name: 'Мы поняли ваш запрос так' })).toBeInTheDocument()
    expect(screen.getByText('Разработка ПО')).toBeInTheDocument()
    expect(screen.getByText('Healthcare')).toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('1С')).toBeInTheDocument()
  })
})
