export interface DealEvent {
  id: string
  date: string
  title: string
  description: string
  type: 'proposal' | 'shortlist' | 'negotiation' | 'message' | 'status'
}

export const DEAL_STATUSES = {
  NEGOTIATION: 'negotiation',
  AGREEMENT: 'agreement',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
} as const

export type DealStatus = (typeof DEAL_STATUSES)[keyof typeof DEAL_STATUSES]

export interface Deal {
  id: string
  opportunityId: string
  opportunityTitle: string
  companyId: string
  companyName: string
  proposalId: string | null
  price: number | null
  currency: string
  durationDays: number | null
  status: DealStatus
  contactName: string
  nextAction: string
  lastAction: string
  updatedAt: string
  events: DealEvent[]
}
