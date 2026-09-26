import { useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import {
  useCompanyDocument,
  useReplaceDocument,
} from '@/features/company-management'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { filesApi } from '@/shared/api/filesApi'
import { ROUTES } from '@/shared/constants/routes'
import { formatDate } from '@/shared/lib/format'
import { AppButton, ErrorState, LoadingState, PageHeader } from '@/shared/ui'

const STATUS_LABELS: Record<string, string> = {
  Pending: 'На проверке',
  PENDING: 'На проверке',
  Verified: 'Проверен',
  VERIFIED: 'Проверен',
  Rejected: 'Отклонён',
  REJECTED: 'Отклонён',
  Expired: 'Истёк',
  EXPIRED: 'Истёк',
}

const SOURCE_LABELS: Record<string, string> = {
  COMPANY_DATA: 'Данные компании',
  MODEL_DATA: 'Модельные данные',
  PLATFORM_VERIFIED: 'Проверено платформой',
}

const ACCEPTED_EXT = ['.pdf', '.png', '.jpg', '.jpeg']
const ACCEPTED_MIME = new Set(['application/pdf', 'image/png', 'image/jpeg'])
const MAX_BYTES = 10 * 1024 * 1024

export function CompanyDocumentDetailPage() {
  const { documentId = '' } = useParams()
  const companyId = useSessionStore((s) => s.company?.id)
  const { data, isLoading, isError, refetch } = useCompanyDocument(documentId)
  const replaceDocument = useReplaceDocument(companyId)
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)
  const [replaceError, setReplaceError] = useState<string | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [replacing, setReplacing] = useState(false)

  if (isLoading) return <LoadingState variant="page" />
  if (isError || !data) return <ErrorState onRetry={() => void refetch()} />

  const onReplace = async (file: File | null) => {
    if (!file) return
    setReplaceError(null)
    const lower = file.name.toLowerCase()
    const okExt = ACCEPTED_EXT.some((ext) => lower.endsWith(ext))
    const okMime = !file.type || ACCEPTED_MIME.has(file.type)
    if (!okExt || !okMime) {
      setReplaceError('Допустимы только PDF, PNG, JPG')
      return
    }
    if (file.size > MAX_BYTES) {
      setReplaceError('Размер файла не должен превышать 10 МБ')
      return
    }
    setReplacing(true)
    setProgress(0)
    try {
      const uploaded = await filesApi.upload({ file, onProgress: setProgress })
      await replaceDocument.mutateAsync({
        id: data.id,
        input: {
          name: data.name,
          type: data.type,
          fileName: uploaded.name || file.name,
          number: data.number,
          issuer: data.issuer,
          issuedAt: data.issuedAt,
          expiresAt: data.expiresAt,
          fileUrl: uploaded.url,
          verificationSource: data.verificationSource,
        },
      })
      showSuccess('Файл заменён')
      void refetch()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка замены файла'
      setReplaceError(msg)
      showError(msg)
    } finally {
      setReplacing(false)
      setProgress(null)
    }
  }

  return (
    <Box>
      <PageHeader
        title={data.name}
        subtitle={data.type}
        actions={
          <AppButton
            component={RouterLink}
            to={ROUTES.PROFILE_COMPANY_DOCUMENTS}
            variant="outlined"
          >
            К списку
          </AppButton>
        }
      />

      <Stack spacing={1.5} maxWidth={560}>
        <Chip
          size="small"
          label={STATUS_LABELS[data.status] ?? data.status}
          sx={{ alignSelf: 'flex-start' }}
        />
        <Typography variant="body2">Файл: {data.fileName}</Typography>
        {data.fileUrl ? (
          <Typography variant="body2">
            <AppButton
              component="a"
              href={data.fileUrl}
              {...{ target: '_blank', rel: 'noreferrer' }}
              variant="text"
              size="small"
              sx={{ px: 0 }}
            >
              Скачать / открыть
            </AppButton>
          </Typography>
        ) : null}
        <Typography variant="body2" color="text.secondary">
          Загружен: {formatDate(data.uploadedAt)}
        </Typography>
        {data.number ? <Typography variant="body2">Номер: {data.number}</Typography> : null}
        {data.issuer ? <Typography variant="body2">Выдан: {data.issuer}</Typography> : null}
        {data.expiresAt ? (
          <Typography variant="body2">Действует до: {formatDate(data.expiresAt)}</Typography>
        ) : null}
        {data.verificationSource ? (
          <Typography variant="body2" color="text.secondary">
            Источник: {SOURCE_LABELS[data.verificationSource] ?? data.verificationSource}
          </Typography>
        ) : null}

        <Box sx={{ pt: 1 }}>
          <AppButton component="label" variant="outlined" disabled={replacing}>
            Заменить файл
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
              hidden
              onChange={(e) => {
                void onReplace(e.target.files?.[0] ?? null)
                e.target.value = ''
              }}
            />
          </AppButton>
          {progress != null && replacing ? (
            <Box sx={{ mt: 1.5 }}>
              <LinearProgress variant="determinate" value={progress} />
              <Typography variant="caption" color="text.secondary">
                Загрузка: {progress}%
              </Typography>
            </Box>
          ) : null}
          {replaceError ? (
            <Alert severity="error" sx={{ mt: 1.5 }}>
              {replaceError}
            </Alert>
          ) : null}
        </Box>
      </Stack>
    </Box>
  )
}
