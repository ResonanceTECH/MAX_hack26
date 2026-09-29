import { describe, expect, it } from 'vitest'
import { INDUSTRIES, OPPORTUNITY_CATEGORIES } from '@/shared/constants/labels'

describe('labels: categories vs industries', () => {
  it('does not alias categories to industries', () => {
    expect(OPPORTUNITY_CATEGORIES).not.toBe(INDUSTRIES as unknown as typeof OPPORTUNITY_CATEGORIES)
  })

  it('keeps category and industry vocabularies distinct', () => {
    expect(OPPORTUNITY_CATEGORIES).toEqual(expect.arrayContaining(['Разработка ПО', 'Логистика']))
    expect(INDUSTRIES).toEqual(expect.arrayContaining(['Healthcare', 'Retail', 'IT']))
    expect(OPPORTUNITY_CATEGORIES).not.toContain('Healthcare')
    expect(INDUSTRIES).not.toContain('Разработка ПО')
    expect(INDUSTRIES).not.toContain('IT-разработка')
  })
})