import { loadMockState, saveMockState } from '@/shared/lib/mockPersist'
import { mockCompanyActivity } from '@/shared/mocks/companyActivity'
import { mockCompanyCases } from '@/shared/mocks/companyCases'
import { mockCompanyDocuments } from '@/shared/mocks/companyDocuments'
import { mockCompanyMembers } from '@/shared/mocks/companyMembers'
import { mockCompanies } from '@/shared/mocks/companies'
import { mockCompanyServices } from '@/shared/mocks/companyServices'
import { mockCompanySettings } from '@/shared/mocks/companySettings'
import { mockDeals } from '@/shared/mocks/deals'
import { mockFavorites } from '@/shared/mocks/favorites'
import { mockMatches } from '@/shared/mocks/matches'
import { mockOpportunities } from '@/shared/mocks/opportunities'
import { mockProposals } from '@/shared/mocks/proposals'
import { mockShortlist } from '@/shared/mocks/shortlist'
import { mockNotifications } from '@/shared/mocks/notifications'
import { mockModerationItems } from '@/shared/mocks/moderation'
import { mockModerationHistory, mockOwnerNotifications } from '@/shared/mocks/moderationHistory'
import { mockReports } from '@/shared/mocks/reports'
import { mockEscalations } from '@/shared/mocks/escalations'
import { mockModeratorNotifications } from '@/shared/mocks/moderatorNotifications'
import { mockAdminUsers } from '@/shared/mocks/adminUsers'
import { mockAuditEvents } from '@/shared/mocks/audit'
import { mockDictionaries } from '@/shared/mocks/dictionaries'
import { mockPlatformSettings } from '@/shared/mocks/platformSettings'
import { mockFeatureFlags } from '@/shared/mocks/featureFlags'
import { mockAdminNotifications } from '@/shared/mocks/adminNotifications'
import { hydrateAdminCompanyState } from '@/shared/api/adminCompaniesApi'
import type { CompanySettings } from '@/entities/company-settings'
import type { PlatformSettings } from '@/shared/mocks/platformSettings'

function replaceArray<T>(target: T[], next: T[]) {
  target.splice(0, target.length, ...next)
}

function hydrateArray<T>(key: string, target: T[]) {
  if (typeof localStorage === 'undefined') return
  try {
    const raw = localStorage.getItem(`b2b_match_mock_v1_${key}`)
    if (!raw) return
    replaceArray(target, JSON.parse(raw) as T[])
  } catch {
    /* ignore corrupt state */
  }
}

/** Restore mutable mock collections after a full page reload. */
export function hydrateMocks() {
  hydrateArray('opportunities', mockOpportunities)
  hydrateArray('proposals', mockProposals)
  hydrateArray('deals', mockDeals)
  hydrateArray('matches', mockMatches)
  hydrateArray('shortlist', mockShortlist)
  hydrateArray('notifications', mockNotifications)
  hydrateArray('companyMembers', mockCompanyMembers)
  hydrateArray('companyServices', mockCompanyServices)
  hydrateArray('companyCases', mockCompanyCases)
  hydrateArray('companyDocuments', mockCompanyDocuments)
  hydrateArray('companies', mockCompanies)
  hydrateArray('companyActivity', mockCompanyActivity)
  hydrateArray('moderationItems', mockModerationItems)
  hydrateArray('moderationHistory', mockModerationHistory)
  hydrateArray('reports', mockReports)
  hydrateArray('escalations', mockEscalations)
  hydrateArray('moderatorNotifications', mockModeratorNotifications)
  hydrateArray('ownerNotifications', mockOwnerNotifications)
  hydrateArray('adminUsers', mockAdminUsers)
  hydrateArray('auditEvents', mockAuditEvents)
  hydrateArray('dictionaries', mockDictionaries)
  hydrateArray('featureFlags', mockFeatureFlags)
  hydrateArray('adminNotifications', mockAdminNotifications)
  hydrateAdminCompanyState()

  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem('b2b_match_mock_v1_favorites')
      if (raw) {
        const parsed = JSON.parse(raw) as typeof mockFavorites
        mockFavorites.splice(0, mockFavorites.length, ...parsed)
      }
    } catch {
      /* ignore */
    }

    try {
      const raw = localStorage.getItem('b2b_match_mock_v1_companySettings')
      if (raw) {
        const parsed = JSON.parse(raw) as CompanySettings
        Object.assign(mockCompanySettings, parsed)
      }
    } catch {
      /* ignore */
    }

    try {
      const raw = localStorage.getItem('b2b_match_mock_v1_platformSettings')
      if (raw) {
        const parsed = JSON.parse(raw) as PlatformSettings
        Object.assign(mockPlatformSettings, parsed)
      }
    } catch {
      /* ignore */
    }
  }
}

export function persistOpportunities() {
  saveMockState('opportunities', mockOpportunities)
}

export function persistProposals() {
  saveMockState('proposals', mockProposals)
}

export function persistDeals() {
  saveMockState('deals', mockDeals)
}

export function persistMatches() {
  saveMockState('matches', mockMatches)
}

export function persistShortlist() {
  saveMockState('shortlist', mockShortlist)
}

export function persistFavorites() {
  saveMockState('favorites', mockFavorites)
}

export function persistNotifications() {
  saveMockState('notifications', mockNotifications)
}

export function persistCompanyMembers() {
  saveMockState('companyMembers', mockCompanyMembers)
}

export function persistCompanyServices() {
  saveMockState('companyServices', mockCompanyServices)
}

export function persistCompanyCases() {
  saveMockState('companyCases', mockCompanyCases)
}

export function persistCompanyDocuments() {
  saveMockState('companyDocuments', mockCompanyDocuments)
}

export function persistCompanies() {
  saveMockState('companies', mockCompanies)
}

export function persistCompanyActivity() {
  saveMockState('companyActivity', mockCompanyActivity)
}

export function persistCompanySettings() {
  saveMockState('companySettings', mockCompanySettings)
}

export function persistModerationItems() {
  saveMockState('moderationItems', mockModerationItems)
}

export function persistModerationHistory() {
  saveMockState('moderationHistory', mockModerationHistory)
}

export function persistReports() {
  saveMockState('reports', mockReports)
}

export function persistEscalations() {
  saveMockState('escalations', mockEscalations)
}

export function persistModeratorNotifications() {
  saveMockState('moderatorNotifications', mockModeratorNotifications)
}

export function persistOwnerNotifications() {
  saveMockState('ownerNotifications', mockOwnerNotifications)
}

export function persistAdminUsers() {
  saveMockState('adminUsers', mockAdminUsers)
}

export function persistAuditEvents() {
  saveMockState('auditEvents', mockAuditEvents)
}

export function persistDictionaries() {
  saveMockState('dictionaries', mockDictionaries)
}

export function persistFeatureFlags() {
  saveMockState('featureFlags', mockFeatureFlags)
}

export function persistAdminNotifications() {
  saveMockState('adminNotifications', mockAdminNotifications)
}

export function persistPlatformSettings() {
  saveMockState('platformSettings', mockPlatformSettings)
}

export { loadMockState, saveMockState }
