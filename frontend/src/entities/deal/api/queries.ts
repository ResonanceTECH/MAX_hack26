import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { dealApi, type FixDealTermsInput } from '@/shared/api/dealApi'
import { filesApi } from '@/shared/api/filesApi'

export const dealKeys = {
  all: ['deals'] as const,
  list: () => [...dealKeys.all, 'list'] as const,
  detail: (id: string) => [...dealKeys.all, 'detail', id] as const,
}

export function useDeals() {
  return useQuery({
    queryKey: dealKeys.list(),
    queryFn: () => dealApi.getAll(),
  })
}

export function useDeal(id: string) {
  return useQuery({
    queryKey: dealKeys.detail(id),
    queryFn: () => dealApi.getById(id),
    enabled: Boolean(id),
  })
}

export function useUploadDealFile(dealId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: { file: File; onProgress?: (percent: number) => void }) =>
      filesApi.upload({
        file: params.file,
        dealId,
        onProgress: params.onProgress,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: dealKeys.detail(dealId) })
      await qc.invalidateQueries({ queryKey: dealKeys.list() })
    },
  })
}

export function useFixDealTerms(dealId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: FixDealTermsInput) => dealApi.fixTerms(dealId, input),
    onSuccess: async (deal) => {
      qc.setQueryData(dealKeys.detail(dealId), deal)
      await qc.invalidateQueries({ queryKey: dealKeys.list() })
    },
  })
}
