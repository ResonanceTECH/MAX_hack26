import { useQuery } from '@tanstack/react-query'
import { dealApi } from '@/shared/api/dealApi'

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
