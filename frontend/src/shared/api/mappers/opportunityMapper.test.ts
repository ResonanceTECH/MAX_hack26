import { describe, expect, it } from 'vitest'
import { mapRequestDtoToOpportunity } from '@/shared/api/mappers/opportunityMapper'
import type { RequestDto } from '@/shared/api/dto/backend'

const baseDto: RequestDto = {
  id: 4,
  company_id: 1,
  company_name: 'WebForge',
  title: 'Test',
  description_raw: 'desc',
  category: 'IT-разработка',
  subcategory: null,
  requirements: ['React', 'react', 'TypeScript'],
  required_certificates: ['React', 'ISO'],
  budget_min: null,
  budget_max: null,
  deadline_days: null,
  regions: ['Москва'],
  proposals_deadline_days: 14,
  status: 'published',
  created_at: '2026-09-01T00:00:00.000Z',
  published_at: null,
  expires_at: null,
  proposals_count: 0,
  match_id: null,
  match_score: null,
  match_count: 0,
  days_left: null,
}

describe('mapRequestDtoToOpportunity requirements', () => {
  it('does not mirror requirements into both skills and technologies', () => {
    const opp = mapRequestDtoToOpportunity(baseDto)
    expect(opp.technologies).toEqual(['React', 'TypeScript'])
    expect(opp.skills).toEqual([])
    expect(opp.requiredRequirements).toEqual(['React', 'TypeScript'])
    expect(opp.desiredRequirements).toEqual(['ISO'])
  })
})
