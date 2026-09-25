import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ShortlistItem } from '@/entities/shortlist'
import { shortlistApi } from '@/shared/api/shortlistApi'

export const shortlistKeys = {
  all: ['shortlist'] as const,
  list: () => [...shortlistKeys.all, 'list'] as const,
}

export function useShortlist() {
  return useQuery({
    queryKey: shortlistKeys.list(),
    queryFn: () => shortlistApi.getAll(),
  })
}

export function useAddToShortlist() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: Parameters<typeof shortlistApi.add>[0]) => shortlistApi.add(params),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: shortlistKeys.all })
    },
  })
}

export function useRemoveFromShortlist() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => shortlistApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: shortlistKeys.all })
    },
  })
}

export function useUpdateShortlistNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => shortlistApi.updateNote(id, note),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: shortlistKeys.all })
    },
  })
}

export type { ShortlistItem }
