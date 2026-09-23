import { useQuery } from '@tanstack/react-query'
import { proposalApi } from '@/shared/api/proposalApi'

export const proposalKeys = {
  all: ['proposals'] as const,
  byOpportunity: (id: string) => [...proposalKeys.all, 'opportunity', id] as const,
  mine: (companyId: string) => [...proposalKeys.all, 'mine', companyId] as const,
  detail: (id: string) => [...proposalKeys.all, 'detail', id] as const,
}

export function useProposals(opportunityId: string) {
  return useQuery({
    queryKey: proposalKeys.byOpportunity(opportunityId),
    queryFn: () => proposalApi.getByOpportunity(opportunityId),
    enabled: Boolean(opportunityId),
  })
}

export function useProposal(id: string) {
  return useQuery({
    queryKey: proposalKeys.detail(id),
    queryFn: () => proposalApi.getById(id),
    enabled: Boolean(id),
  })
}

export function useMyProposals(companyId: string | undefined) {
  return useQuery({
    queryKey: proposalKeys.mine(companyId ?? ''),
    queryFn: () => proposalApi.getMine(companyId!),
    enabled: Boolean(companyId),
  })
}
