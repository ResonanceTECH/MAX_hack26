import { describe, expect, it } from 'vitest'
import {
  buildProposalSolutionText,
  mapCreateProposalToDto,
  resolveCaseRef,
  toProposalApiInt,
} from '@/shared/api/mappers/proposalMapper'

const base = {
  opportunityId: '1',
  currency: 'RUB',
  description: 'React + 1С, поэтапная сдача',
  included: ['дизайн', 'интеграция'],
  excluded: ['хостинг'],
  cases: ['Кейс CRM'],
  comment: 'да',
}

describe('mapCreateProposalToDto', () => {
  it('sends integer price/term_days and folds lists into solution_text', () => {
    const dto = mapCreateProposalToDto({
      ...base,
      price: 480_000.9,
      durationDays: 45.2,
      caseId: null,
    })
    expect(dto.price).toBe(480_000)
    expect(dto.term_days).toBe(45)
    expect(Number.isInteger(dto.price)).toBe(true)
    expect(dto.solution_text).toContain('React + 1С')
    expect(dto.solution_text).toContain('Включено: дизайн, интеграция')
    expect(dto.solution_text).toContain('Не включено: хостинг')
    expect(dto.solution_text).toContain('Кейсы: Кейс CRM')
    expect(dto.case_ref).toBeNull()
    expect(dto.comment).toBe('да')
  })

  it('never sends free-text cases as case_ref (avoids backend 422)', () => {
    // Old bug: case_ref: payload.cases[0] with "222" / "нет" →
    // «case_ref должен ссылаться на кейс вашей компании»
    const dto = mapCreateProposalToDto({
      ...base,
      price: 100_000,
      durationDays: 30,
      cases: ['222'],
      caseId: undefined,
    })
    expect(dto.case_ref).toBeNull()
  })

  it('sends case_ref only from explicit caseId', () => {
    const dto = mapCreateProposalToDto({
      ...base,
      price: 100_000,
      durationDays: 30,
      caseId: '42',
    })
    expect(dto.case_ref).toBe('42')
  })

  it('rejects non-finite / oversized price that would 422 on backend', () => {
    expect(() =>
      mapCreateProposalToDto({ ...base, price: 1e21, durationDays: 30 }),
    ).toThrow(/диапазона/)
    expect(() =>
      mapCreateProposalToDto({ ...base, price: Number.POSITIVE_INFINITY, durationDays: 30 }),
    ).toThrow(/конечное/)
  })
})

describe('resolveCaseRef', () => {
  it('accepts numeric ids only', () => {
    expect(resolveCaseRef('12')).toBe('12')
    expect(resolveCaseRef('222')).toBe('222') // id must exist on backend; we only filter format here
    expect(resolveCaseRef('нет')).toBeNull()
    expect(resolveCaseRef('CRM для клиники')).toBeNull()
    expect(resolveCaseRef('')).toBeNull()
    expect(resolveCaseRef(null)).toBeNull()
  })
})

describe('toProposalApiInt', () => {
  it('truncates floats', () => {
    expect(toProposalApiInt(99.9, { min: 1, max: 100 })).toBe(99)
  })
})

describe('buildProposalSolutionText', () => {
  it('skips empty optional blocks', () => {
    expect(
      buildProposalSolutionText({
        ...base,
        included: [],
        excluded: [],
        cases: [],
        price: 1,
        durationDays: 1,
      }),
    ).toBe('React + 1С, поэтапная сдача')
  })
})
