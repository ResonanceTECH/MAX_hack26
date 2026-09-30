import type { ReactNode } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
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
import { moderationItemPath, queueTypePath, ROUTES } from '@/shared/constants/routes'
import {
  AppButton,
  BentoGrid,
  BentoTile,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from '@/shared/ui'

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
        <BentoGrid>
          <BentoTile span={8} variant="emphasis">
            <Typography variant="h2" component="h2" sx={{ mb: 0.5 }}>
              Ожидают проверки
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Сводка по типам сущностей в очереди модерации.
            </Typography>
          </BentoTile>

          <BentoTile span={4}>
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
          </BentoTile>

          {countCards.map((card) => (
            <BentoTile key={card.label} span={4} to={card.to} variant="action">
              <Typography variant="body2" color="text.secondary">
                {card.label}
              </Typography>
              <Typography variant="h2" sx={{ mt: 0.5 }}>
                {card.value}
              </Typography>
            </BentoTile>
          ))}

          <BentoTile span={12}>
            <Typography variant="h3" sx={{ mb: 1 }}>
              Быстрые фильтры
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
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
                <Chip
                  key={chip.label}
                  label={chip.label}
                  onClick={chip.onClick}
                  clickable
                  sx={{ minHeight: 36 }}
                />
              ))}
            </Stack>
          </BentoTile>

          <BentoTile span={6}>
            <Typography variant="h3" sx={{ mb: 1.5 }}>
              Требует внимания
            </Typography>
            {d.attentionItems.length === 0 ? (
              <EmptyState
                title="Нет срочных объектов"
                description="Очередь в нормальном состоянии"
              />
            ) : (
              <Stack spacing={1.5}>
                {d.attentionItems.map((item) => (
                <QueueRow
                  key={item.id}
                  title={item.title}
                  to={moderationItemPath(item.entityType, item.id)}
                  meta={
                      <>
                        {item.reportsCount > 0 ? `${item.reportsCount} жалобы · ` : null}
                        <QueueAgeLabel submittedAt={item.submittedAt} />
                      </>
                    }
                  chips={
                      <>
                        <Chip size="small" label={MODERATION_TYPE_LABELS[item.entityType]} />
                        <ModerationPriorityChip priority={item.priority} />
                      </>
                    }
                />
                ))}
              </Stack>
            )}
          </BentoTile>

          <BentoTile span={6}>
            <Typography variant="h3" sx={{ mb: 1.5 }}>
              Недавняя очередь
            </Typography>
            <Stack spacing={1.5}>
              {d.recentQueue.map((item) => (
                <QueueRow
                  key={item.id}
                  title={item.title}
                  to={moderationItemPath(item.entityType, item.id)}
                  meta={
                    <>
                      Submitted: {formatRelativeDate(item.submittedAt)} ·{' '}
                      {MODERATION_REASON_LABELS[item.reason]}
                    </>
                  }
                  chips={
                    <>
                      <Chip size="small" label={MODERATION_TYPE_LABELS[item.entityType]} />
                      <ModerationStatusChip status={item.status} />
                      <ModerationPriorityChip priority={item.priority} />
                    </>
                  }
                />
              ))}
            </Stack>
          </BentoTile>
        </BentoGrid>
      ) : null}
    </Box>
  )
}

function QueueRow({
  title,
  to,
  meta,
  chips,
}: {
  title: string
  to: string
  meta: ReactNode
  chips: ReactNode
}) {
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        spacing={1.5}
        alignItems={{ sm: 'center' }}
      >
        <Box>
          <Stack direction="row" spacing={1} sx={{ mb: 0.5 }} flexWrap="wrap" useFlexGap>
            {chips}
          </Stack>
          <Typography variant="h4">{title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {meta}
          </Typography>
        </Box>
        <AppButton component={RouterLink} to={to} variant="contained" size="small">
          Проверить
        </AppButton>
      </Stack>
    </Box>
  )
}
