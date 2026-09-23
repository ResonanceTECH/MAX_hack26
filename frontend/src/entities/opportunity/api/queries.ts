import { useQuery } from '@tanstack/react-query'
import {
  opportunityApi,
  type OpportunityFilters,
  type OpportunitySort,
} from '@/shared/api/opportunityApi'

export const opportunityKeys = {
  all: ['opportunities'] as const,
  list: (filters?: OpportunityFilters, sort?: OpportunitySort) =>
    [...opportunityKeys.all, 'list', filters, sort] as const,
  detail: (id: string) => [...opportunityKeys.all, 'detail', id] as const,
  mine: (companyId: string) => [...opportunityKeys.all, 'mine', companyId] as const,
}

export function useOpportunities(filters?: OpportunityFilters, sort?: OpportunitySort) {
  return useQuery({
    queryKey: opportunityKeys.list(filters, sort),
    queryFn: () => opportunityApi.getAll(filters, sort),
  })
}

export function useRecommendedOpportunities(companyId?: string) {
  return useQuery({
    queryKey: [...opportunityKeys.all, 'recommended', companyId] as const,
    queryFn: () => opportunityApi.getAll(undefined, 'match'),
    enabled: Boolean(companyId),
  })
}

export function useOpportunity(id: string) {
  return useQuery({
    queryKey: opportunityKeys.detail(id),
    queryFn: () => opportunityApi.getById(id),
    enabled: Boolean(id),
  })
}

export function useMyOpportunities(companyId: string | undefined) {
  return useQuery({
    queryKey: opportunityKeys.mine(companyId ?? ''),
    queryFn: () => opportunityApi.getMine(companyId!),
    enabled: Boolean(companyId),
  })
}
