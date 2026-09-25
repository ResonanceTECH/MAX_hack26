import type { ModerationEntityType, ModerationPriority } from '@/entities/moderation'

export const REPORT_TYPE = {
  SPAM: 'SPAM',
  FRAUD: 'FRAUD',
  FAKE_COMPANY: 'FAKE_COMPANY',
  MISLEADING_INFORMATION: 'MISLEADING_INFORMATION',
  INAPPROPRIATE_CONTENT: 'INAPPROPRIATE_CONTENT',
  DUPLICATE: 'DUPLICATE',
  OTHER: 'OTHER',
} as const

export type ReportType = (typeof REPORT_TYPE)[keyof typeof REPORT_TYPE]

/** @deprecated use ReportType */
export type ReportReason = ReportType

export const REPORT_STATUS = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
  ESCALATED: 'ESCALATED',
} as const

export type ReportStatus = (typeof REPORT_STATUS)[keyof typeof REPORT_STATUS]

export type ReportEntityType = ModerationEntityType | 'user'

export interface Report {
  id: string
  reporterId: string
  reporterName: string
  targetType: ReportEntityType
  targetId: string
  targetName: string
  type: ReportType
  description: string
  status: ReportStatus
  priority: ModerationPriority
  createdAt: string
  resolvedAt: string | null
  resolvedBy: string | null
  resolution: string | null
  resolutionCode: string | null
  assignedModeratorId: string | null
  relatedReportIds: string[]
}

export interface ResolveReportInput {
  resolutionCode: string
  comment?: string
  applyAction?: 'none' | 'request_changes' | 'reject' | 'block'
}
