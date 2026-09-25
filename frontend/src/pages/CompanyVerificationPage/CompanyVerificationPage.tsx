import { Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { useCompanyDocuments } from '@/features/company-management/api/queries'
import { Permission } from '@/features/permissions'
import { usePermission } from '@/features/permissions/hooks/usePermission'
import { ROUTES } from '@/shared/constants/routes'
import { AppButton, EmptyState, LoadingState, PageHeader, VerifiedBadge } from '@/shared/ui'

const VERIFICATION_LABELS: Record<string, string> = {
  pending: 'На проверке',
  verified: 'Верифицирована',
  rejected: 'Отклонена',
  expired: 'Истекла',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Активна',
  blocked: 'Заблокирована',
  draft: 'Черновик',
}

export function CompanyVerificationPage() {
  const company = useSessionStore((s) => s.company)
  const canEdit = usePermission(Permission.EDIT_COMPANY)
  const documents = useCompanyDocuments(company?.id)

  if (!canEdit) {
    return <EmptyState title="Нет доступа" description="Раздел верификации недоступен." />
  }

  if (!company) return <LoadingState variant="page" />

  const verifiedDocs =
    documents.data?.filter((d) => d.status === 'Verified').length ?? 0
  const pendingDocs = documents.data?.filter((d) => d.status === 'Pending').length ?? 0

  return (
    <Box>
      <PageHeader
        title="Верификация"
        subtitle="Статус проверки компании"
        actions={
          <Stack direction="row" spacing={1}>
            <AppButton component={RouterLink} to={ROUTES.COMPANY_ADMIN} variant="outlined">
              Назад
            </AppButton>
            <AppButton component={RouterLink} to={ROUTES.COMPANY_DOCUMENTS} variant="contained">
              Документы
            </AppButton>
          </Stack>
        }
      />

      <Stack spacing={2} maxWidth={560}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h2">{company.shortName}</Typography>
          <VerifiedBadge verified={company.verified} />
        </Stack>

        <Stack direction="row" spacing={1}>
          <Chip
            label={VERIFICATION_LABELS[company.verificationStatus] ?? company.verificationStatus}
            color={company.verificationStatus === 'verified' ? 'success' : 'warning'}
          />
          <Chip label={STATUS_LABELS[company.status] ?? company.status} />
        </Stack>

        <Typography variant="body1">
          {company.verificationStatus === 'verified'
            ? 'Компания успешно прошла проверку. Значок верификации отображается в каталоге и на публичной карточке.'
            : company.verificationStatus === 'pending'
              ? 'Документы на проверке. Обычно это занимает 1–3 рабочих дня.'
              : company.verificationStatus === 'rejected'
                ? 'Проверка отклонена. Загрузите актуальные документы и отправьте повторно.'
                : 'Срок верификации истёк. Обновите документы для повторной проверки.'}
        </Typography>

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
            Документы
          </Typography>
          <Typography variant="body2">
            Проверено: {verifiedDocs} · На проверке: {pendingDocs} · Всего:{' '}
            {documents.data?.length ?? '—'}
          </Typography>
        </Box>
      </Stack>
    </Box>
  )
}
