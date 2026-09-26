import { SYSTEM_ROLES } from '@/entities/user'
import { delay } from '@/shared/lib/delay'
import { saveMockState } from '@/shared/lib/mockPersist'
import { AUDIT_ACTIONS, appendAudit } from '@/shared/mocks/audit'
import {
  getFeatureFlagById,
  mockFeatureFlags,
  type FeatureFlag,
} from '@/shared/mocks/featureFlags'
import type { AdminActor } from './adminUsersApi'
import { isReal } from '@/shared/api/apiCapabilities'
import { createApiProxy, featureFlagsReal } from '@/shared/api/real/moderationAdmin'

function persist() {
  saveMockState('featureFlags', mockFeatureFlags)
}

function defaultActor(): AdminActor {
  return {
    id: 'user-platform-admin',
    name: 'Александр Иванов',
    role: SYSTEM_ROLES.PLATFORM_ADMIN,
  }
}

const mockFeatureFlagsApi = {
  async getAll(): Promise<FeatureFlag[]> {
    await delay(200 + Math.floor(Math.random() * 300))
    return mockFeatureFlags.map((f) => ({ ...f }))
  },

  async getById(id: string): Promise<FeatureFlag> {
    await delay(150 + Math.floor(Math.random() * 200))
    const flag = getFeatureFlagById(id)
    if (!flag) throw new Error('Feature flag не найден')
    return { ...flag }
  },

  async toggle(
    keyOrId: string,
    enabled: boolean,
    reason: string,
    actor: AdminActor = defaultActor(),
  ): Promise<FeatureFlag> {
    await delay(400 + Math.floor(Math.random() * 500))
    const flag = getFeatureFlagById(keyOrId)
    if (!flag) throw new Error('Feature flag не найден')
    const before = { enabled: flag.enabled }
    flag.enabled = enabled
    flag.updatedAt = new Date().toISOString()
    flag.updatedBy = actor.name
    persist()
    appendAudit({
      actorId: actor.id,
      actorName: actor.name,
      role: actor.role,
      action: AUDIT_ACTIONS.FEATURE_FLAG_CHANGED,
      entityType: 'feature_flag',
      entityId: flag.id,
      entityName: flag.key,
      before,
      after: { enabled },
      reason,
      source: 'platform_admin',
    })
    return { ...flag }
  },
}

export const featureFlagsApi = createApiProxy(featureFlagsReal, mockFeatureFlagsApi, () =>
  isReal('admin'),
)

export type { FeatureFlag }
