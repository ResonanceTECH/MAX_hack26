import type { AppNotification } from '@/entities/notification'
import { delay } from '@/shared/lib/delay'
import { mockNotifications } from '@/shared/mocks'

let notifications = [...mockNotifications]

export const notificationApi = {
  async getAll(): Promise<AppNotification[]> {
    await delay()
    return [...notifications].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  },

  async markAsRead(id: string): Promise<AppNotification> {
    await delay()
    const item = notifications.find((n) => n.id === id)
    if (!item) throw new Error('Уведомление не найдено')
    item.read = true
    return item
  },

  async markAllAsRead(): Promise<void> {
    await delay()
    notifications = notifications.map((n) => ({ ...n, read: true }))
  },
}
