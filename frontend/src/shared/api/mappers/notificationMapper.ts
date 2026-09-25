import type { AppNotification, NotificationType } from '@/entities/notification'
import { NOTIFICATION_TYPES } from '@/entities/notification'
import type { NotificationDto } from '@/shared/api/dto/backend'

function inferType(text: string): NotificationType {
  const t = text.toLowerCase()
  if (t.includes('предложен') || t.includes('отклик')) return NOTIFICATION_TYPES.NEW_PROPOSAL
  if (t.includes('shortlist') || t.includes('шортлист')) return NOTIFICATION_TYPES.SHORTLIST
  if (t.includes('переговор') || t.includes('deal')) return NOTIFICATION_TYPES.NEGOTIATION
  if (t.includes('матч') || t.includes('рекоменд')) return NOTIFICATION_TYPES.NEW_MATCH
  if (t.includes('дедлайн') || t.includes('осталось') || t.includes('срок')) {
    return NOTIFICATION_TYPES.DEADLINE_REMINDER
  }
  return NOTIFICATION_TYPES.RELEVANT_OPPORTUNITY
}

export function mapNotificationDtoToModel(dto: NotificationDto): AppNotification {
  const text = dto.text || ''
  const title = text.length > 80 ? `${text.slice(0, 77)}…` : text || 'Уведомление'
  return {
    id: String(dto.id),
    type: inferType(text),
    title,
    message: text,
    createdAt: dto.created_at,
    read: Boolean(dto.is_read),
  }
}
