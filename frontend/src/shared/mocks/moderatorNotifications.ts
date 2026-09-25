import {
  MODERATOR_NOTIFICATION_TYPE,
  type ModeratorNotification,
} from '@/entities/moderator-notification'
import { moderationDetailPath, ROUTES } from '@/shared/constants/routes'

export const mockModeratorNotifications: ModeratorNotification[] = [
  {
    id: 'mnot-1',
    type: MODERATOR_NOTIFICATION_TYPE.CRITICAL_ITEM,
    title: 'Критический объект в очереди',
    body: 'PackPro — автоматическая проверка отметила аномалии',
    createdAt: '2026-09-24T13:00:00.000Z',
    read: false,
    href: moderationDetailPath('company', 'mod-c4'),
  },
  {
    id: 'mnot-2',
    type: MODERATOR_NOTIFICATION_TYPE.NEW_REPORT,
    title: 'Новая жалоба',
    body: 'Fraud: BrandPulse',
    createdAt: '2026-09-24T12:40:00.000Z',
    read: false,
    href: `${ROUTES.MODERATION_REPORTS}/report-4`,
  },
  {
    id: 'mnot-3',
    type: MODERATOR_NOTIFICATION_TYPE.ASSIGNED,
    title: 'Объект назначен вам',
    body: 'Интеграция BIM на 3 площадках',
    createdAt: '2026-09-24T11:00:00.000Z',
    read: true,
    href: moderationDetailPath('opportunity', 'mod-o6'),
  },
  {
    id: 'mnot-4',
    type: MODERATOR_NOTIFICATION_TYPE.RESUBMITTED,
    title: 'Объект изменён после запроса исправлений',
    body: 'DataCraft снова в очереди',
    createdAt: '2026-09-24T10:20:00.000Z',
    read: false,
    href: moderationDetailPath('company', 'mod-c5'),
  },
  {
    id: 'mnot-5',
    type: MODERATOR_NOTIFICATION_TYPE.ESCALATION_RESPONSE,
    title: 'Эскалация получила ответ',
    body: 'Администратор ответил по FastEquip',
    createdAt: '2026-09-18T15:05:00.000Z',
    read: true,
    href: `${ROUTES.MODERATION}/escalations`,
  },
  {
    id: 'mnot-6',
    type: MODERATOR_NOTIFICATION_TYPE.QUEUE_AGE,
    title: 'Долгое ожидание в очереди',
    body: 'Digital Lab ожидает проверки более 12 часов',
    createdAt: '2026-09-24T09:00:00.000Z',
    read: false,
    href: moderationDetailPath('company', 'mod-c1'),
  },
]
