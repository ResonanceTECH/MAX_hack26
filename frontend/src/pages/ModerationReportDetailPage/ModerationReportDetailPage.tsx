import { useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import {
  useAssignReport,
  useEscalateReport,
  useReport,
  useResolveReport,
} from '@/features/moderation/api/queries'
import {
  REPORT_STATUS_LABELS,
  REPORT_TYPE_LABELS,
} from '@/features/moderation/model/labels'
import { ResolveReportDialog } from '@/features/moderation/ui/DecisionDialogs'
import { ModerationPriorityChip } from '@/features/moderation/ui/ModerationPriorityChip'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { formatDate } from '@/shared/lib/format'
import { moderationDetailPath, ROUTES } from '@/shared/constants/routes'
import {
  AppButton,
  ErrorState,
  LoadingState,
  PageHeader,
} from '@/shared/ui'

export function ModerationReportDetailPage() {
  const { id = '' } = useParams()
  const query = useReport(id)
  const resolve = useResolveReport()
  const escalate = useEscalateReport()
  const assign = useAssignReport()
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)
  const navigate = useNavigate()
  const [resolveOpen, setResolveOpen] = useState(false)

  if (query.isLoading) return <LoadingState variant="page" />
  if (query.isError || !query.data) {
    return <ErrorState onRetry={() => void query.refetch()} />
  }

  const report = query.data
  const open =
    report.status === 'OPEN' || report.status === 'IN_PROGRESS'

  return (
    <Box>
      <PageHeader title="Жалоба" subtitle={report.targetName} />
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip label={REPORT_TYPE_LABELS[report.type]} size="small" />
          <Chip label={REPORT_STATUS_LABELS[report.status]} size="small" />
          <ModerationPriorityChip priority={report.priority} />
        </Stack>

        <Alert severity="info">
          Reporter: {report.reporterName} (минимальные данные · privacy)
        </Alert>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h4" gutterBottom>
              Описание
            </Typography>
            <Typography variant="body1">{report.description}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Создано: {formatDate(report.createdAt)}
            </Typography>
            {report.relatedReportIds.length > 0 ? (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Связанные жалобы: {report.relatedReportIds.join(', ')}
              </Typography>
            ) : null}
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h4" gutterBottom>
              Цель жалобы
            </Typography>
            <Typography variant="body1">{report.targetName}</Typography>
            <Typography variant="body2" color="text.secondary">
              {report.targetType} · {report.targetId}
            </Typography>
            {report.targetType !== 'user' ? (
              <AppButton
                component={RouterLink}
                to={moderationDetailPath(report.targetType, report.targetId)}
                sx={{ mt: 1 }}
                variant="outlined"
                size="small"
              >
                Открыть объект
              </AppButton>
            ) : null}
          </CardContent>
        </Card>

        {open ? (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <AppButton
              variant="outlined"
              onClick={() =>
                void assign
                  .mutateAsync(report.id)
                  .then(() => showSuccess('Жалоба взята в работу'))
                  .catch((e: Error) => showError(e.message))
              }
            >
              Взять в работу
            </AppButton>
            <AppButton variant="contained" onClick={() => setResolveOpen(true)}>
              Закрыть / применить действие
            </AppButton>
            <AppButton
              variant="outlined"
              onClick={() =>
                void escalate
                  .mutateAsync({
                    id: report.id,
                    comment: 'Требуется решение Platform Admin',
                  })
                  .then(() => {
                    showSuccess('Жалоба передана администратору')
                    navigate(ROUTES.MODERATION_ESCALATIONS)
                  })
                  .catch((e: Error) => showError(e.message))
              }
            >
              Передать администратору
            </AppButton>
          </Stack>
        ) : (
          <Alert severity="success">
            Итог: {report.resolution ?? report.resolutionCode}
          </Alert>
        )}

        <AppButton component={RouterLink} to={ROUTES.MODERATION_REPORTS} variant="text">
          К списку жалоб
        </AppButton>
      </Stack>

      <ResolveReportDialog
        open={resolveOpen}
        loading={resolve.isPending}
        onClose={() => setResolveOpen(false)}
        onSubmit={async (values) => {
          try {
            await resolve.mutateAsync({ id: report.id, input: values })
            showSuccess('Жалоба закрыта')
            setResolveOpen(false)
          } catch (e) {
            showError(e instanceof Error ? e.message : 'Ошибка')
          }
        }}
      />
    </Box>
  )
}
