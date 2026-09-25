import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  ApproveInput,
  BlockInput,
  EscalateInput,
  ModerationQueueFilters,
  RejectInput,
  RequestChangesInput,
} from '@/entities/moderation'
import type { ResolveReportInput } from '@/entities/report'
import type { HistoryFilters } from '@/shared/api/moderationHistoryApi'
import type { ReportListFilters } from '@/shared/api/reportsApi'
import { escalationsApi } from '@/shared/api/escalationsApi'
import { moderationApi } from '@/shared/api/moderationApi'
import { moderationHistoryApi } from '@/shared/api/moderationHistoryApi'
import { moderatorNotificationsApi } from '@/shared/api/moderatorNotificationsApi'
import { reportsApi } from '@/shared/api/reportsApi'

export const moderationKeys = {
  all: ['moderation'] as const,
  dashboard: () => [...moderationKeys.all, 'dashboard'] as const,
  summary: () => [...moderationKeys.all, 'dashboard'] as const,
  queue: (filters?: ModerationQueueFilters) => [...moderationKeys.all, 'queue', filters] as const,
  detail: (type: string, id: string) => [...moderationKeys.all, 'detail', type, id] as const,
  related: (id: string) => [...moderationKeys.all, 'related', id] as const,
  history: (filters?: HistoryFilters) => [...moderationKeys.all, 'history', filters] as const,
  historyDetail: (id: string) => [...moderationKeys.all, 'history-detail', id] as const,
  reports: (filters?: ReportListFilters) => [...moderationKeys.all, 'reports', filters] as const,
  report: (id: string) => [...moderationKeys.all, 'report', id] as const,
  escalations: () => [...moderationKeys.all, 'escalations'] as const,
  escalation: (id: string) => [...moderationKeys.all, 'escalation', id] as const,
  notifications: () => [...moderationKeys.all, 'notifications'] as const,
}

function useInvalidateModeration() {
  const qc = useQueryClient()
  return () => {
    void qc.invalidateQueries({ queryKey: moderationKeys.all })
  }
}

export function useModerationDashboard() {
  return useQuery({
    queryKey: moderationKeys.dashboard(),
    queryFn: () => moderationApi.getDashboard(),
  })
}

/** @deprecated */
export function useModerationSummary() {
  return useModerationDashboard()
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

export function useModerationRelatedData(id: string | undefined) {
  return useQuery({
    queryKey: moderationKeys.related(id ?? ''),
    queryFn: () => moderationApi.getRelatedData(id!),
    enabled: Boolean(id),
  })
}

export function useModerationHistory(filters?: HistoryFilters) {
  return useQuery({
    queryKey: moderationKeys.history(filters),
    queryFn: () => moderationHistoryApi.getAll(filters),
  })
}

export function useModerationHistoryEntry(id: string) {
  return useQuery({
    queryKey: moderationKeys.historyDetail(id),
    queryFn: () => moderationHistoryApi.getById(id),
    enabled: Boolean(id),
  })
}

export function useReports(filters?: ReportListFilters) {
  return useQuery({
    queryKey: moderationKeys.reports(filters),
    queryFn: () => reportsApi.getAll(filters),
  })
}

export function useReport(id: string) {
  return useQuery({
    queryKey: moderationKeys.report(id),
    queryFn: () => reportsApi.getById(id),
    enabled: Boolean(id),
  })
}

export function useEscalations() {
  return useQuery({
    queryKey: moderationKeys.escalations(),
    queryFn: () => escalationsApi.getAll(),
  })
}

export function useEscalation(id: string) {
  return useQuery({
    queryKey: moderationKeys.escalation(id),
    queryFn: () => escalationsApi.getById(id),
    enabled: Boolean(id),
  })
}

export function useModeratorNotifications() {
  return useQuery({
    queryKey: moderationKeys.notifications(),
    queryFn: () => moderatorNotificationsApi.getAll(),
  })
}

export function useAssignModerationItem() {
  const invalidate = useInvalidateModeration()
  return useMutation({
    mutationFn: (id: string) => moderationApi.assignToMe(id),
    onSuccess: invalidate,
  })
}

export function useApproveModerationItem() {
  const invalidate = useInvalidateModeration()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input?: ApproveInput }) =>
      moderationApi.approve(id, input),
    onSuccess: invalidate,
  })
}

/** @deprecated */
export function useApproveModeration() {
  const m = useApproveModerationItem()
  return {
    ...m,
    mutateAsync: (id: string) => m.mutateAsync({ id }),
  }
}

export function useRejectModerationItem() {
  const invalidate = useInvalidateModeration()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RejectInput }) =>
      moderationApi.reject(id, input),
    onSuccess: invalidate,
  })
}

/** @deprecated */
export function useRejectModeration() {
  const m = useRejectModerationItem()
  return {
    ...m,
    mutateAsync: ({ id, reason }: { id: string; reason: string }) =>
      m.mutateAsync({ id, input: { reasonCode: 'OTHER', comment: reason } }),
  }
}

export function useRequestModerationChanges() {
  const invalidate = useInvalidateModeration()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RequestChangesInput }) =>
      moderationApi.requestChanges(id, input),
    onSuccess: invalidate,
  })
}

/** @deprecated */
export function useRequestChanges() {
  const m = useRequestModerationChanges()
  return {
    ...m,
    mutateAsync: ({ id, reason }: { id: string; reason: string }) =>
      m.mutateAsync({
        id,
        input: { fields: ['description'], comment: reason },
      }),
  }
}

export function useBlockModerationItem() {
  const invalidate = useInvalidateModeration()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: BlockInput }) =>
      moderationApi.block(id, input),
    onSuccess: invalidate,
  })
}

/** @deprecated */
export function useBlockModeration() {
  const m = useBlockModerationItem()
  return {
    ...m,
    mutateAsync: ({ id, reason }: { id: string; reason: string }) =>
      m.mutateAsync({ id, input: { reasonCode: 'OTHER', comment: reason } }),
  }
}

export function useEscalateModerationItem() {
  const invalidate = useInvalidateModeration()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EscalateInput }) =>
      moderationApi.escalate(id, input),
    onSuccess: invalidate,
  })
}

export function useResubmitModerationItem() {
  const invalidate = useInvalidateModeration()
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string
      patch: Record<string, string | number | boolean | null>
    }) => moderationApi.resubmit(id, patch),
    onSuccess: invalidate,
  })
}

export function useResolveReport() {
  const invalidate = useInvalidateModeration()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ResolveReportInput }) =>
      reportsApi.resolve(id, input),
    onSuccess: invalidate,
  })
}

export function useEscalateReport() {
  const invalidate = useInvalidateModeration()
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      reportsApi.escalate(id, comment),
    onSuccess: invalidate,
  })
}

export function useAssignReport() {
  const invalidate = useInvalidateModeration()
  return useMutation({
    mutationFn: (id: string) => reportsApi.assignToMe(id),
    onSuccess: invalidate,
  })
}

/** @deprecated */
export function useCloseReport() {
  const m = useResolveReport()
  return {
    ...m,
    mutateAsync: (id: string) =>
      m.mutateAsync({ id, input: { resolutionCode: 'NO_VIOLATION' } }),
  }
}

/** @deprecated */
export function useApplyReportAction() {
  const m = useResolveReport()
  return {
    ...m,
    mutateAsync: (id: string) =>
      m.mutateAsync({
        id,
        input: { resolutionCode: 'ACTION_TAKEN', applyAction: 'request_changes' },
      }),
  }
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => moderatorNotificationsApi.markRead(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: moderationKeys.notifications() })
      const prev = qc.getQueryData(moderationKeys.notifications())
      qc.setQueryData(moderationKeys.notifications(), (old: unknown) => {
        if (!Array.isArray(old)) return old
        return old.map((n: { id: string; read: boolean }) =>
          n.id === id ? { ...n, read: true } : n,
        )
      })
      return { prev }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(moderationKeys.notifications(), ctx.prev)
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: moderationKeys.notifications() })
    },
  })
}
