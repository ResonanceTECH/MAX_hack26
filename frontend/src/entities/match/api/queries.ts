import { useQuery } from '@tanstack/react-query'
import { matchingApi } from '@/shared/api/matchingApi'

export const matchKeys = {
  all: ['matches'] as const,
  byOpportunity: (id: string) => [...matchKeys.all, 'opportunity', id] as const,
  forCompany: (opportunityId: string, companyId: string) =>
    [...matchKeys.all, opportunityId, companyId] as const,
}

export function useMatches(opportunityId: string) {
  return useQuery({
    queryKey: matchKeys.byOpportunity(opportunityId),
    queryFn: () => matchingApi.getByOpportunity(opportunityId),
    enabled: Boolean(opportunityId),
  })
}

export function useMatch(opportunityId: string, companyId: string) {
  return useQuery({
    queryKey: matchKeys.forCompany(opportunityId, companyId),
    queryFn: () => matchingApi.getForCompany(opportunityId, companyId),
    enabled: Boolean(opportunityId && companyId),
  })
}
