import type { ModeratorNotification } from '@/entities/moderator-notification'
import { apiClient } from '@/shared/api/apiClient'
import { isReal } from '@/shared/api/apiCapabilities'
import type { NotificationDto } from '@/shared/api/dto/backend'
import { toApiError } from '@/shared/api/errors'

function mapModeratorNotification(dto: NotificationDto): ModeratorNotification {
  const text = dto.text || ''
  const lower = text.toLowerCase()
  let type: ModeratorNotification['type'] = 'QUEUE_AGE'
  if (lower.includes('жалоб') || lower.includes('report')) type = 'NEW_REPORT'
  else if (lower.includes('эскалац')) type = 'ESCALATION_RESPONSE'
  else if (lower.includes('назнач') || lower.includes('assign')) type = 'ASSIGNED'
  else if (lower.includes('повтор') || lower.includes('resubmit')) type = 'RESUBMITTED'
  else if (lower.includes('критич')) type = 'CRITICAL_ITEM'

  return {
    id: String(dto.id),
    type,
    title: text.slice(0, 80) || 'Уведомление',
    body: text,
    createdAt: dto.created_at,
    read: Boolean(dto.is_read),
    href: '/moderation',
  }
}

export const moderatorNotificationsApi = {
  async getAll(): Promise<ModeratorNotification[]> {
    if (!isReal('moderation')) {
      return []
    }
    try {
      const { data } = await apiClient.get<NotificationDto[]>('/notifications')
      return data
        .map(mapModeratorNotification)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    } catch (error) {
      throw toApiError(error)
    }
  },

  async markRead(id: string): Promise<ModeratorNotification> {
    if (!isReal('moderation')) {
      throw new Error('Mock API disabled')
    }
    try {
      const { data } = await apiClient.post<NotificationDto>(`/notifications/${id}/read`)
      return mapModeratorNotification(data)
    } catch (error) {
      throw toApiError(error)
    }
  },

  async markAllRead(): Promise<void> {
    if (!isReal('moderation')) return
    try {
      await apiClient.post('/notifications/read-all')
    } catch (error) {
      throw toApiError(error)
    }
  },
}
