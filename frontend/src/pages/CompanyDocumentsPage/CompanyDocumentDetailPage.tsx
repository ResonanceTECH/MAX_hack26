import { Link as RouterLink, useParams } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useCompanyDocument } from '@/features/company-management'
import { ROUTES } from '@/shared/constants/routes'
import { formatDate } from '@/shared/lib/format'
import { AppButton, ErrorState, LoadingState, PageHeader } from '@/shared/ui'

const STATUS_LABELS: Record<string, string> = {
  Pending: 'На проверке',
  Verified: 'Проверен',
  Rejected: 'Отклонён',
  Expired: 'Истёк',
}

const SOURCE_LABELS: Record<string, string> = {
  COMPANY_DATA: 'Данные компании',
  MODEL_DATA: 'Модельные данные',
  PLATFORM_VERIFIED: 'Проверено платформой',
}

export function CompanyDocumentDetailPage() {
  const { documentId = '' } = useParams()
  const { data, isLoading, isError, refetch } = useCompanyDocument(documentId)

  if (isLoading) return <LoadingState variant="page" />
  if (isError || !data) return <ErrorState onRetry={() => void refetch()} />

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

      <Alert severity="warning" sx={{ mb: 2, maxWidth: 560 }}>
        Демонстрационный статус / MODEL_DATA
      </Alert>

      <Stack spacing={1.5} maxWidth={560}>
        <Chip
          size="small"
          label={STATUS_LABELS[data.status] ?? data.status}
          sx={{ alignSelf: 'flex-start' }}
        />
        <Typography variant="body2">Файл: {data.fileName}</Typography>
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
      </Stack>
    </Box>
  )
}
