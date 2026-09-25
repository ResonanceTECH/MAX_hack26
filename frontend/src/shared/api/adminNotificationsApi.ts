import { delay } from '@/shared/lib/delay'
import { saveMockState } from '@/shared/lib/mockPersist'
import {
  getAdminNotificationById,
  mockAdminNotifications,
  type AdminNotification,
} from '@/shared/mocks/adminNotifications'

function persist() {
  saveMockState('adminNotifications', mockAdminNotifications)
}

export const adminNotificationsApi = {
  async getAll(): Promise<AdminNotification[]> {
    await delay(200 + Math.floor(Math.random() * 300))
    return [...mockAdminNotifications].sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
    )
  },

  async markRead(id: string): Promise<AdminNotification> {
    await delay(100)
    const item = getAdminNotificationById(id)
    if (!item) throw new Error('Уведомление не найдено')
    item.read = true
    persist()
    return { ...item }
  },

  async markAllRead(): Promise<AdminNotification[]> {
    await delay(150)
    mockAdminNotifications.forEach((n) => {
      n.read = true
    })
    persist()
    return mockAdminNotifications.map((n) => ({ ...n }))
  },
}

export type { AdminNotification }
