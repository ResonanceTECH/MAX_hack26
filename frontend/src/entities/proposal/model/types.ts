import type { Company } from '@/entities/company/model/types'

export const PROPOSAL_STATUSES = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  VIEWED: 'viewed',
  SHORTLISTED: 'shortlisted',
  NEGOTIATION: 'negotiation',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
} as const

export type ProposalStatus = (typeof PROPOSAL_STATUSES)[keyof typeof PROPOSAL_STATUSES]

export interface Proposal {
  id: string
  opportunityId: string
  company: Company
  price: number
  currency: string
  durationDays: number
  description: string
  included: string[]
  excluded: string[]
  cases: string[]
  status: ProposalStatus
  createdAt: string
}
