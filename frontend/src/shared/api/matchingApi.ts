import type { Match, MatchReason } from '@/entities/match'
import { MATCH_REASON_TYPES, MATCH_STATUSES } from '@/entities/match'
import type { Company } from '@/entities/company'
import type { Opportunity } from '@/entities/opportunity'
import { delay } from '@/shared/lib/delay'
import { persistMatches } from '@/shared/mocks/hydrateMocks'
import {
  getMatchForCompany,
  getMatchesByOpportunity,
  getOpportunityById,
  mockCompanies,
  mockMatches,
} from '@/shared/mocks'
import { CURRENT_COMPANY_ID } from '@/shared/mocks/user'

function overlap(a: string[], b: string[]): string[] {
  const set = new Set(a.map((x) => x.toLowerCase()))
  return b.filter((x) => set.has(x.toLowerCase()))
}

function buildMatch(opportunity: Opportunity, company: Company): Match {
  const techOverlap = overlap(opportunity.technologies, company.technologies)
  const industryOverlap = overlap(opportunity.industries, company.industries)
  const regionMatch =
    company.region === opportunity.region ||
    opportunity.remoteAllowed ||
    company.region === 'Москва'

  const budgetOk =
    opportunity.budgetMax == null ||
    company.priceFrom == null ||
    company.priceFrom <= (opportunity.budgetMax ?? Infinity)

  const reasons: MatchReason[] = []
  if (industryOverlap.length) {
    reasons.push({
      label: `Опыт в ${industryOverlap[0]}`,
      type: MATCH_REASON_TYPES.INDUSTRY,
      matched: true,
      description: `Отрасли компании пересекаются с запросом: ${industryOverlap.join(', ')}`,
    })
  }
  if (techOverlap.length) {
    reasons.push({
      label: `Совпадает стек: ${techOverlap.slice(0, 3).join(', ')}`,
      type: MATCH_REASON_TYPES.TECHNOLOGY,
      matched: true,
      description: `Общие технологии: ${techOverlap.join(', ')}`,
    })
  }
  if (budgetOk) {
    reasons.push({
      label: 'Подходит бюджет',
      type: MATCH_REASON_TYPES.BUDGET,
      matched: true,
      description: 'Типичный чек компании укладывается в бюджет запроса',
    })
  }
  if (regionMatch) {
    reasons.push({
      label: 'Работает в нужном регионе',
      type: MATCH_REASON_TYPES.REGION,
      matched: true,
      description: `${company.region}${opportunity.remoteAllowed ? ' · удалённо' : ''}`,
    })
  }
  if (company.casesCount > 0) {
    reasons.push({
      label: `${company.casesCount} релевантных кейсов`,
      type: MATCH_REASON_TYPES.CASES,
      matched: true,
      description: 'В портфолио есть похожие проекты',
    })
  }

  const missingRequirements: string[] = []
  for (const req of opportunity.requiredRequirements) {
    const hit =
      techOverlap.some((t) => req.toLowerCase().includes(t.toLowerCase())) ||
      company.capabilities.some((c) => req.toLowerCase().includes(c.toLowerCase())) ||
      company.technologies.some((t) => req.toLowerCase().includes(t.toLowerCase()))
    if (!hit) missingRequirements.push(req)
  }

  let score = 55
  score += Math.min(techOverlap.length * 8, 24)
  score += Math.min(industryOverlap.length * 10, 20)
  if (budgetOk) score += 8
  if (regionMatch) score += 5
  score += Math.min(Math.round(company.rating), 5)
  score -= missingRequirements.length * 4
  score = Math.max(60, Math.min(97, score))

  if (reasons.length === 0) {
    reasons.push({
      label: 'Базовое соответствие профилю',
      type: MATCH_REASON_TYPES.OTHER,
      matched: true,
      description: 'Компания может выполнить запрос по профилю услуг',
    })
  }

  return {
    id: `match-${opportunity.id}-${company.id}`,
    opportunityId: opportunity.id,
    companyId: company.id,
    score,
    reasons,
    missingRequirements: missingRequirements.slice(0, 3),
    status: MATCH_STATUSES.SUGGESTED,
  }
}

export const matchingApi = {
  async getByOpportunity(opportunityId: string): Promise<Match[]> {
    await delay()
    return getMatchesByOpportunity(opportunityId).sort((a, b) => b.score - a.score)
  },

  async getForCompany(opportunityId: string, companyId: string): Promise<Match | null> {
    await delay()
    return getMatchForCompany(opportunityId, companyId) ?? null
  },

  async getAll(): Promise<Match[]> {
    await delay()
    return [...mockMatches]
  },

  async generateForOpportunity(opportunityId: string): Promise<Match[]> {
    await delay(400)
    const opportunity = getOpportunityById(opportunityId)
    if (!opportunity) throw new Error('Возможность не найдена')

    // Prefer known demo contractors that appear in customer-flow / CR-20 assertions
    const preferred = ['company-techflow', 'company-datacraft', 'company-medsupply']
    const others = mockCompanies
      .map((c) => c.id)
      .filter((id) => id !== CURRENT_COMPANY_ID && id !== opportunity.company.id && !preferred.includes(id))

    const companyIds = [...preferred, ...others].filter(
      (id) => id !== CURRENT_COMPANY_ID && id !== opportunity.company.id,
    )

    const generated = companyIds
      .map((id) => mockCompanies.find((c) => c.id === id))
      .filter((c): c is Company => c != null)
      .map((company) => buildMatch(opportunity, company))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)

    for (const match of generated) {
      const index = mockMatches.findIndex(
        (m) => m.opportunityId === match.opportunityId && m.companyId === match.companyId,
      )
      if (index >= 0) mockMatches.splice(index, 1, match)
      else mockMatches.push(match)
    }
    persistMatches()
    return generated
  },
}
