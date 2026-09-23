import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { favoriteApi } from '@/shared/api/favoriteApi'
import type { FavoriteItem } from '@/shared/mocks'

export const favoriteKeys = {
  all: ['favorites'] as const,
  list: () => [...favoriteKeys.all, 'list'] as const,
}

export function useFavorites() {
  return useQuery({
    queryKey: favoriteKeys.list(),
    queryFn: () => favoriteApi.getAll(),
  })
}

export function useToggleFavorite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ type, targetId }: { type: FavoriteItem['type']; targetId: string }) =>
      favoriteApi.toggle(type, targetId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: favoriteKeys.all })
    },
  })
}
