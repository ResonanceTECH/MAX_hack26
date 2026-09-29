import { describe, expect, it } from 'vitest'
import {
  normalizeBudgetAmountToken,
  opportunityFormSchema,
  parseBudgetFromText,
  parseOpportunityText,
} from '@/features/opportunity-create/lib/parseOpportunityText'

const valid = {
  title: 'CRM для клиник',
  description: 'Нужна CRM с записью пациентов и интеграцией с 1С для сети.',
  type: 'service',
  category: 'Разработка ПО',
  subcategory: '',
  industries: ['Healthcare'],
  skills: [],
  technologies: ['React'],
  budgetMin: 100,
  budgetMax: 500,
  currency: 'RUB',
  region: 'Москва',
  remoteAllowed: true,
  proposalDeadline: '2026-10-20',
  executionDeadline: null,
}

describe('opportunity validation and parser', () => {
  it('rejects empty title, short description, missing category, industries, region, deadline', () => {
    const result = opportunityFormSchema.safeParse({
      ...valid,
      title: '',
      description: 'мало',
      category: '',
      industries: [],
      region: '',
      proposalDeadline: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const fields = result.error.issues.map((issue) => issue.path[0])
      expect(fields).toEqual(
        expect.arrayContaining([
          'title',
          'description',
          'category',
          'industries',
          'region',
          'proposalDeadline',
        ]),
      )
    }
  })

  it('accepts a complete payload; budget order and past dates are not schema rules', () => {
    expect(opportunityFormSchema.safeParse(valid).success).toBe(true)
    expect(
      opportunityFormSchema.safeParse({ ...valid, budgetMin: 900, budgetMax: 100 }).success,
    ).toBe(true)
    expect(
      opportunityFormSchema.safeParse({ ...valid, proposalDeadline: '2020-01-01' }).success,
    ).toBe(true)
  })

  it('parses category, industry, budget, and technologies from free text', async () => {
    const draft = await parseOpportunityText(
      'Нужен подрядчик на разработку CRM для медицинской компании. Бюджет до 500 тысяч. React, интеграция с 1С.',
    )
    expect(draft.category).toBe('Разработка ПО')
    expect(draft.industries).toContain('Healthcare')
    expect(draft.technologies).toEqual(expect.arrayContaining(['React', '1С']))
    expect(draft.budgetMax).toBe(500000)
  })

  it('keeps zeros in budget amounts and ignores 1С digits', async () => {
    expect(normalizeBudgetAmountToken('100000')).toBe(100000)
    expect(normalizeBudgetAmountToken('100 000')).toBe(100000)
    expect(normalizeBudgetAmountToken('100.000')).toBe(100000)

    expect(parseBudgetFromText('Бюджет 100000')).toBe(100000)
    expect(parseBudgetFromText('Бюджет 100 000')).toBe(100000)
    expect(parseBudgetFromText('Бюджет до 100 тыс')).toBe(100000)
    expect(
      parseBudgetFromText(
        'Нужна CRM с интеграцией с 1С для сети клиник. Бюджет до 100000 рублей.',
      ),
    ).toBe(100000)
    expect(parseBudgetFromText('Нужна CRM с интеграцией с 1С для сети клиник.')).toBeNull()

    const draft = await parseOpportunityText(
      'Нужна CRM с интеграцией с 1С. Бюджет 100000. React.',
    )
    expect(draft.budgetMax).toBe(100000)
    expect(draft.budgetMin).toBe(70000)
  })
})
