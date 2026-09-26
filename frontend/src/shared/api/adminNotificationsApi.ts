import { apiClient } from '@/shared/api/apiClient'
import { isReal } from '@/shared/api/apiCapabilities'
import type { NotificationDto } from '@/shared/api/dto/backend'
import { toApiError } from '@/shared/api/errors'
import { delay } from '@/shared/lib/delay'
import {
  mockAdminNotifications,
  type AdminNotification,
  type AdminNotificationType,
} from '@/shared/mocks/adminNotifications'

export type { AdminNotification, AdminNotificationType }

const KNOWN_TYPES: readonly AdminNotificationType[] = [
  'NEW_ESCALATION',
  'MANY_REPORTS',
  'PLATFORM_SETTING_CHANGED',
  'FEATURE_FLAG_CHANGED',
] as const

function isKnownType(value: unknown): value is AdminNotificationType {
  return typeof value === 'string' && (KNOWN_TYPES as readonly string[]).includes(value)
}

/** Heuristic only when payload `type` is missing. */
function inferTypeFromText(text: string): AdminNotificationType {
  const lower = text.toLowerCase()
  if (lower.includes('эскалац') || lower.includes('escalat')) return 'NEW_ESCALATION'
  if (lower.includes('жалоб') || lower.includes('report')) return 'MANY_REPORTS'
  if (lower.includes('flag') || lower.includes('флаг')) return 'FEATURE_FLAG_CHANGED'
  if (lower.includes('настрой') || lower.includes('setting')) return 'PLATFORM_SETTING_CHANGED'
  return 'NEW_ESCALATION'
}

function resolveType(dto: NotificationDto & { type?: string; payload?: { type?: string } }): AdminNotificationType {
  const fromPayload = dto.payload?.type ?? dto.type
  if (isKnownType(fromPayload)) return fromPayload
  // Legacy aliases from older mocks / interim BE
  if (fromPayload === 'CRITICAL_ESCALATION') return 'NEW_ESCALATION'
  if (fromPayload === 'SETTING_CHANGED') return 'PLATFORM_SETTING_CHANGED'
  return inferTypeFromText(dto.text || '')
}

function mapAdminNotification(
  dto: NotificationDto & { type?: string; payload?: { type?: string; href?: string; title?: string } },
): AdminNotification {
  const text = dto.text || ''
  const type = resolveType(dto)
  return {
    id: String(dto.id),
    type,
    title: dto.payload?.title || text.slice(0, 80) || 'Уведомление',
    body: text,
    href: dto.payload?.href ?? '/admin',
    read: Boolean(dto.is_read),
    createdAt: dto.created_at,
  }
}

export const adminNotificationsApi = {
  async getAll(): Promise<AdminNotification[]> {
    if (!isReal('admin')) {
      await delay()
      return [...mockAdminNotifications].sort(
        (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      )
    }
    try {
      const { data } = await apiClient.get<
        Array<NotificationDto & { type?: string; payload?: { type?: string } }>
      >('/notifications')
      return data
        .map(mapAdminNotification)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    } catch (error) {
      throw toApiError(error)
    }
  },

  async markRead(id: string): Promise<AdminNotification> {
    if (!isReal('admin')) {
      await delay()
      const item = mockAdminNotifications.find((n) => n.id === id)
      if (!item) throw new Error('Уведомление не найдено')
      item.read = true
      return { ...item }
    }
    try {
      const { data } = await apiClient.post<NotificationDto>(`/notifications/${id}/read`)
      return mapAdminNotification(data)
    } catch (error) {
      throw toApiError(error)
    }
  },

  async markAllRead(): Promise<AdminNotification[]> {
    if (!isReal('admin')) {
      await delay()
      for (const n of mockAdminNotifications) n.read = true
      return [...mockAdminNotifications]
    }
    try {
      await apiClient.post('/notifications/read-all')
      return this.getAll()
    } catch (error) {
      throw toApiError(error)
    }
  },
}
