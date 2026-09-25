import type { AppNotification } from '@/entities/notification'
import { delay } from '@/shared/lib/delay'
import { persistNotifications } from '@/shared/mocks/hydrateMocks'
import { mockNotifications } from '@/shared/mocks'

export const notificationApi = {
  async getAll(): Promise<AppNotification[]> {
    await delay()
    return [...mockNotifications].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  },

  async markAsRead(id: string): Promise<AppNotification> {
    await delay()
    const item = mockNotifications.find((n) => n.id === id)
    if (!item) throw new Error('Уведомление не найдено')
    item.read = true
    persistNotifications()
    return item
  },

  async markAllAsRead(): Promise<void> {
    await delay()
    for (const n of mockNotifications) {
      n.read = true
    }
    persistNotifications()
  },
}
