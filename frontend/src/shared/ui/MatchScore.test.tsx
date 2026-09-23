import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { MatchScore } from '@/shared/ui/MatchScore'
import { renderWithProviders } from '@/test/render'

const reasons = [
  {
    label: 'Есть опыт Healthcare',
    type: 'industry' as const,
    matched: true,
    description: 'В портфолио 6 проектов для медицинских компаний',
  },
]

describe('MatchScore', () => {
  it('[MATCH-01] renders the score as text', () => {
    renderWithProviders(
      <MatchScore score={94} reasons={reasons} missingRequirements={['ISO 27001']} />,
    )
    expect(screen.getByRole('button', { name: /Match Score 94 процентов/ })).toHaveTextContent(
      '94%',
    )
  })

  it('[MATCH-02] keeps the score in the visible name', () => {
    renderWithProviders(<MatchScore score={94} />)
    const button = screen.getByRole('button', { name: /94/ })
    const value = Number(button.textContent?.replace(/\D/g, ''))
    expect(value).toBeGreaterThanOrEqual(0)
    expect(value).toBeLessThanOrEqual(100)
  })

  it('[A11Y-06] explanation is available as text, not only color', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <MatchScore
        score={94}
        reasons={reasons}
        missingRequirements={['Отсутствует требуемый сертификат ISO 27001']}
      />,
    )
    await user.click(screen.getByRole('button', { name: /Match Score 94/ }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Есть опыт Healthcare')
    expect(screen.getByRole('dialog')).toHaveTextContent('ISO 27001')
    expect(screen.getByRole('dialog')).toHaveTextContent('94%')
  })
})
