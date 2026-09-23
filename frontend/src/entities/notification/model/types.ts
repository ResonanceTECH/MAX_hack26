export const NOTIFICATION_TYPES = {
  NEW_MATCH: 'new_match',
  NEW_PROPOSAL: 'new_proposal',
  PROPOSAL_VIEWED: 'proposal_viewed',
  SHORTLIST: 'shortlist',
  RELEVANT_OPPORTUNITY: 'relevant_opportunity',
  DEADLINE_REMINDER: 'deadline_reminder',
} as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES]

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  createdAt: string
  read: boolean
  link?: string
  meta?: Record<string, string | number>
}
