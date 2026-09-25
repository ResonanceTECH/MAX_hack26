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
import type { CompanyDocument } from '@/entities/company-document'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import {
  useAddDocument,
  useCompanyDocuments,
  useRemoveDocument,
  useReplaceDocument,
} from '@/features/company-management/api/queries'
import {
  documentSchema,
  type DocumentFormValues,
} from '@/features/company-management/model/schemas'
import { Permission } from '@/features/permissions'
import { usePermission } from '@/features/permissions/hooks/usePermission'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { formatDate } from '@/shared/lib/format'
import { ROUTES } from '@/shared/constants/routes'
import {
  AppButton,
  AppInput,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from '@/shared/ui'

const STATUS_COLOR: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  Pending: 'warning',
  Verified: 'success',
  Rejected: 'error',
  Expired: 'default',
}

const STATUS_LABELS: Record<string, string> = {
  Pending: 'На проверке',
  Verified: 'Проверен',
  Rejected: 'Отклонён',
  Expired: 'Истёк',
}

export function CompanyDocumentsPage() {
  const companyId = useSessionStore((s) => s.company?.id)
  const canManage = usePermission(Permission.MANAGE_COMPANY_DOCUMENTS)
  const { data, isLoading, isError, refetch } = useCompanyDocuments(companyId)
  const addDocument = useAddDocument(companyId)
  const removeDocument = useRemoveDocument(companyId)
  const replaceDocument = useReplaceDocument(companyId)
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [replacing, setReplacing] = useState<CompanyDocument | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: { name: '', type: '', fileName: '' },
  })

  if (!canManage) {
    return <EmptyState title="Нет доступа" description="Управление документами недоступно." />
  }

  const openAdd = () => {
    setReplacing(null)
    form.reset({ name: '', type: '', fileName: '' })
    setDialogOpen(true)
  }

  const openReplace = (doc: CompanyDocument) => {
    setReplacing(doc)
    form.reset({ name: doc.name, type: doc.type, fileName: doc.fileName })
    setDialogOpen(true)
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (replacing) {
        await replaceDocument.mutateAsync({ id: replacing.id, input: values })
        showSuccess('Документ заменён')
      } else {
        await addDocument.mutateAsync(values)
        showSuccess('Документ добавлен')
      }
      setDialogOpen(false)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Ошибка')
    }
  })

  return (
    <Box>
      <PageHeader
        title="Документы"
        subtitle="Файлы для верификации компании"
        actions={
          <Stack direction="row" spacing={1}>
            <AppButton component={RouterLink} to={ROUTES.COMPANY_ADMIN} variant="outlined">
              Назад
            </AppButton>
            <AppButton variant="contained" onClick={openAdd}>
              Добавить
            </AppButton>
          </Stack>
        }
      />

      {isLoading ? <LoadingState variant="list" /> : null}
      {isError ? <ErrorState onRetry={() => void refetch()} /> : null}
      {!isLoading && !isError && data?.length === 0 ? (
        <EmptyState title="Документов нет" actionLabel="Добавить" onAction={openAdd} />
      ) : null}

      <Stack spacing={1.5}>
        {data?.map((doc) => (
          <Box
            key={doc.id}
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
                  <Typography variant="h3">{doc.name}</Typography>
                  <Chip
                    size="small"
                    color={STATUS_COLOR[doc.status] ?? 'default'}
                    label={STATUS_LABELS[doc.status] ?? doc.status}
                  />
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {doc.type} · {doc.fileName} · {formatDate(doc.uploadedAt)}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <AppButton size="small" onClick={() => openReplace(doc)}>
                  Заменить
                </AppButton>
                <AppButton size="small" color="error" onClick={() => setDeleteId(doc.id)}>
                  Удалить
                </AppButton>
              </Stack>
            </Stack>
          </Box>
        ))}
      </Stack>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{replacing ? 'Заменить документ' : 'Добавить документ'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Controller
              name="name"
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
              name="type"
              control={form.control}
              render={({ field, fieldState }) => (
                <AppInput
                  {...field}
                  label="Тип"
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="fileName"
              control={form.control}
              render={({ field, fieldState }) => (
                <AppInput
                  {...field}
                  label="Имя файла"
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message ?? 'В демо укажите имя файла вручную'}
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <AppButton onClick={() => setDialogOpen(false)}>Отмена</AppButton>
          <AppButton
            variant="contained"
            loading={addDocument.isPending || replaceDocument.isPending}
            onClick={() => void onSubmit()}
          >
            Сохранить
          </AppButton>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Удалить документ?"
        confirmLabel="Удалить"
        destructive
        loading={removeDocument.isPending}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleteId) return
          void removeDocument.mutateAsync(deleteId).then(() => {
            showSuccess('Документ удалён')
            setDeleteId(null)
          })
        }}
      />
    </Box>
  )
}
