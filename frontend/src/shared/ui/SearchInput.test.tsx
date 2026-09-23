import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { SearchInput } from '@/shared/ui/SearchInput'
import { renderWithProviders } from '@/test/render'

function Harness() {
  const [value, setValue] = useState('')
  return <SearchInput label="Поиск возможностей" value={value} onChange={setValue} />
}

describe('SearchInput', () => {
  it('[A11Y-02] has a label and reports typed text', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />)
    const input = screen.getByRole('textbox', { name: 'Поиск возможностей' })
    await user.type(input, 'CRM')
    expect(input).toHaveValue('CRM')
  })
})
