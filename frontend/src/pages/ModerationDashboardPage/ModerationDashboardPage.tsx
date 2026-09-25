import { Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import {
  useModerationQueue,
  useModerationSummary,
} from '@/features/moderation/api/queries'
import {
  MODERATION_STATUS_LABELS,
  MODERATION_TYPE_LABELS,
} from '@/features/moderation/model/labels'
import { formatRelativeDate } from '@/shared/lib/format'
import { moderationItemPath, ROUTES } from '@/shared/constants/routes'
import {
  AppButton,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from '@/shared/ui'

export function ModerationDashboardPage() {
  const summaryQuery = useModerationSummary()
  const queueQuery = useModerationQueue({ status: 'pending' })

  const cards = summaryQuery.data
    ? [
        {
          label: 'Компании',
          value: (queueQuery.data ?? []).filter((i) => i.type === 'company' && i.status === 'pending')
            .length,
        },
        {
          label: 'Запросы',
          value: (queueQuery.data ?? []).filter(
            (i) => i.type === 'opportunity' && i.status === 'pending',
          ).length,
        },
        {
          label: 'Документы',
          value: (queueQuery.data ?? []).filter((i) => i.type === 'document' && i.status === 'pending')
            .length,
        },
        { label: 'Жалобы', value: summaryQuery.data.openReports },
        { label: 'Всего в очереди', value: summaryQuery.data.pending },
        { label: 'Нужны правки', value: summaryQuery.data.needsChanges },
      ]
    : []

  const recent = (queueQuery.data ?? []).slice(0, 5)

  return (
    <Box>
      <PageHeader
        title="Модерация"
        subtitle="Сводка очереди и последние заявки на проверку"
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <AppButton component={RouterLink} to={ROUTES.MODERATION_QUEUE} variant="contained">
              Очередь
            </AppButton>
            <AppButton component={RouterLink} to={ROUTES.MODERATION_REPORTS} variant="outlined">
              Жалобы
            </AppButton>
            <AppButton component={RouterLink} to={ROUTES.MODERATION_HISTORY} variant="text">
              История
            </AppButton>
          </Stack>
        }
      />

      {summaryQuery.isLoading ? <LoadingState rows={2} variant="cards" /> : null}
      {summaryQuery.isError ? (
        <ErrorState onRetry={() => void summaryQuery.refetch()} />
      ) : null}

      {summaryQuery.data ? (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {cards.map((card) => (
            <Grid item xs={6} sm={4} md={2} key={card.label}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    {card.label}
                  </Typography>
                  <Typography variant="h2" sx={{ mt: 0.5 }}>
                    {card.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : null}

      <Typography variant="h3" sx={{ mb: 2 }}>
        Недавние заявки
      </Typography>
      {queueQuery.isLoading ? <LoadingState rows={3} variant="list" /> : null}
      {queueQuery.isError ? <ErrorState onRetry={() => void queueQuery.refetch()} /> : null}
      {!queueQuery.isLoading && !queueQuery.isError && recent.length === 0 ? (
        <EmptyState title="Очередь пуста" description="Новых заявок на модерацию нет" />
      ) : null}
      <Stack spacing={1.5}>
        {recent.map((item) => (
          <Card key={item.id} variant="outlined">
            <CardContent>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                spacing={1.5}
                alignItems={{ sm: 'center' }}
              >
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Chip size="small" label={MODERATION_TYPE_LABELS[item.type]} />
                    <Chip
                      size="small"
                      label={MODERATION_STATUS_LABELS[item.status]}
                      color="warning"
                    />
                  </Stack>
                  <Typography variant="h4">{item.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {item.companyName} · {item.authorName} · {formatRelativeDate(item.submittedAt)}
                  </Typography>
                </Box>
                <AppButton
                  component={RouterLink}
                  to={moderationItemPath(item.type, item.id)}
                  variant="contained"
                  size="small"
                >
                  Проверить
                </AppButton>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  )
}
