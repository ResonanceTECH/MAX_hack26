import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import {
  COMPANY_SERVICE_STATUS,
  type CompanyService,
} from '@/entities/company-service'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import {
  useArchiveService,
  useCompanyServices,
  useCreateService,
  useHideService,
  useUpdateService,
} from '@/features/company-management/api/queries'
import {
  serviceSchema,
  type ServiceFormValues,
} from '@/features/company-management/model/schemas'
import { Permission } from '@/features/permissions'
import { usePermission } from '@/features/permissions/hooks/usePermission'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { ROUTES } from '@/shared/constants/routes'
import {
  AppButton,
  AppInput,
  AppTextarea,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from '@/shared/ui'

const STATUS_LABELS: Record<string, string> = {
  active: 'Активна',
  hidden: 'Скрыта',
  archived: 'В архиве',
}

export function CompanyServicesPage() {
  const companyId = useSessionStore((s) => s.company?.id)
  const canManage = usePermission(Permission.MANAGE_COMPANY_SERVICES)
  const { data, isLoading, isError, refetch } = useCompanyServices(companyId)
  const createService = useCreateService(companyId)
  const updateService = useUpdateService(companyId)
  const hideService = useHideService(companyId)
  const archiveService = useArchiveService(companyId)
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)

  const [editing, setEditing] = useState<CompanyService | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { title: '', description: '', category: '', status: 'active' },
  })

  if (!canManage) {
    return <EmptyState title="Нет доступа" description="Управление услугами недоступно." />
  }

  const openCreate = () => {
    setEditing(null)
    form.reset({ title: '', description: '', category: '', status: COMPANY_SERVICE_STATUS.ACTIVE })
    setDialogOpen(true)
  }

  const openEdit = (service: CompanyService) => {
    setEditing(service)
    form.reset({
      title: service.title,
      description: service.description,
      category: service.category,
      status: service.status,
    })
    setDialogOpen(true)
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (editing) {
        await updateService.mutateAsync({ id: editing.id, input: values })
        showSuccess('Услуга обновлена')
      } else {
        await createService.mutateAsync(values)
        showSuccess('Услуга создана')
      }
      setDialogOpen(false)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Ошибка сохранения')
    }
  })

  return (
    <Box>
      <PageHeader
        title="Услуги"
        subtitle="Каталог услуг компании"
        actions={
          <Stack direction="row" spacing={1}>
            <AppButton component={RouterLink} to={ROUTES.COMPANY_ADMIN} variant="outlined">
              Назад
            </AppButton>
            <AppButton variant="contained" onClick={openCreate}>
              Добавить
            </AppButton>
          </Stack>
        }
      />

      {isLoading ? <LoadingState variant="cards" /> : null}
      {isError ? <ErrorState onRetry={() => void refetch()} /> : null}
      {!isLoading && !isError && data?.length === 0 ? (
        <EmptyState
          title="Услуг пока нет"
          description="Добавьте первую услугу для каталога."
          actionLabel="Добавить"
          onAction={openCreate}
        />
      ) : null}

      <Stack spacing={1.5}>
        {data?.map((service) => (
          <Box
            key={service.id}
            sx={{
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              spacing={1}
            >
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h3">{service.title}</Typography>
                  <Chip size="small" label={STATUS_LABELS[service.status] ?? service.status} />
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {service.category}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {service.description}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <AppButton size="small" onClick={() => openEdit(service)}>
                  Изменить
                </AppButton>
                {service.status !== COMPANY_SERVICE_STATUS.HIDDEN ? (
                  <AppButton
                    size="small"
                    onClick={() =>
                      void hideService.mutateAsync(service.id).then(() => showSuccess('Скрыто'))
                    }
                  >
                    Скрыть
                  </AppButton>
                ) : null}
                {service.status !== COMPANY_SERVICE_STATUS.ARCHIVED ? (
                  <AppButton
                    size="small"
                    color="warning"
                    onClick={() =>
                      void archiveService
                        .mutateAsync(service.id)
                        .then(() => showSuccess('В архиве'))
                    }
                  >
                    В архив
                  </AppButton>
                ) : null}
              </Stack>
            </Stack>
          </Box>
        ))}
      </Stack>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Редактировать услугу' : 'Новая услуга'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <AppInput
                  {...field}
                  label="Название"
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="category"
              control={form.control}
              render={({ field, fieldState }) => (
                <AppInput
                  {...field}
                  label="Категория"
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <AppTextarea
                  {...field}
                  label="Описание"
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <AppButton onClick={() => setDialogOpen(false)}>Отмена</AppButton>
          <AppButton
            variant="contained"
            loading={createService.isPending || updateService.isPending}
            onClick={() => void onSubmit()}
          >
            Сохранить
          </AppButton>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
