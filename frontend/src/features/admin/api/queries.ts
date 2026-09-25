import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  adminCompaniesApi,
  type AdminCompanyFilters,
  type PlatformCompanyStatus,
} from '@/shared/api/adminCompaniesApi'
import { adminUsersApi, type AdminUserFilters } from '@/shared/api/adminUsersApi'
import { analyticsApi } from '@/shared/api/analyticsApi'
import { auditApi } from '@/shared/api/auditApi'
import type { AuditFilters } from '@/shared/mocks/audit'
import { dictionariesApi } from '@/shared/api/dictionariesApi'
import type { DictionaryType } from '@/shared/mocks/dictionaries'
import { platformSettingsApi } from '@/shared/api/platformSettingsApi'
import type { PlatformSettings } from '@/shared/mocks/platformSettings'
import { useSessionStore } from '@/features/auth/model/sessionStore'

export const adminKeys = {
  users: (filters?: AdminUserFilters) => ['admin-users', filters] as const,
  user: (id: string) => ['admin-users', 'detail', id] as const,
  companies: (filters?: AdminCompanyFilters) => ['admin-companies', filters] as const,
  company: (id: string) => ['admin-companies', 'detail', id] as const,
  dictionaries: (type?: DictionaryType) => ['dictionaries', type] as const,
  analytics: ['platform-analytics'] as const,
  audit: (filters?: AuditFilters) => ['audit', filters] as const,
  settings: ['platform-settings'] as const,
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
  const actorId = useSessionStore.getState().user?.id ?? 'user-admin'
  return useMutation({
    mutationFn: (id: string) => adminUsersApi.block(id, actorId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })
}

export function useUnblockAdminUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminUsersApi.unblock(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-users'] }),
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
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PlatformCompanyStatus }) =>
      adminCompaniesApi.updateStatus(id, status),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-companies'] }),
  })
}

export function useSendCompanyToModeration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminCompaniesApi.sendToModeration(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-companies'] }),
  })
}

export function useBlockCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminCompaniesApi.block(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-companies'] }),
  })
}

export function useDictionaries(type?: DictionaryType) {
  return useQuery({
    queryKey: adminKeys.dictionaries(type),
    queryFn: () => dictionariesApi.list(type),
  })
}

export function useCreateDictionary() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: dictionariesApi.create.bind(dictionariesApi),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['dictionaries'] }),
  })
}

export function useUpdateDictionary() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => dictionariesApi.edit(id, name),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['dictionaries'] }),
  })
}

export function useArchiveDictionary() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => dictionariesApi.archive(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['dictionaries'] }),
  })
}

export function usePlatformAnalytics() {
  return useQuery({ queryKey: adminKeys.analytics, queryFn: () => analyticsApi.getOverview() })
}

export function useAdminAnalyticsOverview() {
  return usePlatformAnalytics()
}

export function useAuditLog(filters?: AuditFilters) {
  return useQuery({
    queryKey: adminKeys.audit(filters),
    queryFn: () => auditApi.list(filters),
  })
}

export function usePlatformSettings() {
  return useQuery({ queryKey: adminKeys.settings, queryFn: () => platformSettingsApi.get() })
}

export function useUpdatePlatformSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: Partial<PlatformSettings>) => platformSettingsApi.update(patch),
    onSuccess: () => void qc.invalidateQueries({ queryKey: adminKeys.settings }),
  })
}
