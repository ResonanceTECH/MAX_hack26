import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { proposalApi, type CreateProposalPayload } from '@/shared/api/proposalApi'
import { shortlistKeys } from '@/entities/shortlist/api/queries'
import { opportunityKeys } from '@/entities/opportunity/api/queries'

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

export function useCreateProposal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateProposalPayload) => proposalApi.create(payload),
    onSuccess: (created) => {
      void qc.invalidateQueries({ queryKey: proposalKeys.all })
      void qc.invalidateQueries({
        queryKey: proposalKeys.byOpportunity(created.opportunityId),
      })
      void qc.invalidateQueries({ queryKey: opportunityKeys.all })
    },
  })
}

export function useShortlistProposal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => proposalApi.shortlist(id),
    onSuccess: (proposal) => {
      void qc.invalidateQueries({ queryKey: proposalKeys.all })
      void qc.invalidateQueries({
        queryKey: proposalKeys.byOpportunity(proposal.opportunityId),
      })
      void qc.invalidateQueries({ queryKey: shortlistKeys.all })
    },
  })
}

export function useRejectProposal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => proposalApi.reject(id),
    onSuccess: (proposal) => {
      void qc.invalidateQueries({ queryKey: proposalKeys.all })
      void qc.invalidateQueries({
        queryKey: proposalKeys.byOpportunity(proposal.opportunityId),
      })
    },
  })
}
