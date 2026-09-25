import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CompanyMemberRole } from '@/entities/company-member'
import { companyKeys } from '@/entities/company/api/queries'
import { casesApi, type CaseInput } from '@/shared/api/casesApi'
import { companyManagementApi, type CompanyProfileUpdate } from '@/shared/api/companyManagementApi'
import { documentsApi, type DocumentInput } from '@/shared/api/documentsApi'
import { servicesApi, type ServiceInput } from '@/shared/api/servicesApi'
import { teamApi, type InviteMemberInput } from '@/shared/api/teamApi'

export const companyManagementKeys = {
  all: ['company-management'] as const,
  members: (companyId: string) => [...companyManagementKeys.all, 'members', companyId] as const,
  services: (companyId: string) => [...companyManagementKeys.all, 'services', companyId] as const,
  cases: (companyId: string) => [...companyManagementKeys.all, 'cases', companyId] as const,
  documents: (companyId: string) =>
    [...companyManagementKeys.all, 'documents', companyId] as const,
}

/** @deprecated use companyManagementKeys */
export const companyMgmtKeys = {
  members: companyManagementKeys.members,
  services: companyManagementKeys.services,
  cases: companyManagementKeys.cases,
  documents: companyManagementKeys.documents,
}

export function useCompanyMembers(companyId: string | undefined) {
  return useQuery({
    queryKey: companyManagementKeys.members(companyId ?? ''),
    queryFn: () => teamApi.list(companyId!),
    enabled: Boolean(companyId),
  })
}

export function useInviteMember(companyId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: InviteMemberInput) => {
      if (!companyId) throw new Error('Компания не выбрана')
      return teamApi.invite(input, companyId)
    },
    onSuccess: () => {
      if (companyId) {
        void qc.invalidateQueries({ queryKey: companyManagementKeys.members(companyId) })
      }
    },
  })
}

export function useUpdateMemberRole(companyId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: CompanyMemberRole }) =>
      teamApi.updateRole(memberId, role),
    onSuccess: () => {
      if (companyId) {
        void qc.invalidateQueries({ queryKey: companyManagementKeys.members(companyId) })
      }
    },
  })
}

export function useBlockMember(companyId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (memberId: string) => teamApi.block(memberId),
    onSuccess: () => {
      if (companyId) {
        void qc.invalidateQueries({ queryKey: companyManagementKeys.members(companyId) })
      }
    },
  })
}

export function useRemoveMember(companyId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (memberId: string) => teamApi.remove(memberId),
    onSuccess: () => {
      if (companyId) {
        void qc.invalidateQueries({ queryKey: companyManagementKeys.members(companyId) })
      }
    },
  })
}

export function useCompanyServices(companyId: string | undefined) {
  return useQuery({
    queryKey: companyManagementKeys.services(companyId ?? ''),
    queryFn: () => servicesApi.list(companyId!),
    enabled: Boolean(companyId),
  })
}

export function useCreateService(companyId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ServiceInput) => {
      if (!companyId) throw new Error('Компания не выбрана')
      return servicesApi.create(input, companyId)
    },
    onSuccess: () => {
      if (companyId) {
        void qc.invalidateQueries({ queryKey: companyManagementKeys.services(companyId) })
      }
    },
  })
}

export function useUpdateService(companyId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ServiceInput> }) =>
      servicesApi.update(id, input),
    onSuccess: () => {
      if (companyId) {
        void qc.invalidateQueries({ queryKey: companyManagementKeys.services(companyId) })
      }
    },
  })
}

export function useArchiveService(companyId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => servicesApi.archive(id),
    onSuccess: () => {
      if (companyId) {
        void qc.invalidateQueries({ queryKey: companyManagementKeys.services(companyId) })
      }
    },
  })
}

export function useHideService(companyId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => servicesApi.hide(id),
    onSuccess: () => {
      if (companyId) {
        void qc.invalidateQueries({ queryKey: companyManagementKeys.services(companyId) })
      }
    },
  })
}

export function useCompanyCases(companyId: string | undefined) {
  return useQuery({
    queryKey: companyManagementKeys.cases(companyId ?? ''),
    queryFn: () => casesApi.list(companyId!),
    enabled: Boolean(companyId),
  })
}

export function useCreateCase(companyId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CaseInput) => {
      if (!companyId) throw new Error('Компания не выбрана')
      return casesApi.create(input, companyId)
    },
    onSuccess: () => {
      if (companyId) {
        void qc.invalidateQueries({ queryKey: companyManagementKeys.cases(companyId) })
      }
    },
  })
}

export function useUpdateCase(companyId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CaseInput> }) =>
      casesApi.update(id, input),
    onSuccess: () => {
      if (companyId) {
        void qc.invalidateQueries({ queryKey: companyManagementKeys.cases(companyId) })
      }
    },
  })
}

export function useDeleteCase(companyId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => casesApi.remove(id),
    onSuccess: () => {
      if (companyId) {
        void qc.invalidateQueries({ queryKey: companyManagementKeys.cases(companyId) })
      }
    },
  })
}

export function useCompanyDocuments(companyId: string | undefined) {
  return useQuery({
    queryKey: companyManagementKeys.documents(companyId ?? ''),
    queryFn: () => documentsApi.list(companyId!),
    enabled: Boolean(companyId),
  })
}

export function useAddDocument(companyId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: DocumentInput) => {
      if (!companyId) throw new Error('Компания не выбрана')
      return documentsApi.add(input, companyId)
    },
    onSuccess: () => {
      if (companyId) {
        void qc.invalidateQueries({ queryKey: companyManagementKeys.documents(companyId) })
      }
    },
  })
}

export function useRemoveDocument(companyId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => documentsApi.remove(id),
    onSuccess: () => {
      if (companyId) {
        void qc.invalidateQueries({ queryKey: companyManagementKeys.documents(companyId) })
      }
    },
  })
}

export function useReplaceDocument(companyId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: DocumentInput }) =>
      documentsApi.replace(id, input),
    onSuccess: () => {
      if (companyId) {
        void qc.invalidateQueries({ queryKey: companyManagementKeys.documents(companyId) })
      }
    },
  })
}

export function useUpdateCompanyProfile(companyId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: CompanyProfileUpdate) => {
      if (!companyId) throw new Error('Компания не выбрана')
      return companyManagementApi.updateProfile(companyId, patch)
    },
    onSuccess: () => {
      if (companyId) {
        void qc.invalidateQueries({ queryKey: companyKeys.detail(companyId) })
      }
      void qc.invalidateQueries({ queryKey: companyKeys.all })
    },
  })
}
