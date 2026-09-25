import { SYSTEM_ROLES } from '@/entities/user'
import { delay } from '@/shared/lib/delay'
import { saveMockState } from '@/shared/lib/mockPersist'
import { AUDIT_ACTIONS, appendAudit } from '@/shared/mocks/audit'
import {
  mockPlatformHealth,
  mockPlatformSettings,
  type PlatformSettings,
} from '@/shared/mocks/platformSettings'
import type { AdminActor } from './adminUsersApi'

function persist() {
  saveMockState('platformSettings', mockPlatformSettings)
}

function defaultActor(): AdminActor {
  return {
    id: 'user-platform-admin',
    name: 'Александр Иванов',
    role: SYSTEM_ROLES.PLATFORM_ADMIN,
  }
}

function auditSetting(
  actor: AdminActor,
  entityLabel: string,
  before: unknown,
  after: unknown,
  reason?: string,
  action: string = AUDIT_ACTIONS.PLATFORM_SETTING_CHANGED,
) {
  appendAudit({
    actorId: actor.id,
    actorName: actor.name,
    role: actor.role,
    action,
    entityType: 'settings',
    entityId: 'platform',
    entityName: entityLabel,
    before,
    after,
    reason,
    source: 'platform_admin',
  })
}

export const platformSettingsApi = {
  async get(): Promise<PlatformSettings> {
    await delay(200 + Math.floor(Math.random() * 300))
    return structuredClone(mockPlatformSettings)
  },

  async getHealth() {
    await delay(150)
    return { ...mockPlatformHealth, maintenance: mockPlatformSettings.maintenance.enabled ? 'Включён' : 'Выключен' }
  },

  async update(patch: Partial<PlatformSettings>, actor: AdminActor = defaultActor()): Promise<PlatformSettings> {
    await delay(300 + Math.floor(Math.random() * 300))
    const before = structuredClone(mockPlatformSettings)
    Object.assign(mockPlatformSettings, {
      ...patch,
      general: { ...mockPlatformSettings.general, ...patch.general },
      moderation: { ...mockPlatformSettings.moderation, ...patch.moderation },
      matching: { ...mockPlatformSettings.matching, ...patch.matching },
      notifications: { ...mockPlatformSettings.notifications, ...patch.notifications },
      maintenance: { ...mockPlatformSettings.maintenance, ...patch.maintenance },
      announcement: { ...mockPlatformSettings.announcement, ...patch.announcement },
    })
    persist()
    auditSetting(actor, 'Platform settings', before, structuredClone(mockPlatformSettings))
    return structuredClone(mockPlatformSettings)
  },

  async updateGeneral(
    general: PlatformSettings['general'],
    actor: AdminActor = defaultActor(),
  ): Promise<PlatformSettings> {
    await delay(300 + Math.floor(Math.random() * 300))
    const before = { ...mockPlatformSettings.general }
    mockPlatformSettings.general = { ...general }
    persist()
    auditSetting(actor, 'general', before, mockPlatformSettings.general)
    return structuredClone(mockPlatformSettings)
  },

  async updateModeration(
    moderation: PlatformSettings['moderation'],
    actor: AdminActor = defaultActor(),
  ): Promise<PlatformSettings> {
    await delay(250 + Math.floor(Math.random() * 250))
    const before = { ...mockPlatformSettings.moderation }
    mockPlatformSettings.moderation = { ...moderation }
    persist()
    auditSetting(actor, 'moderation', before, mockPlatformSettings.moderation)
    return structuredClone(mockPlatformSettings)
  },

  async updateMatching(
    matching: PlatformSettings['matching'],
    actor: AdminActor = defaultActor(),
  ): Promise<PlatformSettings> {
    await delay(300 + Math.floor(Math.random() * 300))
    const before = { ...mockPlatformSettings.matching }
    mockPlatformSettings.matching = { ...matching }
    persist()
    auditSetting(actor, 'matching', before, mockPlatformSettings.matching)
    return structuredClone(mockPlatformSettings)
  },

  async updateNotifications(
    notifications: PlatformSettings['notifications'],
    actor: AdminActor = defaultActor(),
  ): Promise<PlatformSettings> {
    await delay(250 + Math.floor(Math.random() * 250))
    const before = { ...mockPlatformSettings.notifications }
    mockPlatformSettings.notifications = { ...notifications }
    persist()
    auditSetting(actor, 'notifications', before, mockPlatformSettings.notifications)
    return structuredClone(mockPlatformSettings)
  },

  async setMaintenanceMode(
    enabled: boolean,
    reason: string,
    message?: string,
    actor: AdminActor = defaultActor(),
  ): Promise<PlatformSettings> {
    await delay(500 + Math.floor(Math.random() * 400))
    const before = { ...mockPlatformSettings.maintenance }
    mockPlatformSettings.maintenance = {
      enabled,
      message: message ?? mockPlatformSettings.maintenance.message,
    }
    persist()
    auditSetting(
      actor,
      'Maintenance mode',
      before,
      mockPlatformSettings.maintenance,
      reason,
      AUDIT_ACTIONS.MAINTENANCE_MODE_CHANGED,
    )
    return structuredClone(mockPlatformSettings)
  },
}

export type { PlatformSettings }
