export interface ShortlistItem {
  id: string
  opportunityId: string
  companyId: string
  proposalId: string | null
  price: number | null
  currency: string
  durationDays: number | null
  matchScore: number
  note: string
}
