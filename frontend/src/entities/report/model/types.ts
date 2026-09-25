import type { ModerationEntityType } from '@/entities/moderation'

export type ReportReason =
  | 'Spam'
  | 'Fake company'
  | 'Fraud'
  | 'Inappropriate content'
  | 'Other'

export type ReportStatus = 'open' | 'closed' | 'action_taken'

export type ReportEntityType = ModerationEntityType | 'user'

export interface Report {
  id: string
  reason: ReportReason
  reporterName: string
  targetName: string
  entityType: ReportEntityType
  entityId: string
  description: string
  status: ReportStatus
  createdAt: string
}
