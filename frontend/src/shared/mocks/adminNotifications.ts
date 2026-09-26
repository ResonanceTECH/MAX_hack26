export type AdminNotificationType =
  | 'NEW_ESCALATION'
  | 'MANY_REPORTS'
  | 'PLATFORM_SETTING_CHANGED'
  | 'FEATURE_FLAG_CHANGED'

export interface AdminNotification {
  id: string
  type: AdminNotificationType
  title: string
  body: string
  entityType?: string
  entityId?: string
  href?: string
  read: boolean
  createdAt: string
}

export const mockAdminNotifications: AdminNotification[] = [
  {
    id: 'an-1',
    type: 'NEW_ESCALATION',
    title: 'Критическая эскалация',
    body: 'Эскалация по компании BrandPulse требует решения Platform Admin',
    entityType: 'escalation',
    entityId: 'esc-1',
    href: '/moderation/escalations',
    read: false,
    createdAt: '2026-09-24T12:50:00.000Z',
  },
  {
    id: 'an-2',
    type: 'MANY_REPORTS',
    title: 'Много жалоб на компанию',
    body: 'На МедСнаб Плюс открыто несколько жалоб',
    entityType: 'company',
    entityId: 'company-medsupply',
    href: '/admin/companies/company-medsupply',
    read: false,
    createdAt: '2026-09-24T11:10:00.000Z',
  },
  {
    id: 'an-3',
    type: 'FEATURE_FLAG_CHANGED',
    title: 'Feature flag изменён',
    body: 'deal_room переключён другим администратором',
    entityType: 'feature_flag',
    entityId: 'flag-deal-room',
    href: '/admin/feature-flags',
    read: true,
    createdAt: '2026-09-23T14:05:00.000Z',
  },
  {
    id: 'an-4',
    type: 'NEW_ESCALATION',
    title: 'Высокий возраст очереди',
    body: 'Средний возраст moderation queue превышает 24 часа',
    entityType: 'moderation',
    href: '/admin/moderation',
    read: false,
    createdAt: '2026-09-23T09:00:00.000Z',
  },
  {
    id: 'an-5',
    type: 'PLATFORM_SETTING_CHANGED',
    title: 'Настройка платформы изменена',
    body: 'matching.minScoreToShow обновлён',
    entityType: 'settings',
    href: '/admin/settings',
    read: true,
    createdAt: '2026-09-23T10:05:00.000Z',
  },
  {
    id: 'an-6',
    type: 'PLATFORM_SETTING_CHANGED',
    title: 'Подозрительное админ-действие (mock)',
    body: 'Несколько блокировок пользователей за короткий период',
    entityType: 'audit',
    href: '/admin/audit',
    read: false,
    createdAt: '2026-09-22T18:00:00.000Z',
  },
]

export function getAdminNotificationById(id: string): AdminNotification | undefined {
  return mockAdminNotifications.find((n) => n.id === id)
}
