import type { CompanySettings } from '@/entities/company-settings'
import { COMPANY_ACTIVITY_TYPE } from '@/entities/company-activity'
import { apiClient } from '@/shared/api/apiClient'
import { isReal } from '@/shared/api/apiCapabilities'
import { toApiError } from '@/shared/api/errors'
import { delay } from '@/shared/lib/delay'
import { mockCompanySettings } from '@/shared/mocks'
import { persistCompanySettings } from '@/shared/mocks/hydrateMocks'
import { activityApi } from './activityApi'

export type CompanySettingsPatch = Partial<{
  notifications: Partial<CompanySettings['notifications']>
  visibility: Partial<CompanySettings['visibility']>
  matching: Partial<CompanySettings['matching']>
  archived: boolean
}>

const DEFAULT_ACTOR = 'Анна Смирнова'

interface SettingsDto {
  company_id: number
  notifications: CompanySettings['notifications']
  visibility: CompanySettings['visibility']
  matching: CompanySettings['matching']
  archived: boolean
}

function mapSettings(dto: SettingsDto): CompanySettings {
  return {
    companyId: String(dto.company_id),
    notifications: dto.notifications,
    visibility: dto.visibility,
    matching: dto.matching,
    archived: dto.archived,
  }
}

export const settingsApi = {
  async get(companyId?: string): Promise<CompanySettings> {
    if (isReal('settings')) {
      try {
        const { data } = await apiClient.get<SettingsDto>('/companies/me/settings')
        return mapSettings(data)
      } catch (error) {
        throw toApiError(error)
      }
    }
    await delay()
    if (!companyId) throw new Error('companyId required in mock mode')
    if (mockCompanySettings.companyId !== companyId) {
      return { ...structuredClone(mockCompanySettings), companyId }
    }
    return structuredClone(mockCompanySettings)
  },

  async update(patch: CompanySettingsPatch, companyId?: string): Promise<CompanySettings> {
    if (isReal('settings')) {
      try {
        const { data } = await apiClient.patch<SettingsDto>('/companies/me/settings', patch)
        return mapSettings(data)
      } catch (error) {
        throw toApiError(error)
      }
    }
    await delay()
    if (!companyId) throw new Error('companyId required in mock mode')
    if (patch.notifications) Object.assign(mockCompanySettings.notifications, patch.notifications)
    if (patch.visibility) Object.assign(mockCompanySettings.visibility, patch.visibility)
    if (patch.matching) Object.assign(mockCompanySettings.matching, patch.matching)
    if (patch.archived !== undefined) mockCompanySettings.archived = patch.archived
    mockCompanySettings.companyId = companyId
    persistCompanySettings()
    activityApi.appendSync({
      companyId,
      type: COMPANY_ACTIVITY_TYPE.SETTINGS_UPDATED,
      actorName: DEFAULT_ACTOR,
      action: 'обновила настройки компании',
      entityLabel: 'Настройки',
    })
    return structuredClone(mockCompanySettings)
  },
}
