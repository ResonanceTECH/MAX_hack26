import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import { describe, expect, it } from 'vitest'
import { theme } from '@/app/theme/theme'
import { StatusChip } from '@/shared/ui/StatusChip'

describe('StatusChip', () => {
  it('[A11Y-07] status is exposed as text', () => {
    render(
      <ThemeProvider theme={theme}>
        <StatusChip status="submitted" kind="proposal" />
      </ThemeProvider>,
    )
    expect(screen.getByText('Отправлено')).toBeInTheDocument()
  })

  it('maps opportunity and deal statuses to words', () => {
    render(
      <ThemeProvider theme={theme}>
        <>
          <StatusChip status="expired" />
          <StatusChip status="negotiation" kind="deal" />
        </>
      </ThemeProvider>,
    )
    expect(screen.getByText('Истёк')).toBeInTheDocument()
    expect(screen.getByText('Переговоры')).toBeInTheDocument()
  })
})
