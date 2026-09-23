export const MATCH_REASON_TYPES = {
  INDUSTRY: 'industry',
  BUDGET: 'budget',
  TECHNOLOGY: 'technology',
  REGION: 'region',
  CASES: 'cases',
  RATING: 'rating',
  OTHER: 'other',
} as const

export type MatchReasonType = (typeof MATCH_REASON_TYPES)[keyof typeof MATCH_REASON_TYPES]

export interface MatchReason {
  label: string
  type: MatchReasonType
  matched: boolean
  description: string
}

export const MATCH_STATUSES = {
  SUGGESTED: 'suggested',
  VIEWED: 'viewed',
  CONTACTED: 'contacted',
  SHORTLISTED: 'shortlisted',
  DISMISSED: 'dismissed',
} as const

export type MatchStatus = (typeof MATCH_STATUSES)[keyof typeof MATCH_STATUSES]

export interface Match {
  id: string
  opportunityId: string
  companyId: string
  score: number
  reasons: MatchReason[]
  missingRequirements: string[]
  status: MatchStatus
}
