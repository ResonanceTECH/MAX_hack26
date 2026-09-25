import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  opportunityApi,
  type CreateOpportunityPayload,
  type OpportunityFilters,
  type OpportunitySort,
} from '@/shared/api/opportunityApi'
import { matchingApi } from '@/shared/api/matchingApi'
import { matchKeys } from '@/entities/match/api/queries'

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
    queryFn: () => opportunityApi.getRecommended(),
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

export function useCreateOpportunity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateOpportunityPayload) => opportunityApi.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: opportunityKeys.all })
    },
  })
}

export function useSaveOpportunityDraft() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateOpportunityPayload) => opportunityApi.saveDraft(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: opportunityKeys.all })
    },
  })
}

export function usePublishOpportunity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateOpportunityPayload) => {
      const created = await opportunityApi.create(payload)
      await opportunityApi.publish(created.id)
      const matches = await matchingApi.generateForOpportunity(created.id)
      return { opportunity: created, matches }
    },
    onSuccess: (result) => {
      void qc.invalidateQueries({ queryKey: opportunityKeys.all })
      void qc.invalidateQueries({
        queryKey: matchKeys.byOpportunity(result.opportunity.id),
      })
      void qc.invalidateQueries({ queryKey: matchKeys.all })
    },
  })
}
