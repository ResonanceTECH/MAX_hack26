import type { Company } from '@/entities/company/model/types'

export const OPPORTUNITY_TYPES = {
  SERVICE: 'service',
  SUPPLY: 'supply',
  PARTNERSHIP: 'partnership',
  PRODUCTION: 'production',
  DISTRIBUTION: 'distribution',
  PILOT: 'pilot',
} as const

export type OpportunityType = (typeof OPPORTUNITY_TYPES)[keyof typeof OPPORTUNITY_TYPES]

export const OPPORTUNITY_STATUSES = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  COLLECTING_PROPOSALS: 'collecting_proposals',
  SHORTLISTING: 'shortlisting',
  NEGOTIATION: 'negotiation',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
} as const

export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[keyof typeof OPPORTUNITY_STATUSES]

export interface Opportunity {
  id: string
  title: string
  description: string
  type: OpportunityType
  company: Company
  category: string
  subcategory: string
  industries: string[]
  skills: string[]
  technologies: string[]
  requiredRequirements: string[]
  desiredRequirements: string[]
  budgetMin: number | null
  budgetMax: number | null
  currency: string
  region: string
  remoteAllowed: boolean
  proposalDeadline: string
  executionDeadline: string | null
  status: OpportunityStatus
  createdAt: string
  proposalsCount: number
  newProposalsCount?: number
  matchScore?: number | null
}
