import { describe, expect, it } from 'vitest'
import { formatCommaList, parseCommaList } from './parseCommaList'

describe('parseCommaList', () => {
  it('parses tokens and drops empties from trailing commas', () => {
    expect(parseCommaList('React, TypeScript,')).toEqual(['React', 'TypeScript'])
    expect(parseCommaList('Instagram, TikTok, SEO')).toEqual(['Instagram', 'TikTok', 'SEO'])
    expect(parseCommaList('  ,  , ')).toEqual([])
    expect(parseCommaList('')).toEqual([])
  })
})

describe('formatCommaList', () => {
  it('joins with comma+space', () => {
    expect(formatCommaList(['React', 'TypeScript'])).toBe('React, TypeScript')
    expect(formatCommaList([])).toBe('')
  })
})
