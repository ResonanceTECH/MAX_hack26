import type { AppNotification } from '@/entities/notification'
import { apiClient } from '@/shared/api/apiClient'
import { isReal } from '@/shared/api/apiCapabilities'
import type { NotificationDto } from '@/shared/api/dto/backend'
import { toApiError } from '@/shared/api/errors'
import { mapNotificationDtoToModel } from '@/shared/api/mappers/notificationMapper'
import { delay } from '@/shared/lib/delay'
import { persistNotifications } from '@/shared/mocks/hydrateMocks'
import { mockNotifications } from '@/shared/mocks'

export const notificationApi = {
  async getAll(): Promise<AppNotification[]> {
    if (isReal('notifications')) {
      try {
        const { data } = await apiClient.get<NotificationDto[]>('/notifications')
        return data
          .map(mapNotificationDtoToModel)
          .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      } catch (error) {
        throw toApiError(error)
      }
    }
    await delay()
    return [...mockNotifications].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  },

  async markAsRead(id: string): Promise<AppNotification> {
    if (isReal('notifications')) {
      try {
        const { data } = await apiClient.post<NotificationDto>(`/notifications/${id}/read`)
        return mapNotificationDtoToModel(data)
      } catch (error) {
        throw toApiError(error)
      }
    }
    await delay()
    const item = mockNotifications.find((n) => n.id === id)
    if (!item) throw new Error('Уведомление не найдено')
    item.read = true
    persistNotifications()
    return item
  },

  async markAllAsRead(): Promise<void> {
    if (isReal('notifications')) {
      try {
        await apiClient.post('/notifications/read-all')
        return
      } catch (error) {
        throw toApiError(error)
      }
    }
    await delay()
    for (const n of mockNotifications) {
      n.read = true
    }
    persistNotifications()
  },
}
