export const ESCALATION_STATUS = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
} as const

export type EscalationStatus = (typeof ESCALATION_STATUS)[keyof typeof ESCALATION_STATUS]

export const ESCALATION_REASON = {
  AMBIGUOUS: 'AMBIGUOUS',
  REPEAT_VIOLATION: 'REPEAT_VIOLATION',
  FRAUD_SUSPICION: 'FRAUD_SUSPICION',
  DATA_CONFLICT: 'DATA_CONFLICT',
  ADMIN_BLOCK_NEEDED: 'ADMIN_BLOCK_NEEDED',
  SYSTEM_ISSUE: 'SYSTEM_ISSUE',
  OTHER: 'OTHER',
} as const

export type EscalationReason = (typeof ESCALATION_REASON)[keyof typeof ESCALATION_REASON]

export interface Escalation {
  id: string
  moderationItemId: string
  entityType: string
  entityId: string
  title: string
  companyName: string
  moderatorId: string
  moderatorName: string
  reason: EscalationReason
  comment: string
  status: EscalationStatus
  createdAt: string
  resolvedAt: string | null
  resolution: string | null
  adminResponse: string | null
}
