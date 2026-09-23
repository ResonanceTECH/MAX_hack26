import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FilterDrawer } from '@/shared/ui/FilterDrawer'
import { renderWithProviders } from '@/test/render'

describe('FilterDrawer', () => {
  it('calls reset and apply, and closes from the icon button', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onReset = vi.fn()
    const onApply = vi.fn()
    renderWithProviders(
      <FilterDrawer open onClose={onClose} onReset={onReset} onApply={onApply} title="Фильтры">
        <label>
          Регион
          <input />
        </label>
      </FilterDrawer>,
    )
    expect(screen.getByRole('heading', { name: 'Фильтры' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Сбросить' }))
    expect(onReset).toHaveBeenCalledOnce()
    await user.click(screen.getByRole('button', { name: 'Применить' }))
    expect(onApply).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Закрыть фильтры' }))
    expect(onClose).toHaveBeenCalled()
  })
})
