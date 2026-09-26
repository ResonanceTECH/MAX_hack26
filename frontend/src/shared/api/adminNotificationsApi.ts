import { apiClient } from '@/shared/api/apiClient'
import { isReal } from '@/shared/api/apiCapabilities'
import type { NotificationDto } from '@/shared/api/dto/backend'
import { toApiError } from '@/shared/api/errors'

export interface AdminNotification {
  id: string
  type:
    | 'CRITICAL_ESCALATION'
    | 'MANY_REPORTS'
    | 'SETTING_CHANGED'
    | 'FEATURE_FLAG_CHANGED'
    | 'HIGH_QUEUE_AGE'
    | 'SUSPICIOUS_ADMIN_ACTION'
  title: string
  body: string
  entityType?: string
  entityId?: string
  href?: string
  read: boolean
  createdAt: string
}

function mapAdminNotification(dto: NotificationDto): AdminNotification {
  const text = dto.text || ''
  const lower = text.toLowerCase()
  let type: AdminNotification['type'] = 'HIGH_QUEUE_AGE'
  if (lower.includes('эскалац')) type = 'CRITICAL_ESCALATION'
  else if (lower.includes('жалоб') || lower.includes('report')) type = 'MANY_REPORTS'
  else if (lower.includes('flag') || lower.includes('флаг')) type = 'FEATURE_FLAG_CHANGED'
  else if (lower.includes('настрой')) type = 'SETTING_CHANGED'
  else if (lower.includes('подозрит') || lower.includes('audit')) type = 'SUSPICIOUS_ADMIN_ACTION'

  return {
    id: String(dto.id),
    type,
    title: text.slice(0, 80) || 'Уведомление',
    body: text,
    href: '/admin',
    read: Boolean(dto.is_read),
    createdAt: dto.created_at,
  }
}

export const adminNotificationsApi = {
  async getAll(): Promise<AdminNotification[]> {
    if (!isReal('admin')) {
      return []
    }
    try {
      const { data } = await apiClient.get<NotificationDto[]>('/notifications')
      return data
        .map(mapAdminNotification)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    } catch (error) {
      throw toApiError(error)
    }
  },

  async markRead(id: string): Promise<AdminNotification> {
    if (!isReal('admin')) throw new Error('Mock API disabled')
    try {
      const { data } = await apiClient.post<NotificationDto>(`/notifications/${id}/read`)
      return mapAdminNotification(data)
    } catch (error) {
      throw toApiError(error)
    }
  },

  async markAllRead(): Promise<AdminNotification[]> {
    if (!isReal('admin')) return []
    try {
      await apiClient.post('/notifications/read-all')
      return this.getAll()
    } catch (error) {
      throw toApiError(error)
    }
  },
}
