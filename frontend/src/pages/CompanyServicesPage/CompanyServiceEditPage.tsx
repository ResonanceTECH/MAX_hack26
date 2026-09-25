import { useEffect } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import {
  serviceSchema,
  type ServiceFormValues,
  useCompanyService,
  useUpdateService,
} from '@/features/company-management'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { companyServicePath, ROUTES } from '@/shared/constants/routes'
import { AppButton, ErrorState, LoadingState, PageHeader } from '@/shared/ui'
import { ServiceFormFields } from './ServiceFormFields'

export function CompanyServiceEditPage() {
  const { serviceId = '' } = useParams()
  const navigate = useNavigate()
  const companyId = useSessionStore((s) => s.company?.id)
  const { data, isLoading, isError, refetch } = useCompanyService(serviceId)
  const updateService = useUpdateService(companyId)
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { title: '', description: '', category: '' },
  })

  useEffect(() => {
    if (!data) return
    form.reset({
      title: data.title,
      description: data.description,
      category: data.category,
      shortDescription: data.shortDescription ?? '',
      status: data.status,
    })
  }, [data, form])

  if (isLoading) return <LoadingState variant="page" />
  if (isError || !data) return <ErrorState onRetry={() => void refetch()} />

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await updateService.mutateAsync({ id: data.id, input: values })
      showSuccess('Услуга обновлена')
      void navigate(companyServicePath(data.id))
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Ошибка сохранения')
    }
  })

  return (
    <Box>
      <PageHeader
        title="Редактирование услуги"
        subtitle={data.title}
        actions={
          <AppButton component={RouterLink} to={ROUTES.PROFILE_COMPANY_SERVICES} variant="outlined">
            К списку
          </AppButton>
        }
      />
      <Stack component="form" spacing={2} maxWidth={560} onSubmit={onSubmit}>
        <ServiceFormFields control={form.control} />
        <AppButton type="submit" variant="contained" loading={updateService.isPending}>
          Сохранить
        </AppButton>
      </Stack>
    </Box>
  )
}
