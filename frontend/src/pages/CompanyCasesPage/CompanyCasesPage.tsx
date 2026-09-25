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
import { COMPANY_CASE_STATUS, type CompanyCase } from '@/entities/company-case'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import {
  useCompanyCases,
  useCreateCase,
  useDeleteCase,
  useUpdateCase,
} from '@/features/company-management/api/queries'
import { caseSchema, type CaseFormValues } from '@/features/company-management/model/schemas'
import { Permission } from '@/features/permissions'
import { usePermission } from '@/features/permissions/hooks/usePermission'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { ROUTES } from '@/shared/constants/routes'
import {
  AppButton,
  AppInput,
  AppTextarea,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Tag,
} from '@/shared/ui'

function parseTags(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function CompanyCasesPage() {
  const companyId = useSessionStore((s) => s.company?.id)
  const canManage = usePermission(Permission.MANAGE_COMPANY_CASES)
  const { data, isLoading, isError, refetch } = useCompanyCases(companyId)
  const createCase = useCreateCase(companyId)
  const updateCase = useUpdateCase(companyId)
  const deleteCase = useDeleteCase(companyId)
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)

  const [editing, setEditing] = useState<CompanyCase | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const form = useForm<CaseFormValues>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      title: '',
      industry: '',
      description: '',
      result: '',
      technologies: [],
      status: COMPANY_CASE_STATUS.PUBLISHED,
    },
  })

  if (!canManage) {
    return <EmptyState title="Нет доступа" description="Управление кейсами недоступно." />
  }

  const openCreate = () => {
    setEditing(null)
    form.reset({
      title: '',
      industry: '',
      description: '',
      result: '',
      technologies: [],
      status: COMPANY_CASE_STATUS.PUBLISHED,
    })
    setDialogOpen(true)
  }

  const openEdit = (item: CompanyCase) => {
    setEditing(item)
    form.reset({
      title: item.title,
      industry: item.industry,
      description: item.description,
      result: item.result,
      technologies: item.technologies,
      status: item.status,
    })
    setDialogOpen(true)
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (editing) {
        await updateCase.mutateAsync({ id: editing.id, input: values })
        showSuccess('Кейс обновлён')
      } else {
        await createCase.mutateAsync(values)
        showSuccess('Кейс создан')
      }
      setDialogOpen(false)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Ошибка сохранения')
    }
  })

  return (
    <Box>
      <PageHeader
        title="Кейсы"
        subtitle="Публичные проекты компании"
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
        <EmptyState title="Кейсов пока нет" actionLabel="Добавить" onAction={openCreate} />
      ) : null}

      <Stack spacing={1.5}>
        {data?.map((item) => (
          <Box
            key={item.id}
            sx={{
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h3">{item.title}</Typography>
              <Chip
                size="small"
                label={item.status === 'published' ? 'Опубликован' : 'Скрыт'}
              />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {item.industry}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {item.description}
            </Typography>
            <Typography variant="body2" fontWeight={600} sx={{ mt: 1 }}>
              Результат: {item.result}
            </Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
              {item.technologies.map((t) => (
                <Tag key={t} label={t} color="secondary" />
              ))}
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
              <AppButton size="small" onClick={() => openEdit(item)}>
                Изменить
              </AppButton>
              {item.status !== COMPANY_CASE_STATUS.HIDDEN ? (
                <AppButton
                  size="small"
                  onClick={() =>
                    void updateCase
                      .mutateAsync({
                        id: item.id,
                        input: { status: COMPANY_CASE_STATUS.HIDDEN },
                      })
                      .then(() => showSuccess('Кейс скрыт'))
                  }
                >
                  Скрыть
                </AppButton>
              ) : null}
              <AppButton size="small" color="error" onClick={() => setDeleteId(item.id)}>
                Удалить
              </AppButton>
            </Stack>
          </Box>
        ))}
      </Stack>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Редактировать кейс' : 'Новый кейс'}</DialogTitle>
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
              name="industry"
              control={form.control}
              render={({ field, fieldState }) => (
                <AppInput
                  {...field}
                  label="Отрасль"
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
            <Controller
              name="result"
              control={form.control}
              render={({ field, fieldState }) => (
                <AppInput
                  {...field}
                  label="Результат"
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="technologies"
              control={form.control}
              render={({ field, fieldState }) => (
                <AppInput
                  label="Технологии (через запятую)"
                  value={field.value.join(', ')}
                  onChange={(e) => field.onChange(parseTags(e.target.value))}
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
            loading={createCase.isPending || updateCase.isPending}
            onClick={() => void onSubmit()}
          >
            Сохранить
          </AppButton>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Удалить кейс?"
        description="Действие нельзя отменить."
        confirmLabel="Удалить"
        destructive
        loading={deleteCase.isPending}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleteId) return
          void deleteCase.mutateAsync(deleteId).then(() => {
            showSuccess('Кейс удалён')
            setDeleteId(null)
          })
        }}
      />
    </Box>
  )
}
