export const MODERATION_ENTITY_TYPES = {
  COMPANY: 'company',
  OPPORTUNITY: 'opportunity',
  CASE: 'case',
  DOCUMENT: 'document',
} as const

export type ModerationEntityType =
  (typeof MODERATION_ENTITY_TYPES)[keyof typeof MODERATION_ENTITY_TYPES]

export const MODERATION_STATUS = {
  PENDING: 'PENDING',
  IN_REVIEW: 'IN_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  NEEDS_CHANGES: 'NEEDS_CHANGES',
  BLOCKED: 'BLOCKED',
  ESCALATED: 'ESCALATED',
} as const

export type ModerationStatus = (typeof MODERATION_STATUS)[keyof typeof MODERATION_STATUS]

export const MODERATION_PRIORITY = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const

export type ModerationPriority = (typeof MODERATION_PRIORITY)[keyof typeof MODERATION_PRIORITY]

export const MODERATION_REASON = {
  NEW_COMPANY: 'NEW_COMPANY',
  PROFILE_UPDATED: 'PROFILE_UPDATED',
  NEW_DOCUMENT: 'NEW_DOCUMENT',
  NEW_CASE: 'NEW_CASE',
  NEW_OPPORTUNITY: 'NEW_OPPORTUNITY',
  CONTENT_REPORT: 'CONTENT_REPORT',
  AUTOMATED_FLAG: 'AUTOMATED_FLAG',
  RESUBMISSION: 'RESUBMISSION',
} as const

export type ModerationReason = (typeof MODERATION_REASON)[keyof typeof MODERATION_REASON]

export const MODERATION_ACTION = {
  ASSIGNED: 'ASSIGNED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CHANGES_REQUESTED: 'CHANGES_REQUESTED',
  BLOCKED: 'BLOCKED',
  REPORT_RESOLVED: 'REPORT_RESOLVED',
  ESCALATED: 'ESCALATED',
} as const

export type ModerationAction = (typeof MODERATION_ACTION)[keyof typeof MODERATION_ACTION]

export const DATA_ORIGIN = {
  USER: 'USER',
  REPORT: 'REPORT',
  AUTOMATED_RULE: 'AUTOMATED_RULE',
  MODEL_DATA: 'MODEL_DATA',
  MODERATION_DECISION: 'MODERATION_DECISION',
} as const

export type DataOrigin = (typeof DATA_ORIGIN)[keyof typeof DATA_ORIGIN]

export const DOCUMENT_VERIFICATION_STATUS = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  NEEDS_CHANGES: 'NEEDS_CHANGES',
} as const

export type DocumentVerificationStatus =
  (typeof DOCUMENT_VERIFICATION_STATUS)[keyof typeof DOCUMENT_VERIFICATION_STATUS]

export type ModerationPayloadValue = string | number | boolean | null | undefined

export interface ModerationItem {
  id: string
  entityType: ModerationEntityType
  entityId: string
  title: string
  ownerId: string
  ownerName: string
  companyName: string
  status: ModerationStatus
  priority: ModerationPriority
  reason: ModerationReason
  submittedAt: string
  assignedModeratorId: string | null
  assignedModeratorName: string | null
  reportsCount: number
  previousDecisionId: string | null
  createdAt: string
  updatedAt: string
  summary: string
  payload: Record<string, ModerationPayloadValue>
  checklist: string[]
  relatedReportIds: string[]
  automatedFlags: string[]
  dataOrigin: DataOrigin
  previousSnapshot: Record<string, ModerationPayloadValue> | null
  currentSnapshot: Record<string, ModerationPayloadValue> | null
  documentStatus: DocumentVerificationStatus | null
  moderatorNote: string | null
  version: number
}

export interface ModerationDecision {
  id: string
  moderationItemId: string
  moderatorId: string
  moderatorName: string
  action: ModerationAction
  reasonCode: string | null
  comment: string | null
  previousStatus: ModerationStatus
  newStatus: ModerationStatus
  createdAt: string
  fieldsRequested: string[]
  privateNote: string | null
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

export interface ModerationDashboard {
  pendingCompanies: number
  pendingOpportunities: number
  pendingCases: number
  pendingDocuments: number
  pendingTotal: number
  openReports: number
  escalations: number
  todayProcessed: number
  approvedToday: number
  rejectedToday: number
  changesToday: number
  attentionItems: ModerationItem[]
  recentQueue: ModerationItem[]
}

/** @deprecated use ModerationDashboard */
export type ModerationSummary = ModerationDashboard

export type ModerationQueueSort =
  | 'urgent'
  | 'oldest'
  | 'newest'
  | 'reports'
  | 'priority'

export interface ModerationQueueFilters {
  type?: ModerationEntityType | 'all'
  status?: ModerationStatus | 'all' | 'open'
  priority?: ModerationPriority | 'all'
  query?: string
  reason?: ModerationReason | 'all'
  hasReports?: boolean
  olderThanHours?: number
  sort?: ModerationQueueSort
  source?: DataOrigin | 'all'
}

export interface ModerationRelatedData {
  item: ModerationItem
  relatedReports: import('@/entities/report').Report[]
  history: ModerationHistoryEntry[]
  similarTitles: string[]
  companyRisk: {
    previousRejections: number
    reportsCount: number
    blockedItems: number
  }
}

export interface ApproveInput {
  privateNote?: string
  expectedVersion?: number
}

export interface RejectInput {
  reasonCode: string
  comment?: string
  privateNote?: string
  expectedVersion?: number
}

export interface RequestChangesInput {
  fields: string[]
  comment: string
  privateNote?: string
  expectedVersion?: number
}

export interface BlockInput {
  reasonCode: string
  comment: string
  privateNote?: string
  expectedVersion?: number
}

export interface EscalateInput {
  reasonCode: string
  comment: string
  privateNote?: string
  expectedVersion?: number
}
