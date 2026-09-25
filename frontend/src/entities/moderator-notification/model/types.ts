export const MODERATOR_NOTIFICATION_TYPE = {
  CRITICAL_ITEM: 'CRITICAL_ITEM',
  NEW_REPORT: 'NEW_REPORT',
  ASSIGNED: 'ASSIGNED',
  RESUBMITTED: 'RESUBMITTED',
  ESCALATION_RESPONSE: 'ESCALATION_RESPONSE',
  QUEUE_AGE: 'QUEUE_AGE',
} as const

export type ModeratorNotificationType =
  (typeof MODERATOR_NOTIFICATION_TYPE)[keyof typeof MODERATOR_NOTIFICATION_TYPE]

export interface ModeratorNotification {
  id: string
  type: ModeratorNotificationType
  title: string
  body: string
  createdAt: string
  read: boolean
  href: string
}
