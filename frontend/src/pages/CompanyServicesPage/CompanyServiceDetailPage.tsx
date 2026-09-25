import { useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { COMPANY_SERVICE_STATUS } from '@/entities/company-service'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import {
  useArchiveService,
  useCompanyService,
  useHideService,
  usePublishService,
} from '@/features/company-management'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { companyServiceEditPath, ROUTES } from '@/shared/constants/routes'
import {
  AppButton,
  ConfirmDialog,
  ErrorState,
  LoadingState,
  PageHeader,
} from '@/shared/ui'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  active: 'Активна',
  hidden: 'Скрыта',
  archived: 'В архиве',
}

export function CompanyServiceDetailPage() {
  const { serviceId = '' } = useParams()
  const companyId = useSessionStore((s) => s.company?.id)
  const { data, isLoading, isError, refetch } = useCompanyService(serviceId)
  const publishService = usePublishService(companyId)
  const hideService = useHideService(companyId)
  const archiveService = useArchiveService(companyId)
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const [confirm, setConfirm] = useState<'publish' | 'hide' | 'archive' | null>(null)

  if (isLoading) return <LoadingState variant="page" />
  if (isError || !data) return <ErrorState onRetry={() => void refetch()} />

  const run = async () => {
    if (!confirm) return
    if (confirm === 'publish') {
      await publishService.mutateAsync(data.id)
      showSuccess('Опубликовано')
    } else if (confirm === 'hide') {
      await hideService.mutateAsync(data.id)
      showSuccess('Скрыто')
    } else {
      await archiveService.mutateAsync(data.id)
      showSuccess('В архиве')
    }
    setConfirm(null)
  }

  return (
    <Box>
      <PageHeader
        title={data.title}
        subtitle={data.category}
        actions={
          <Stack direction="row" spacing={1}>
            <AppButton component={RouterLink} to={ROUTES.PROFILE_COMPANY_SERVICES} variant="outlined">
              К списку
            </AppButton>
            <AppButton
              component={RouterLink}
              to={companyServiceEditPath(data.id)}
              variant="contained"
            >
              Изменить
            </AppButton>
          </Stack>
        }
      />

      <Stack spacing={2} maxWidth={640}>
        <Chip
          size="small"
          label={STATUS_LABELS[data.status] ?? data.status}
          sx={{ alignSelf: 'flex-start' }}
        />
        {data.shortDescription ? (
          <Typography variant="body1" color="text.secondary">
            {data.shortDescription}
          </Typography>
        ) : null}
        <Typography variant="body1">{data.description}</Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {data.status !== COMPANY_SERVICE_STATUS.ACTIVE ? (
            <AppButton onClick={() => setConfirm('publish')}>Опубликовать</AppButton>
          ) : null}
          {data.status !== COMPANY_SERVICE_STATUS.HIDDEN &&
          data.status !== COMPANY_SERVICE_STATUS.ARCHIVED ? (
            <AppButton onClick={() => setConfirm('hide')}>Скрыть</AppButton>
          ) : null}
          {data.status !== COMPANY_SERVICE_STATUS.ARCHIVED ? (
            <AppButton color="warning" onClick={() => setConfirm('archive')}>
              В архив
            </AppButton>
          ) : null}
        </Stack>
      </Stack>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={
          confirm === 'publish'
            ? 'Опубликовать?'
            : confirm === 'hide'
              ? 'Скрыть?'
              : 'В архив?'
        }
        confirmLabel="Подтвердить"
        destructive={confirm === 'archive'}
        loading={publishService.isPending || hideService.isPending || archiveService.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={() => void run()}
      />
    </Box>
  )
}
