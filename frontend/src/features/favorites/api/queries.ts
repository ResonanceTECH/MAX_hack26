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
      favoriteApi.toggle(type, String(targetId)),
    onMutate: async ({ type, targetId }) => {
      const key = String(targetId)
      await qc.cancelQueries({ queryKey: favoriteKeys.list() })
      const previous = qc.getQueryData<FavoriteItem[]>(favoriteKeys.list())
      qc.setQueryData<FavoriteItem[]>(favoriteKeys.list(), (old = []) => {
        const exists = old.some((f) => f.type === type && String(f.targetId) === key)
        if (exists) {
          return old.filter((f) => !(f.type === type && String(f.targetId) === key))
        }
        return [
          {
            id: `opt-${type}-${key}`,
            type,
            targetId: key,
            createdAt: new Date().toISOString(),
          },
          ...old,
        ]
      })
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(favoriteKeys.list(), ctx.previous)
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: favoriteKeys.all })
    },
  })
}
