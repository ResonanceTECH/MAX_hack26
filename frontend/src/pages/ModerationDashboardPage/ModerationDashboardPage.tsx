import { Link as RouterLink, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import { useModerationDashboard } from '@/features/moderation/api/queries'
import {
  MODERATION_REASON_LABELS,
  MODERATION_TYPE_LABELS,
} from '@/features/moderation/model/labels'
import { useQueueFiltersStore } from '@/features/moderation/model/queueFiltersStore'
import { ModerationPriorityChip } from '@/features/moderation/ui/ModerationPriorityChip'
import { ModerationStatusChip } from '@/features/moderation/ui/ModerationStatusChip'
import { QueueAgeLabel } from '@/features/moderation/ui/QueueAgeLabel'
import { formatRelativeDate } from '@/shared/lib/format'
import {
  moderationItemPath,
  queueTypePath,
  ROUTES,
} from '@/shared/constants/routes'
import { AppButton, EmptyState, ErrorState, LoadingState, PageHeader } from '@/shared/ui'

export function ModerationDashboardPage() {
  const navigate = useNavigate()
  const query = useModerationDashboard()
  const openNext = useQueueFiltersStore((s) => s.openNextAfterDecision)
  const setOpenNext = useQueueFiltersStore((s) => s.setOpenNextAfterDecision)
  const setPriority = useQueueFiltersStore((s) => s.setPriority)
  const setOlderThanHours = useQueueFiltersStore((s) => s.setOlderThanHours)
  const d = query.data

  const countCards = d
    ? [
        { label: 'Компании', value: d.pendingCompanies, to: queueTypePath('company') },
        { label: 'Запросы', value: d.pendingOpportunities, to: queueTypePath('opportunity') },
        { label: 'Кейсы', value: d.pendingCases, to: queueTypePath('case') },
        { label: 'Документы', value: d.pendingDocuments, to: queueTypePath('document') },
        { label: 'Открытые жалобы', value: d.openReports, to: ROUTES.MODERATION_REPORTS },
        { label: 'Эскалации', value: d.escalations, to: ROUTES.MODERATION_ESCALATIONS },
      ]
    : []

  return (
    <Box>
      <PageHeader
        title="Обзор модерации"
        subtitle="Что сейчас требует проверки"
        actions={
          <AppButton component={RouterLink} to={ROUTES.MODERATION_QUEUE} variant="contained">
            Очередь
          </AppButton>
        }
      />

      {query.isLoading ? <LoadingState rows={2} variant="cards" /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : null}

      {d ? (
        <>
          <Typography variant="h3" sx={{ mb: 1.5 }}>
            Ожидают проверки
          </Typography>
          <Grid container spacing={1.5} sx={{ mb: 3 }}>
            {countCards.map((card) => (
              <Grid item xs={6} sm={4} md={2} key={card.label}>
                <Card
                  variant="outlined"
                  component={RouterLink}
                  to={card.to}
                  sx={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}
                >
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

          <Typography variant="h3" sx={{ mb: 1 }}>
            Быстрые фильтры
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
            {[
              { label: 'Компании', onClick: () => navigate(queueTypePath('company')) },
              { label: 'Запросы', onClick: () => navigate(queueTypePath('opportunity')) },
              { label: 'Документы', onClick: () => navigate(queueTypePath('document')) },
              { label: 'Жалобы', onClick: () => navigate(ROUTES.MODERATION_REPORTS) },
              {
                label: 'Высокий приоритет',
                onClick: () => {
                  setPriority('HIGH')
                  navigate(ROUTES.MODERATION_QUEUE)
                },
              },
              {
                label: 'Старше 12 часов',
                onClick: () => {
                  setOlderThanHours(12)
                  navigate(ROUTES.MODERATION_QUEUE)
                },
              },
            ].map((chip) => (
              <Chip key={chip.label} label={chip.label} onClick={chip.onClick} clickable />
            ))}
          </Stack>

          <Typography variant="h3" sx={{ mb: 1.5 }}>
            Требует внимания
          </Typography>
          {d.attentionItems.length === 0 ? (
            <EmptyState title="Нет срочных объектов" description="Очередь в нормальном состоянии" />
          ) : (
            <Stack spacing={1.5} sx={{ mb: 3 }}>
              {d.attentionItems.map((item) => (
                <Card key={item.id} variant="outlined">
                  <CardContent>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      justifyContent="space-between"
                      spacing={1.5}
                      alignItems={{ sm: 'center' }}
                    >
                      <Box>
                        <Stack direction="row" spacing={1} sx={{ mb: 0.5 }} flexWrap="wrap" useFlexGap>
                          <Chip size="small" label={MODERATION_TYPE_LABELS[item.entityType]} />
                          <ModerationPriorityChip priority={item.priority} />
                        </Stack>
                        <Typography variant="h4">{item.title}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {item.reportsCount > 0 ? `${item.reportsCount} жалобы · ` : null}
                          <QueueAgeLabel submittedAt={item.submittedAt} />
                        </Typography>
                      </Box>
                      <AppButton
                        component={RouterLink}
                        to={moderationItemPath(item.entityType, item.id)}
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
          )}

          <Typography variant="h3" sx={{ mb: 1.5 }}>
            Недавняя очередь
          </Typography>
          <Stack spacing={1.5} sx={{ mb: 3 }}>
            {d.recentQueue.map((item) => (
              <Card key={item.id} variant="outlined">
                <CardContent>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    spacing={1.5}
                    alignItems={{ sm: 'center' }}
                  >
                    <Box>
                      <Stack direction="row" spacing={1} sx={{ mb: 0.5 }} flexWrap="wrap" useFlexGap>
                        <Chip size="small" label={MODERATION_TYPE_LABELS[item.entityType]} />
                        <ModerationStatusChip status={item.status} />
                        <ModerationPriorityChip priority={item.priority} />
                      </Stack>
                      <Typography variant="h4">{item.title}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Submitted: {formatRelativeDate(item.submittedAt)} ·{' '}
                        {MODERATION_REASON_LABELS[item.reason]}
                      </Typography>
                    </Box>
                    <AppButton
                      component={RouterLink}
                      to={moderationItemPath(item.entityType, item.id)}
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

          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h4" sx={{ mb: 1 }}>
                Сегодня
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Проверено: {d.todayProcessed} · Одобрено: {d.approvedToday} · Отклонено:{' '}
                {d.rejectedToday} · На исправление: {d.changesToday}
              </Typography>
              <FormControlLabel
                sx={{ mt: 1 }}
                control={
                  <Switch
                    checked={openNext}
                    onChange={(_, v) => setOpenNext(v)}
                    inputProps={{ 'aria-label': 'После решения открывать следующий' }}
                  />
                }
                label="После решения: открыть следующий"
              />
            </CardContent>
          </Card>
        </>
      ) : null}
    </Box>
  )
}
