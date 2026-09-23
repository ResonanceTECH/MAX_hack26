import { useQuery } from '@tanstack/react-query'
import { companyApi, type CompanyFilters } from '@/shared/api/companyApi'

export const companyKeys = {
  all: ['companies'] as const,
  list: (filters?: CompanyFilters) => [...companyKeys.all, 'list', filters] as const,
  detail: (id: string) => [...companyKeys.all, 'detail', id] as const,
}

export function useCompanies(filters?: CompanyFilters) {
  return useQuery({
    queryKey: companyKeys.list(filters),
    queryFn: () => companyApi.getAll(filters),
  })
}

export function useCompany(id: string) {
  return useQuery({
    queryKey: companyKeys.detail(id),
    queryFn: () => companyApi.getById(id),
    enabled: Boolean(id),
  })
}
