import type { ModeratorNotification } from '@/entities/moderator-notification'
import { delay } from '@/shared/lib/delay'
import { mockModeratorNotifications } from '@/shared/mocks/moderatorNotifications'
import { persistModeratorNotifications } from '@/shared/mocks/hydrateMocks'

export const moderatorNotificationsApi = {
  async getAll(): Promise<ModeratorNotification[]> {
    await delay(150 + Math.floor(Math.random() * 250))
    return [...mockModeratorNotifications]
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .map((n) => ({ ...n }))
  },

  async markRead(id: string): Promise<ModeratorNotification> {
    const item = mockModeratorNotifications.find((n) => n.id === id)
    if (!item) throw new Error('Уведомление не найдено')
    item.read = true
    persistModeratorNotifications()
    return { ...item }
  },

  async markAllRead(): Promise<void> {
    mockModeratorNotifications.forEach((n) => {
      n.read = true
    })
    persistModeratorNotifications()
  },
}
