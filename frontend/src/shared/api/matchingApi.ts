import type { Match } from '@/entities/match'
import { delay } from '@/shared/lib/delay'
import { getMatchForCompany, getMatchesByOpportunity, mockMatches } from '@/shared/mocks'

export const matchingApi = {
  async getByOpportunity(opportunityId: string): Promise<Match[]> {
    await delay()
    return getMatchesByOpportunity(opportunityId)
  },

  async getForCompany(opportunityId: string, companyId: string): Promise<Match | null> {
    await delay()
    return getMatchForCompany(opportunityId, companyId) ?? null
  },

  async getAll(): Promise<Match[]> {
    await delay()
    return mockMatches
  },
}
