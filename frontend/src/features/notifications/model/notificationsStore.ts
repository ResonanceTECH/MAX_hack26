import { create } from 'zustand'
import type { AppNotification } from '@/entities/notification'
import { notificationApi } from '@/shared/api/notificationApi'

interface NotificationsState {
  items: AppNotification[]
  isLoading: boolean
  error: string | null
  fetchAll: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  unreadCount: () => number
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,
  fetchAll: async () => {
    set({ isLoading: true, error: null })
    try {
      const items = await notificationApi.getAll()
      set({ items, isLoading: false })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Ошибка загрузки',
        isLoading: false,
      })
    }
  },
  markAsRead: async (id) => {
    await notificationApi.markAsRead(id)
    set({
      items: get().items.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })
  },
  markAllAsRead: async () => {
    await notificationApi.markAllAsRead()
    set({ items: get().items.map((n) => ({ ...n, read: true })) })
  },
  unreadCount: () => get().items.filter((n) => !n.read).length,
}))
