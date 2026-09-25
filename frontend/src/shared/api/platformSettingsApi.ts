import { SYSTEM_ROLES } from '@/entities/user'
import { delay } from '@/shared/lib/delay'
import { appendAudit } from '@/shared/mocks/audit'
import {
  mockPlatformSettings,
  type PlatformSettings,
} from '@/shared/mocks/platformSettings'

export const platformSettingsApi = {
  async get(): Promise<PlatformSettings> {
    await delay()
    return structuredClone(mockPlatformSettings)
  },

  async update(patch: Partial<PlatformSettings>): Promise<PlatformSettings> {
    await delay()
    Object.assign(mockPlatformSettings, {
      ...patch,
      moderation: { ...mockPlatformSettings.moderation, ...patch.moderation },
      matching: { ...mockPlatformSettings.matching, ...patch.matching },
      notifications: { ...mockPlatformSettings.notifications, ...patch.notifications },
      maintenance: { ...mockPlatformSettings.maintenance, ...patch.maintenance },
    })
    appendAudit({
      actorId: 'user-admin',
      actorName: 'Алексей Админов',
      role: SYSTEM_ROLES.PLATFORM_ADMIN,
      action: 'update_platform_settings',
      entityType: 'settings',
      entityId: 'platform',
      entityLabel: 'Platform settings',
    })
    return structuredClone(mockPlatformSettings)
  },
}
