import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  adminCompaniesApi,
  type AdminCompanyFilters,
  type PlatformCompanyStatus,
  type VerificationStatus,
} from '@/shared/api/adminCompaniesApi'
import { adminUsersApi, type AdminActor, type AdminUserFilters } from '@/shared/api/adminUsersApi'
import { analyticsApi, type AnalyticsPeriod } from '@/shared/api/analyticsApi'
import { auditApi } from '@/shared/api/auditApi'
import type { AuditFilters } from '@/shared/mocks/audit'
import { dictionariesApi, type DictionaryCreateInput, type DictionaryUpdateInput } from '@/shared/api/dictionariesApi'
import type { DictionaryType } from '@/shared/mocks/dictionaries'
import { platformSettingsApi } from '@/shared/api/platformSettingsApi'
import type { PlatformSettings } from '@/shared/mocks/platformSettings'
import { featureFlagsApi } from '@/shared/api/featureFlagsApi'
import { adminNotificationsApi } from '@/shared/api/adminNotificationsApi'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { SYSTEM_ROLES, type SystemRole } from '@/entities/user'
import { escalationsApi } from '@/shared/api/escalationsApi'

function useActor(): AdminActor {
  const user = useSessionStore((s) => s.user)
  return {
    id: user?.id ?? 'user-platform-admin',
    name: user ? `${user.firstName} ${user.lastName}` : 'Александр Иванов',
    role: user?.role ?? SYSTEM_ROLES.PLATFORM_ADMIN,
  }
}

export const adminKeys = {
  dashboard: ['admin-dashboard'] as const,
  users: (filters?: AdminUserFilters) => ['admin-users', filters] as const,
  user: (id: string) => ['admin-users', 'detail', id] as const,
  companies: (filters?: AdminCompanyFilters) => ['admin-companies', filters] as const,
  company: (id: string) => ['admin-companies', 'detail', id] as const,
  dictionaries: (type?: DictionaryType) => ['dictionaries', type] as const,
  dictionary: (id: string) => ['dictionaries', 'detail', id] as const,
  analytics: (period?: AnalyticsPeriod) => ['platform-analytics', period] as const,
  audit: (filters?: AuditFilters) => ['audit', filters] as const,
  auditEvent: (id: string) => ['audit', 'detail', id] as const,
  settings: ['platform-settings'] as const,
  health: ['platform-health'] as const,
  flags: ['feature-flags'] as const,
  flag: (id: string) => ['feature-flags', id] as const,
  notifications: ['admin-notifications'] as const,
}

function invalidateAdminCore(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ['admin-users'] })
  void qc.invalidateQueries({ queryKey: ['admin-companies'] })
  void qc.invalidateQueries({ queryKey: adminKeys.dashboard })
  void qc.invalidateQueries({ queryKey: ['audit'] })
  void qc.invalidateQueries({ queryKey: ['platform-analytics'] })
}

export function useAdminDashboard(period: AnalyticsPeriod = '30d') {
  return useQuery({
    queryKey: [...adminKeys.dashboard, period],
    queryFn: async () => {
      const [overview, health, recentAudit] = await Promise.all([
        analyticsApi.getOverview(period),
        platformSettingsApi.getHealth(),
        auditApi.list({}),
      ])
      return {
        overview,
        health,
        recentActivity: recentAudit.slice(0, 8),
      }
    },
  })
}

export function useAdminUsers(filters?: AdminUserFilters) {
  return useQuery({
    queryKey: adminKeys.users(filters),
    queryFn: () => adminUsersApi.list(filters),
  })
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: adminKeys.user(id),
    queryFn: () => adminUsersApi.getById(id),
    enabled: Boolean(id),
  })
}

export function useBlockAdminUser() {
  const qc = useQueryClient()
  const actor = useActor()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminUsersApi.block(id, { reason, actor, currentUserId: actor.id }),
    onSuccess: (_data, vars) => {
      invalidateAdminCore(qc)
      void qc.invalidateQueries({ queryKey: adminKeys.user(vars.id) })
    },
  })
}

export function useUnblockAdminUser() {
  const qc = useQueryClient()
  const actor = useActor()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      adminUsersApi.unblock(id, { reason, actor }),
    onSuccess: (_data, vars) => {
      invalidateAdminCore(qc)
      void qc.invalidateQueries({ queryKey: adminKeys.user(vars.id) })
    },
  })
}

export function useSuspendUser() {
  const qc = useQueryClient()
  const actor = useActor()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminUsersApi.suspend(id, { reason, actor, currentUserId: actor.id }),
    onSuccess: (_data, vars) => {
      invalidateAdminCore(qc)
      void qc.invalidateQueries({ queryKey: adminKeys.user(vars.id) })
    },
  })
}

export function useActivateUser() {
  const qc = useQueryClient()
  const actor = useActor()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      adminUsersApi.activate(id, { reason, actor }),
    onSuccess: (_data, vars) => {
      invalidateAdminCore(qc)
      void qc.invalidateQueries({ queryKey: adminKeys.user(vars.id) })
    },
  })
}

export function useChangeUserRole() {
  const qc = useQueryClient()
  const actor = useActor()
  return useMutation({
    mutationFn: ({
      id,
      newRole,
      reason,
    }: {
      id: string
      newRole: SystemRole
      reason: string
    }) => adminUsersApi.changeRole(id, { newRole, reason, actor, currentUserId: actor.id }),
    onSuccess: (_data, vars) => {
      invalidateAdminCore(qc)
      void qc.invalidateQueries({ queryKey: adminKeys.user(vars.id) })
    },
  })
}

/** Aliases */
export const useBlockUser = useBlockAdminUser
export const useUnblockUser = useUnblockAdminUser

export function useAdminCompanies(filters?: AdminCompanyFilters) {
  return useQuery({
    queryKey: adminKeys.companies(filters),
    queryFn: () => adminCompaniesApi.list(filters),
  })
}

export function useAdminCompany(id: string) {
  return useQuery({
    queryKey: adminKeys.company(id),
    queryFn: () => adminCompaniesApi.getById(id),
    enabled: Boolean(id),
  })
}

export function useUpdateCompanyStatus() {
  const qc = useQueryClient()
  const actor = useActor()
  return useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string
      status: PlatformCompanyStatus
      reason: string
    }) => adminCompaniesApi.changeStatus(id, status, reason, actor),
    onSuccess: (_d, vars) => {
      invalidateAdminCore(qc)
      void qc.invalidateQueries({ queryKey: adminKeys.company(vars.id) })
    },
  })
}

export function useChangeCompanyVerification() {
  const qc = useQueryClient()
  const actor = useActor()
  return useMutation({
    mutationFn: ({
      id,
      verificationStatus,
      reason,
    }: {
      id: string
      verificationStatus: VerificationStatus
      reason: string
    }) => adminCompaniesApi.changeVerification(id, verificationStatus, reason, actor),
    onSuccess: (_d, vars) => {
      invalidateAdminCore(qc)
      void qc.invalidateQueries({ queryKey: adminKeys.company(vars.id) })
    },
  })
}

export function useSendCompanyToModeration() {
  const qc = useQueryClient()
  const actor = useActor()
  return useMutation({
    mutationFn: (id: string) => adminCompaniesApi.sendToModeration(id, actor),
    onSuccess: (_d, id) => {
      invalidateAdminCore(qc)
      void qc.invalidateQueries({ queryKey: adminKeys.company(id) })
    },
  })
}

export function useBlockCompany() {
  const qc = useQueryClient()
  const actor = useActor()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminCompaniesApi.block(id, reason, actor),
    onSuccess: (_d, vars) => {
      invalidateAdminCore(qc)
      void qc.invalidateQueries({ queryKey: adminKeys.company(vars.id) })
    },
  })
}

export function useArchiveCompany() {
  const qc = useQueryClient()
  const actor = useActor()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminCompaniesApi.archive(id, reason, actor),
    onSuccess: (_d, vars) => {
      invalidateAdminCore(qc)
      void qc.invalidateQueries({ queryKey: adminKeys.company(vars.id) })
    },
  })
}

export function useDictionaries(type?: DictionaryType) {
  return useQuery({
    queryKey: adminKeys.dictionaries(type),
    queryFn: () => dictionariesApi.list(type),
  })
}

export function useDictionary(id: string) {
  return useQuery({
    queryKey: adminKeys.dictionary(id),
    queryFn: () => dictionariesApi.getById(id),
    enabled: Boolean(id),
  })
}

export function useCreateDictionary() {
  const qc = useQueryClient()
  const actor = useActor()
  return useMutation({
    mutationFn: (input: DictionaryCreateInput) => dictionariesApi.create(input, actor),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['dictionaries'] })
      void qc.invalidateQueries({ queryKey: ['audit'] })
    },
  })
}

export function useUpdateDictionary() {
  const qc = useQueryClient()
  const actor = useActor()
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string } & DictionaryUpdateInput) =>
      dictionariesApi.update(id, patch, actor),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['dictionaries'] })
      void qc.invalidateQueries({ queryKey: ['audit'] })
    },
  })
}

export function useArchiveDictionary() {
  const qc = useQueryClient()
  const actor = useActor()
  return useMutation({
    mutationFn: (id: string) => dictionariesApi.archive(id, actor),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['dictionaries'] })
      void qc.invalidateQueries({ queryKey: ['audit'] })
    },
  })
}

export function usePlatformAnalytics(period: AnalyticsPeriod = '30d') {
  return useQuery({
    queryKey: adminKeys.analytics(period),
    queryFn: () => analyticsApi.getOverview(period),
  })
}

export function useAdminAnalyticsOverview(period: AnalyticsPeriod = '30d') {
  return usePlatformAnalytics(period)
}

export function useAuditLog(filters?: AuditFilters) {
  return useQuery({
    queryKey: adminKeys.audit(filters),
    queryFn: () => auditApi.list(filters),
  })
}

export function useAuditEvent(id: string) {
  return useQuery({
    queryKey: adminKeys.auditEvent(id),
    queryFn: () => auditApi.getById(id),
    enabled: Boolean(id),
  })
}

export function usePlatformSettings() {
  return useQuery({ queryKey: adminKeys.settings, queryFn: () => platformSettingsApi.get() })
}

export function useUpdatePlatformSettings() {
  const qc = useQueryClient()
  const actor = useActor()
  return useMutation({
    mutationFn: (patch: Partial<PlatformSettings>) => platformSettingsApi.update(patch, actor),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.settings })
      void qc.invalidateQueries({ queryKey: ['audit'] })
    },
  })
}

export function useSetMaintenanceMode() {
  const qc = useQueryClient()
  const actor = useActor()
  return useMutation({
    mutationFn: ({
      enabled,
      reason,
      message,
    }: {
      enabled: boolean
      reason: string
      message?: string
    }) => platformSettingsApi.setMaintenanceMode(enabled, reason, message, actor),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.settings })
      void qc.invalidateQueries({ queryKey: adminKeys.health })
      void qc.invalidateQueries({ queryKey: ['audit'] })
      void qc.invalidateQueries({ queryKey: adminKeys.dashboard })
    },
  })
}

export function useFeatureFlags() {
  return useQuery({ queryKey: adminKeys.flags, queryFn: () => featureFlagsApi.getAll() })
}

export function useToggleFeatureFlag() {
  const qc = useQueryClient()
  const actor = useActor()
  return useMutation({
    mutationFn: ({
      key,
      enabled,
      reason,
    }: {
      key: string
      enabled: boolean
      reason: string
    }) => featureFlagsApi.toggle(key, enabled, reason, actor),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.flags })
      void qc.invalidateQueries({ queryKey: ['audit'] })
    },
  })
}

export function useAdminNotifications(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: adminKeys.notifications,
    queryFn: () => adminNotificationsApi.getAll(),
    enabled: options?.enabled ?? true,
  })
}

export function useAdminUnreadCount() {
  const role = useSessionStore((s) => s.role)
  const enabled = role === SYSTEM_ROLES.PLATFORM_ADMIN
  const query = useAdminNotifications({ enabled })
  const unread = (query.data ?? []).filter((n) => !n.read).length
  return { unread: enabled ? unread : 0, isLoading: query.isLoading }
}

export function useMarkAdminNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminNotificationsApi.markRead(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: adminKeys.notifications })
      const prev = qc.getQueryData<Awaited<ReturnType<typeof adminNotificationsApi.getAll>>>(
        adminKeys.notifications,
      )
      if (prev) {
        qc.setQueryData(
          adminKeys.notifications,
          prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
        )
      }
      return { prev }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(adminKeys.notifications, ctx.prev)
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: adminKeys.notifications }),
  })
}

export function useMarkAllAdminNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => adminNotificationsApi.markAllRead(),
    onSuccess: () => void qc.invalidateQueries({ queryKey: adminKeys.notifications }),
  })
}

export function useResolveEscalation() {
  const qc = useQueryClient()
  const actor = useActor()
  return useMutation({
    mutationFn: async ({
      id,
      reason,
      decision,
    }: {
      id: string
      reason: string
      decision: string
    }) => {
      return escalationsApi.resolve(id, { reason, decision, actor })
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['moderation'] })
      void qc.invalidateQueries({ queryKey: ['audit'] })
      void qc.invalidateQueries({ queryKey: adminKeys.dashboard })
    },
  })
}
