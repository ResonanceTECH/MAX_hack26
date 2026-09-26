import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CompanyMemberRole } from '@/entities/company-member'
import { companyKeys } from '@/entities/company/api/queries'
import { activityApi, type ActivityFilter } from '@/shared/api/activityApi'
import { casesApi, type CaseInput } from '@/shared/api/casesApi'
import { companyManagementApi, type CompanyProfileUpdate } from '@/shared/api/companyManagementApi'
import { documentsApi, type DocumentInput, type DocumentMetadataUpdate } from '@/shared/api/documentsApi'
import { servicesApi, type ServiceInput } from '@/shared/api/servicesApi'
import { settingsApi, type CompanySettingsPatch } from '@/shared/api/settingsApi'
import { teamApi, type InviteMemberInput } from '@/shared/api/teamApi'
import { verificationApi } from '@/shared/api/verificationApi'

export const companyManagementKeys = {
  all: ['company-management'] as const,
  current: (companyId: string) => [...companyManagementKeys.all, 'current', companyId] as const,
  completion: (companyId: string) =>
    [...companyManagementKeys.all, 'completion', companyId] as const,
  members: (companyId: string) => [...companyManagementKeys.all, 'members', companyId] as const,
  member: (memberId: string) => [...companyManagementKeys.all, 'member', memberId] as const,
  services: (companyId: string) => [...companyManagementKeys.all, 'services', companyId] as const,
  service: (serviceId: string) => [...companyManagementKeys.all, 'service', serviceId] as const,
  cases: (companyId: string) => [...companyManagementKeys.all, 'cases', companyId] as const,
  case: (caseId: string) => [...companyManagementKeys.all, 'case', caseId] as const,
  documents: (companyId: string) =>
    [...companyManagementKeys.all, 'documents', companyId] as const,
  document: (documentId: string) =>
    [...companyManagementKeys.all, 'document', documentId] as const,
  activity: (companyId: string) => [...companyManagementKeys.all, 'activity', companyId] as const,
  settings: (companyId: string) => [...companyManagementKeys.all, 'settings', companyId] as const,
  verification: (companyId: string) =>
    [...companyManagementKeys.all, 'verification', companyId] as const,
}

/** @deprecated use companyManagementKeys */
export const companyMgmtKeys = {
  members: companyManagementKeys.members,
  services: companyManagementKeys.services,
  cases: companyManagementKeys.cases,
  documents: companyManagementKeys.documents,
}

function invalidateCompanyCore(qc: ReturnType<typeof useQueryClient>, companyId?: string) {
  if (!companyId) return
  void qc.invalidateQueries({ queryKey: companyManagementKeys.activity(companyId) })
  void qc.invalidateQueries({ queryKey: companyManagementKeys.completion(companyId) })
  void qc.invalidateQueries({ queryKey: companyManagementKeys.current(companyId) })
}

export function useCurrentCompany(companyId: string | undefined) {
  return useQuery({
    queryKey: companyManagementKeys.current(companyId ?? ''),
    queryFn: () => companyManagementApi.getCurrent(companyId!),
    enabled: Boolean(companyId),
  })
}

export function useCompanyCompletion(companyId: string | undefined) {
  return useQuery({
    queryKey: companyManagementKeys.completion(companyId ?? ''),
    queryFn: () => companyManagementApi.getCompletion(companyId!),
    enabled: Boolean(companyId),
  })
}

export function useCompanyActivity(companyId: string | undefined, filter?: ActivityFilter) {
  return useQuery({
    queryKey: [...companyManagementKeys.activity(companyId ?? ''), filter ?? {}] as const,
    queryFn: () => activityApi.getAll({ ...filter, companyId: companyId! }),
    enabled: Boolean(companyId),
  })
}

export function useCompanySettings(companyId: string | undefined) {
  return useQuery({
    queryKey: companyManagementKeys.settings(companyId ?? ''),
    queryFn: () => settingsApi.get(companyId!),
    enabled: Boolean(companyId),
  })
}

export function useUpdateCompanySettings(companyId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: CompanySettingsPatch) => {
      if (!companyId) throw new Error('Компания не выбрана')
      return settingsApi.update(patch, companyId)
    },
    onSuccess: () => {
      if (companyId) {
        void qc.invalidateQueries({ queryKey: companyManagementKeys.settings(companyId) })
        invalidateCompanyCore(qc, companyId)
      }
    },
  })
}

export function useCompanyVerification(companyId: string | undefined) {
  return useQuery({
    queryKey: companyManagementKeys.verification(companyId ?? ''),
    queryFn: () => verificationApi.get(companyId!),
    enabled: Boolean(companyId),
  })
}

export function useSubmitVerification(companyId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => verificationApi.submit(),
    onSuccess: () => {
      if (companyId) {
        void qc.invalidateQueries({ queryKey: companyManagementKeys.verification(companyId) })
        invalidateCompanyCore(qc, companyId)
      }
    },
  })
}

export function useCompanyMembers(companyId: string | undefined) {
  return useQuery({
    queryKey: companyManagementKeys.members(companyId ?? ''),
    queryFn: () => teamApi.list(companyId!),
    enabled: Boolean(companyId),
  })
}

export function useCompanyMember(memberId: string | undefined) {
  return useQuery({
    queryKey: companyManagementKeys.member(memberId ?? ''),
    queryFn: () => teamApi.getById(memberId!),
    enabled: Boolean(memberId),
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
        invalidateCompanyCore(qc, companyId)
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
        invalidateCompanyCore(qc, companyId)
      }
    },
  })
}

export function useSuspendMember(companyId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (memberId: string) => teamApi.suspend(memberId),
    onSuccess: () => {
      if (companyId) {
        void qc.invalidateQueries({ queryKey: companyManagementKeys.members(companyId) })
        invalidateCompanyCore(qc, companyId)
      }
    },
  })
}

/** @deprecated use useSuspendMember */
export function useBlockMember(companyId: string | undefined) {
  return useSuspendMember(companyId)
}

export function useActivateMember(companyId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (memberId: string) => teamApi.activate(memberId),
    onSuccess: () => {
      if (companyId) {
        void qc.invalidateQueries({ queryKey: companyManagementKeys.members(companyId) })
        invalidateCompanyCore(qc, companyId)
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
        invalidateCompanyCore(qc, companyId)
      }
    },
  })
}

export function useResendMemberInvite(companyId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (memberId: string) => teamApi.resendInvite(memberId),
    onSuccess: (_data, memberId) => {
      if (companyId) {
        void qc.invalidateQueries({ queryKey: companyManagementKeys.members(companyId) })
        void qc.invalidateQueries({ queryKey: companyManagementKeys.member(memberId) })
        invalidateCompanyCore(qc, companyId)
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

export function useCompanyService(serviceId: string | undefined) {
  return useQuery({
    queryKey: companyManagementKeys.service(serviceId ?? ''),
    queryFn: () => servicesApi.getById(serviceId!),
    enabled: Boolean(serviceId),
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
        invalidateCompanyCore(qc, companyId)
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
        invalidateCompanyCore(qc, companyId)
      }
    },
  })
}

export function usePublishService(companyId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => servicesApi.publish(id),
    onSuccess: () => {
      if (companyId) {
        void qc.invalidateQueries({ queryKey: companyManagementKeys.services(companyId) })
        invalidateCompanyCore(qc, companyId)
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
        invalidateCompanyCore(qc, companyId)
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
        invalidateCompanyCore(qc, companyId)
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

export function useCompanyCase(caseId: string | undefined) {
  return useQuery({
    queryKey: companyManagementKeys.case(caseId ?? ''),
    queryFn: () => casesApi.getById(caseId!),
    enabled: Boolean(caseId),
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
        invalidateCompanyCore(qc, companyId)
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
        invalidateCompanyCore(qc, companyId)
      }
    },
  })
}

export function usePublishCase(companyId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => casesApi.publish(id),
    onSuccess: () => {
      if (companyId) {
        void qc.invalidateQueries({ queryKey: companyManagementKeys.cases(companyId) })
        invalidateCompanyCore(qc, companyId)
      }
    },
  })
}

export function useArchiveCase(companyId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => casesApi.archive(id),
    onSuccess: () => {
      if (companyId) {
        void qc.invalidateQueries({ queryKey: companyManagementKeys.cases(companyId) })
        invalidateCompanyCore(qc, companyId)
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
        invalidateCompanyCore(qc, companyId)
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

export function useCompanyDocument(documentId: string | undefined) {
  return useQuery({
    queryKey: companyManagementKeys.document(documentId ?? ''),
    queryFn: () => documentsApi.getById(documentId!),
    enabled: Boolean(documentId),
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
        invalidateCompanyCore(qc, companyId)
      }
    },
  })
}

export function useUpdateDocument(companyId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: DocumentMetadataUpdate }) =>
      documentsApi.update(id, patch),
    onSuccess: () => {
      if (companyId) {
        void qc.invalidateQueries({ queryKey: companyManagementKeys.documents(companyId) })
        invalidateCompanyCore(qc, companyId)
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
        invalidateCompanyCore(qc, companyId)
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
        invalidateCompanyCore(qc, companyId)
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
        invalidateCompanyCore(qc, companyId)
      }
      void qc.invalidateQueries({ queryKey: companyKeys.all })
    },
  })
}
