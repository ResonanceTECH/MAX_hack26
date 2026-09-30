import { describe, expect, it } from 'vitest'
import { REGIONS, filterRegions } from '@/shared/constants/labels'

describe('filterRegions', () => {
  it('matches substring case-insensitively', () => {
    expect(filterRegions('моск')).toEqual(expect.arrayContaining(['Москва', 'Московская область']))
    expect(filterRegions('СПБ')).toEqual([])
    expect(filterRegions('петер')).toEqual(['Санкт-Петербург'])
  })

  it('treats ё as е', () => {
    expect(filterRegions('воронеж')).toContain('Воронеж')
  })

  it('returns full list for empty query', () => {
    expect(filterRegions('')).toEqual([...REGIONS])
  })

  it('includes cities that were missing from the old short FE list', () => {
    expect(REGIONS).toEqual(expect.arrayContaining(['Ростов-на-Дону', 'Калининград', 'Владивосток']))
  })
})
