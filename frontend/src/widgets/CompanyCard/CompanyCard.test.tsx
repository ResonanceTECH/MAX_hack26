import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getCompanyById } from '@/shared/mocks'
import { CompanyCard } from '@/widgets/CompanyCard/CompanyCard'
import { renderWithProviders } from '@/test/render'

describe('CompanyCard', () => {
  it('renders name, verified state, and a details link', () => {
    const company = getCompanyById('company-techflow')!
    renderWithProviders(<CompanyCard company={company} />)
    expect(screen.getByRole('heading', { name: 'TechFlow' })).toBeInTheDocument()
    expect(screen.getByLabelText('Проверенная компания')).toBeInTheDocument()
    expect(screen.getByText('T')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Подробнее' })).toHaveAttribute(
      'href',
      '/companies/company-techflow',
    )
  })
})
