import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ModerationQueueFilters } from '@/entities/moderation'
import { moderationApi } from '@/shared/api/moderationApi'
import { reportsApi } from '@/shared/api/reportsApi'

export const moderationKeys = {
  all: ['moderation'] as const,
  summary: () => [...moderationKeys.all, 'summary'] as const,
  queue: (filters?: ModerationQueueFilters) => [...moderationKeys.all, 'queue', filters] as const,
  detail: (type: string, id: string) => [...moderationKeys.all, 'detail', type, id] as const,
  history: () => [...moderationKeys.all, 'history'] as const,
  reports: () => [...moderationKeys.all, 'reports'] as const,
}

export function useModerationSummary() {
  return useQuery({ queryKey: moderationKeys.summary(), queryFn: () => moderationApi.getSummary() })
}

export function useModerationQueue(filters?: ModerationQueueFilters) {
  return useQuery({
    queryKey: moderationKeys.queue(filters),
    queryFn: () => moderationApi.getQueue(filters),
  })
}

export function useModerationItem(type: string, id: string) {
  return useQuery({
    queryKey: moderationKeys.detail(type, id),
    queryFn: () => moderationApi.getById(type, id),
    enabled: Boolean(type && id),
  })
}

export function useModerationHistory() {
  return useQuery({ queryKey: moderationKeys.history(), queryFn: () => moderationApi.getHistory() })
}

export function useReports() {
  return useQuery({ queryKey: moderationKeys.reports(), queryFn: () => reportsApi.list() })
}

function useInvalidateModeration() {
  const qc = useQueryClient()
  return () => {
    void qc.invalidateQueries({ queryKey: moderationKeys.all })
  }
}

export function useApproveModeration() {
  const invalidate = useInvalidateModeration()
  return useMutation({
    mutationFn: (id: string) => moderationApi.approve(id),
    onSuccess: invalidate,
  })
}

export function useRejectModeration() {
  const invalidate = useInvalidateModeration()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => moderationApi.reject(id, reason),
    onSuccess: invalidate,
  })
}

export function useRequestChanges() {
  const invalidate = useInvalidateModeration()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      moderationApi.requestChanges(id, reason),
    onSuccess: invalidate,
  })
}

export function useBlockModeration() {
  const invalidate = useInvalidateModeration()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => moderationApi.block(id, reason),
    onSuccess: invalidate,
  })
}

export function useCloseReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => reportsApi.close(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: moderationKeys.reports() }),
  })
}

export function useApplyReportAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => reportsApi.applyAction(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: moderationKeys.reports() }),
  })
}
