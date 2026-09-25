export type ModerationEntityType = 'company' | 'opportunity' | 'case' | 'document'

export type ModerationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'needs_changes'
  | 'blocked'

export type ModerationAction = 'approve' | 'reject' | 'request_changes' | 'block'

export interface ModerationItem {
  id: string
  type: ModerationEntityType
  entityId: string
  title: string
  submittedAt: string
  authorName: string
  companyName: string
  status: ModerationStatus
  summary: string
  payload: Record<string, string | number | boolean | null>
}

export interface ModerationDecision {
  action: ModerationAction
  reason?: string
  timestamp: string
  moderatorId: string
  moderatorName: string
}

export interface ModerationHistoryEntry {
  id: string
  moderationItemId: string
  entityType: ModerationEntityType
  entityId: string
  title: string
  companyName: string
  decision: ModerationDecision
}

export interface ModerationSummary {
  pending: number
  approvedToday: number
  rejectedToday: number
  needsChanges: number
  blocked: number
  openReports: number
}

export interface ModerationQueueFilters {
  type?: ModerationEntityType | 'all'
  status?: ModerationStatus | 'all'
  query?: string
}
