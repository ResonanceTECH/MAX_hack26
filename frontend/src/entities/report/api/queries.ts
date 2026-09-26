import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateReportInput } from '@/entities/report'
import { reportsApi } from '@/shared/api/reportsApi'

export const reportKeys = {
  all: ['reports'] as const,
}

export function useCreateReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateReportInput) => reportsApi.create(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: reportKeys.all })
    },
  })
}
