import { Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { useCompanyDocuments, useRemoveDocument } from '@/features/company-management'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { companyDocumentPath, ROUTES } from '@/shared/constants/routes'
import { formatDate } from '@/shared/lib/format'
import {
  AppButton,
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
  const { data, isLoading, isError, refetch } = useCompanyDocuments(companyId)
  const removeDocument = useRemoveDocument(companyId)
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  return (
    <Box>
      <PageHeader
        title="Документы"
        subtitle="Файлы для верификации компании"
        actions={
          <AppButton
            component={RouterLink}
            to={ROUTES.PROFILE_COMPANY_DOCUMENTS_UPLOAD}
            variant="contained"
          >
            Загрузить
          </AppButton>
        }
      />

      <Typography variant="caption" color="warning.main" display="block" sx={{ mb: 2 }}>
        Демонстрационный статус / MODEL_DATA — загрузка имитируется на фронтенде.
      </Typography>

      {isLoading ? <LoadingState variant="list" /> : null}
      {isError ? <ErrorState onRetry={() => void refetch()} /> : null}
      {!isLoading && !isError && data?.length === 0 ? (
        <EmptyState
          title="Документов нет"
          actionLabel="Загрузить"
          onAction={() => window.location.assign(ROUTES.PROFILE_COMPANY_DOCUMENTS_UPLOAD)}
        />
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
                  <Typography
                    component={RouterLink}
                    to={companyDocumentPath(doc.id)}
                    variant="h3"
                    color="inherit"
                    sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
                  >
                    {doc.name}
                  </Typography>
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
                <AppButton
                  size="small"
                  component={RouterLink}
                  to={companyDocumentPath(doc.id)}
                >
                  Открыть
                </AppButton>
                <AppButton size="small" color="error" onClick={() => setDeleteId(doc.id)}>
                  Удалить
                </AppButton>
              </Stack>
            </Stack>
          </Box>
        ))}
      </Stack>

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
