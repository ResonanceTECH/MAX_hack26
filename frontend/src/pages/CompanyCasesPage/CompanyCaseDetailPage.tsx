import { useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { COMPANY_CASE_STATUS } from '@/entities/company-case'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import {
  useArchiveCase,
  useCompanyCase,
  usePublishCase,
  useUpdateCase,
} from '@/features/company-management'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { companyCaseEditPath, ROUTES } from '@/shared/constants/routes'
import {
  AppButton,
  ConfirmDialog,
  ErrorState,
  LoadingState,
  PageHeader,
  Tag,
} from '@/shared/ui'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  published: 'Опубликован',
  hidden: 'Скрыт',
  archived: 'В архиве',
}

export function CompanyCaseDetailPage() {
  const { caseId = '' } = useParams()
  const companyId = useSessionStore((s) => s.company?.id)
  const { data, isLoading, isError, refetch } = useCompanyCase(caseId)
  const publishCase = usePublishCase(companyId)
  const updateCase = useUpdateCase(companyId)
  const archiveCase = useArchiveCase(companyId)
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const [confirm, setConfirm] = useState<'publish' | 'hide' | 'archive' | null>(null)

  if (isLoading) return <LoadingState variant="page" />
  if (isError || !data) return <ErrorState onRetry={() => void refetch()} />

  const run = async () => {
    if (!confirm) return
    if (confirm === 'publish') {
      await publishCase.mutateAsync(data.id)
      showSuccess('Опубликовано')
    } else if (confirm === 'hide') {
      await updateCase.mutateAsync({ id: data.id, input: { status: COMPANY_CASE_STATUS.HIDDEN } })
      showSuccess('Скрыто')
    } else {
      await archiveCase.mutateAsync(data.id)
      showSuccess('В архиве')
    }
    setConfirm(null)
  }

  return (
    <Box>
      <PageHeader
        title={data.title}
        subtitle={data.industry}
        actions={
          <Stack direction="row" spacing={1}>
            <AppButton component={RouterLink} to={ROUTES.PROFILE_COMPANY_CASES} variant="outlined">
              К списку
            </AppButton>
            <AppButton
              component={RouterLink}
              to={companyCaseEditPath(data.id)}
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
        <Typography variant="body1">{data.description}</Typography>
        <Typography variant="body2" fontWeight={600}>
          Результат: {data.result}
        </Typography>
        {data.clientName ? (
          <Typography variant="body2" color="text.secondary">
            Клиент: {data.clientName}
          </Typography>
        ) : null}
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {data.technologies.map((t) => (
            <Tag key={t} label={t} color="secondary" />
          ))}
        </Stack>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {data.status !== COMPANY_CASE_STATUS.PUBLISHED ? (
            <AppButton onClick={() => setConfirm('publish')}>Опубликовать</AppButton>
          ) : null}
          {data.status !== COMPANY_CASE_STATUS.HIDDEN ? (
            <AppButton onClick={() => setConfirm('hide')}>Скрыть</AppButton>
          ) : null}
          {data.status !== COMPANY_CASE_STATUS.ARCHIVED ? (
            <AppButton color="warning" onClick={() => setConfirm('archive')}>
              В архив
            </AppButton>
          ) : null}
        </Stack>
      </Stack>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Подтвердите действие"
        confirmLabel="Подтвердить"
        destructive={confirm === 'archive'}
        loading={publishCase.isPending || updateCase.isPending || archiveCase.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={() => void run()}
      />
    </Box>
  )
}
