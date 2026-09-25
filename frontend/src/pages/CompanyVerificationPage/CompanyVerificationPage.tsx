import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router-dom'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { useCompanyVerification } from '@/features/company-management'
import { ROUTES } from '@/shared/constants/routes'
import { formatDate } from '@/shared/lib/format'
import {
  AppButton,
  ErrorState,
  LoadingState,
  PageHeader,
  VerifiedBadge,
} from '@/shared/ui'

const OVERALL_LABELS: Record<string, string> = {
  NOT_VERIFIED: 'Не верифицирована',
  PENDING: 'На проверке',
  VERIFIED: 'Верифицирована',
  REJECTED: 'Отклонена',
  REQUIRES_UPDATE: 'Требует обновления',
}

const BLOCK_STATUS: Record<string, { label: string; color: 'success' | 'warning' | 'default' }> = {
  complete: { label: 'Готово', color: 'success' },
  incomplete: { label: 'Не заполнено', color: 'default' },
  pending: { label: 'На проверке', color: 'warning' },
}

const SOURCE_LABELS: Record<string, string> = {
  COMPANY_DATA: 'Данные компании',
  MODEL_DATA: 'Модельные данные',
  PLATFORM_VERIFIED: 'Проверено платформой',
}

export function CompanyVerificationPage() {
  const company = useSessionStore((s) => s.company)
  const { data, isLoading, isError, refetch } = useCompanyVerification(company?.id)

  if (isLoading) return <LoadingState variant="page" />
  if (isError || !data) return <ErrorState onRetry={() => void refetch()} />
  if (!company) return <LoadingState variant="page" />

  return (
    <Box>
      <PageHeader
        title="Верификация"
        subtitle="Статус проверки компании"
        actions={
          <AppButton component={RouterLink} to={ROUTES.COMPANY_DOCUMENTS} variant="contained">
            Документы
          </AppButton>
        }
      />

      <Alert severity="info" sx={{ mb: 2, maxWidth: 640 }}>
        Демонстрационный статус / MODEL_DATA — часть блоков заполнена модельными данными.
      </Alert>

      <Stack spacing={2} maxWidth={640}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h2">{company.shortName}</Typography>
          <VerifiedBadge verified={company.verified || data.status === 'VERIFIED'} />
        </Stack>

        <Chip
          label={OVERALL_LABELS[data.status] ?? data.status}
          color={data.status === 'VERIFIED' ? 'success' : 'warning'}
          sx={{ alignSelf: 'flex-start' }}
        />

        <Typography variant="caption" color="text.secondary">
          Обновлено: {formatDate(data.updatedAt)}
        </Typography>

        <Stack spacing={1.5}>
          {data.blocks.map((block) => {
            const statusMeta = BLOCK_STATUS[block.status] ?? BLOCK_STATUS.incomplete!
            return (
              <Box
                key={block.id}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  spacing={1}
                >
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {block.label}
                    </Typography>
                    {block.description ? (
                      <Typography variant="body2" color="text.secondary">
                        {block.description}
                      </Typography>
                    ) : null}
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      Источник: {SOURCE_LABELS[block.source] ?? block.source}
                    </Typography>
                  </Box>
                  <Chip size="small" color={statusMeta.color} label={statusMeta.label} />
                </Stack>
              </Box>
            )
          })}
        </Stack>
      </Stack>
    </Box>
  )
}
