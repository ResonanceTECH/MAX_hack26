import type { Match, MatchReason, MatchReasonType } from '@/entities/match'
import { MATCH_REASON_TYPES, MATCH_STATUSES } from '@/entities/match'
import type { CriterionDto, FeedItemDto, MatchDto } from '@/shared/api/dto/backend'

function criterionType(key: string): MatchReasonType {
  const k = key.toLowerCase()
  if (k.includes('budget') || k.includes('бюджет')) return MATCH_REASON_TYPES.BUDGET
  if (k.includes('region') || k.includes('регион')) return MATCH_REASON_TYPES.REGION
  if (k.includes('tech') || k.includes('stack') || k.includes('competenc')) return MATCH_REASON_TYPES.TECHNOLOGY
  if (k.includes('case') || k.includes('кейс')) return MATCH_REASON_TYPES.CASES
  if (k.includes('industr') || k.includes('отрасл') || k.includes('categor')) return MATCH_REASON_TYPES.INDUSTRY
  if (k.includes('rating') || k.includes('рейтинг')) return MATCH_REASON_TYPES.RATING
  return MATCH_REASON_TYPES.OTHER
}

function mapCriteria(criteria: CriterionDto[]): { reasons: MatchReason[]; missing: string[] } {
  const reasons: MatchReason[] = []
  const missing: string[] = []
  for (const c of criteria ?? []) {
    reasons.push({
      label: c.label,
      type: criterionType(c.key),
      matched: c.passed,
      description: c.detail,
    })
    if (!c.passed) missing.push(c.detail || c.label)
  }
  return { reasons, missing }
}

export function mapMatchDtoToModel(dto: MatchDto, opportunityId: string): Match {
  const { reasons, missing } = mapCriteria(dto.criteria)
  return {
    id: String(dto.id),
    opportunityId,
    companyId: String(dto.company_id),
    score: dto.score,
    reasons,
    missingRequirements: missing.slice(0, 5),
    status: MATCH_STATUSES.SUGGESTED,
  }
}

export function mapFeedItemToMatch(item: FeedItemDto, companyId?: string): Match {
  return mapMatchDtoToModel(
    {
      id: item.match_id,
      company_id: companyId ? Number(companyId) || 0 : 0,
      company_name: '',
      score: item.score,
      criteria: item.criteria,
      feedback: item.feedback,
    },
    String(item.request.id),
  )
}
