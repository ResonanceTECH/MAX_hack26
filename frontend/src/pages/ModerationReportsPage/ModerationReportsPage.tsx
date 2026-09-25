import { Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import {
  useApplyReportAction,
  useCloseReport,
  useReports,
} from '@/features/moderation/api/queries'
import {
  REPORT_REASON_LABELS,
  REPORT_STATUS_LABELS,
} from '@/features/moderation/model/labels'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { formatDate } from '@/shared/lib/format'
import { moderationDetailPath, ROUTES } from '@/shared/constants/routes'
import {
  AppButton,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from '@/shared/ui'

export function ModerationReportsPage() {
  const query = useReports()
  const closeReport = useCloseReport()
  const applyAction = useApplyReportAction()
  const showSuccess = useSnackbarStore((s) => s.showSuccess)

  return (
    <Box>
      <PageHeader title="Жалобы" subtitle="Обращения пользователей о нарушениях" />
      {query.isLoading ? <LoadingState variant="cards" /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : null}
      {!query.isLoading && !query.isError && (query.data?.length ?? 0) === 0 ? (
        <EmptyState title="Жалоб нет" description="Новые обращения появятся здесь" />
      ) : null}
      <Stack spacing={1.5}>
        {(query.data ?? []).map((report) => (
          <Card key={report.id} variant="outlined">
            <CardContent>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
                <Chip size="small" label={REPORT_REASON_LABELS[report.reason]} />
                <Chip size="small" label={REPORT_STATUS_LABELS[report.status]} />
              </Stack>
              <Typography variant="h4">{report.targetName}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                От: {report.reporterName} · {formatDate(report.createdAt)} · {report.entityType}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                {report.description}
              </Typography>
            </CardContent>
            <CardActions sx={{ px: 2, pb: 2 }}>
              <AppButton
                component={RouterLink}
                to={
                  report.entityType === 'user'
                    ? ROUTES.MODERATION_QUEUE
                    : moderationDetailPath(report.entityType, report.entityId)
                }
                size="small"
              >
                Открыть
              </AppButton>
              {report.status === 'open' ? (
                <>
                  <AppButton
                    size="small"
                    onClick={() =>
                      void closeReport.mutateAsync(report.id).then(() => showSuccess('Жалоба закрыта'))
                    }
                  >
                    Закрыть жалобу
                  </AppButton>
                  <AppButton
                    size="small"
                    variant="contained"
                    onClick={() =>
                      void applyAction
                        .mutateAsync(report.id)
                        .then(() => showSuccess('Действие применено'))
                    }
                  >
                    Применить действие
                  </AppButton>
                </>
              ) : null}
            </CardActions>
          </Card>
        ))}
      </Stack>
    </Box>
  )
}
