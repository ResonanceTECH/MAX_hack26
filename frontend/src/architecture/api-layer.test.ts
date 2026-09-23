import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

function read(relative: string) {
  return readFileSync(path.join(root, relative), 'utf8')
}

const pageImports = [
  'src/pages/HomePage/HomePage.tsx',
  'src/pages/OpportunitiesPage/OpportunitiesPage.tsx',
  'src/pages/FavoritesPage/FavoritesPage.tsx',
  'src/pages/MyProposalsPage/MyProposalsPage.tsx',
  'src/pages/MyProcessesPage/MyProcessesPage.tsx',
  'src/pages/ShortlistPage/ShortlistPage.tsx',
  'src/widgets/MatchCard/MatchCard.tsx',
]

describe('frontend architecture', () => {
  it('[API-01] opportunities go through the service and query hooks', () => {
    expect(read('src/shared/api/opportunityApi.ts')).toMatch(/export const opportunityApi/)
    expect(read('src/entities/opportunity/api/queries.ts')).toMatch(/useQuery/)
    expect(read('src/pages/OpportunitiesPage/OpportunitiesPage.tsx')).toMatch(/useOpportunities/)
  })

  it('[API-02] companies go through the service and query hooks', () => {
    expect(read('src/shared/api/companyApi.ts')).toMatch(/export const companyApi/)
    expect(read('src/entities/company/api/queries.ts')).toMatch(/useQuery/)
    expect(read('src/pages/CompaniesPage/CompaniesPage.tsx')).toMatch(/useCompanies/)
  })

  it('[API-03] proposals go through the service and query hooks', () => {
    expect(read('src/shared/api/proposalApi.ts')).toMatch(/export const proposalApi/)
    expect(read('src/entities/proposal/api/queries.ts')).toMatch(/useQuery/)
    expect(read('src/pages/ProposalsPage/ProposalsPage.tsx')).toMatch(/useProposals/)
  })

  it('[API-04] matching goes through the service and query hooks', () => {
    expect(read('src/shared/api/matchingApi.ts')).toMatch(/export const matchingApi/)
    expect(read('src/entities/match/api/queries.ts')).toMatch(/useQuery/)
  })

  it('[API-05] notifications go through the service', () => {
    expect(read('src/shared/api/notificationApi.ts')).toMatch(/export const notificationApi/)
    expect(read('src/features/notifications/model/notificationsStore.ts')).toMatch(/notificationApi/)
  })

  it('[API-06] pages do not import raw mocks when an API layer exists', () => {
    const offenders = pageImports.filter((file) =>
      /from '@\/shared\/mocks/.test(read(file)),
    )
    expect(offenders, 'API-06 FAIL: страницы и виджеты импортируют mock напрямую').toEqual([])
  })

  it('[API-07] server state uses TanStack Query', () => {
    for (const file of [
      'src/entities/opportunity/api/queries.ts',
      'src/entities/company/api/queries.ts',
      'src/entities/proposal/api/queries.ts',
      'src/entities/match/api/queries.ts',
      'src/entities/deal/api/queries.ts',
    ]) {
      expect(read(file)).toMatch(/useQuery/)
    }
  })

  it('[API-08] Zustand search stores keep filters, not entity lists', () => {
    const opportunitySearch = read('src/features/opportunity-search/model/searchStore.ts')
    const companySearch = read('src/features/company-search/model/searchStore.ts')
    expect(opportunitySearch).not.toMatch(/Opportunity\[\]/)
    expect(companySearch).not.toMatch(/Company\[\]/)
    expect(opportunitySearch).toMatch(/filters: OpportunityFilters/)
    expect(companySearch).toMatch(/filters: CompanyFilters/)
  })
})
