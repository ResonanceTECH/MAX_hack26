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
import type { CompanySettings } from '@/entities/company-settings'

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

export { loadMockState, saveMockState }
