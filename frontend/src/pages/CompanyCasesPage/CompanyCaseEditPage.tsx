import { useEffect } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import {
  caseSchema,
  type CaseFormValues,
  useCompanyCase,
  useUpdateCase,
} from '@/features/company-management'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { companyCasePath, ROUTES } from '@/shared/constants/routes'
import { AppButton, ErrorState, LoadingState, PageHeader } from '@/shared/ui'
import { CaseFormFields } from './CaseFormFields'

export function CompanyCaseEditPage() {
  const { caseId = '' } = useParams()
  const navigate = useNavigate()
  const companyId = useSessionStore((s) => s.company?.id)
  const { data, isLoading, isError, refetch } = useCompanyCase(caseId)
  const updateCase = useUpdateCase(companyId)
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)

  const form = useForm<CaseFormValues>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      title: '',
      industry: '',
      description: '',
      result: '',
      technologies: [],
    },
  })

  useEffect(() => {
    if (!data) return
    form.reset({
      title: data.title,
      industry: data.industry,
      description: data.description,
      result: data.result,
      technologies: data.technologies,
      clientName: data.clientName,
      status: data.status,
    })
  }, [data, form])

  if (isLoading) return <LoadingState variant="page" />
  if (isError || !data) return <ErrorState onRetry={() => void refetch()} />

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await updateCase.mutateAsync({ id: data.id, input: values })
      showSuccess('Кейс обновлён')
      void navigate(companyCasePath(data.id))
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Ошибка сохранения')
    }
  })

  return (
    <Box>
      <PageHeader
        title="Редактирование кейса"
        subtitle={data.title}
        actions={
          <AppButton component={RouterLink} to={ROUTES.PROFILE_COMPANY_CASES} variant="outlined">
            К списку
          </AppButton>
        }
      />
      <Stack component="form" spacing={2} maxWidth={560} onSubmit={onSubmit}>
        <CaseFormFields control={form.control} />
        <AppButton type="submit" variant="contained" loading={updateCase.isPending}>
          Сохранить
        </AppButton>
      </Stack>
    </Box>
  )
}
