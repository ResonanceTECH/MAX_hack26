import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import { describe, expect, it } from 'vitest'
import { theme } from '@/app/theme/theme'
import { MatchExplanation } from '@/shared/ui/MatchExplanation'

describe('MatchExplanation', () => {
  it('[MATCH-03] shows reasons and missing requirements for this entity', () => {
    render(
      <ThemeProvider theme={theme}>
        <MatchExplanation
          score={94}
          title="Почему подходит вам"
          reasons={[
            {
              label: 'Есть опыт Healthcare',
              type: 'industry',
              matched: true,
              description: 'Медицинские проекты',
            },
          ]}
          missingRequirements={['Отсутствует требуемый сертификат ISO 27001']}
        />
      </ThemeProvider>,
    )
    expect(screen.getByText('Почему подходит вам')).toBeInTheDocument()
    expect(screen.getByLabelText('94% соответствия')).toBeInTheDocument()
    expect(screen.getByText(/Есть опыт Healthcare/)).toBeInTheDocument()
    expect(screen.getByText(/ISO 27001/)).toBeInTheDocument()
    expect(screen.getByText('Не хватает')).toBeInTheDocument()
    expect(screen.queryByText(/Профиль FTL/)).not.toBeInTheDocument()
  })
})
