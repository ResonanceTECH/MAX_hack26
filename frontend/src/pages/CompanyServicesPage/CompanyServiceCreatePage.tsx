import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import { COMPANY_SERVICE_STATUS } from '@/entities/company-service'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import {
  serviceSchema,
  type ServiceFormValues,
  useCreateService,
} from '@/features/company-management'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { companyServicePath, ROUTES } from '@/shared/constants/routes'
import { AppButton, PageHeader } from '@/shared/ui'
import { ServiceFormFields } from './ServiceFormFields'

export function CompanyServiceCreatePage() {
  const navigate = useNavigate()
  const companyId = useSessionStore((s) => s.company?.id)
  const createService = useCreateService(companyId)
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      shortDescription: '',
      status: COMPANY_SERVICE_STATUS.DRAFT,
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const created = await createService.mutateAsync(values)
      showSuccess('Услуга создана')
      void navigate(companyServicePath(created.id))
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Ошибка сохранения')
    }
  })

  return (
    <Box>
      <PageHeader
        title="Новая услуга"
        actions={
          <AppButton component={RouterLink} to={ROUTES.PROFILE_COMPANY_SERVICES} variant="outlined">
            К списку
          </AppButton>
        }
      />
      <Stack component="form" spacing={2} maxWidth={560} onSubmit={onSubmit}>
        <ServiceFormFields control={form.control} />
        <Stack direction="row" spacing={1}>
          <AppButton type="submit" variant="contained" loading={createService.isPending}>
            Создать
          </AppButton>
          <AppButton
            variant="outlined"
            onClick={() => {
              form.setValue('status', COMPANY_SERVICE_STATUS.ACTIVE)
              void onSubmit()
            }}
          >
            Создать и опубликовать
          </AppButton>
        </Stack>
      </Stack>
    </Box>
  )
}
