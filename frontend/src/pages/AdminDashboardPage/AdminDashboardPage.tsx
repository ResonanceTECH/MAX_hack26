import { Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid2'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import {
  useAdminDashboard,
  MetricCard,
  AUDIT_ACTION_LABELS,
} from '@/features/admin'
import { useModerationSummary } from '@/features/moderation/api/queries'
import { ROUTES, adminUserPath, adminCompanyPath } from '@/shared/constants/routes'
import { formatDate, formatRelativeDate } from '@/shared/lib/format'
import { AppButton, ErrorState, LoadingState, PageHeader } from '@/shared/ui'
import type { PeriodDelta } from '@/shared/mocks/analytics'

function healthColor(value: string): 'success' | 'warning' | 'error' | 'default' {
  const v = value.toLowerCase()
  if (v.includes('выключ') || v.includes('работ')) return 'success'
  if (v.includes('деград') || v.includes('ожид')) return 'warning'
  if (v.includes('ошиб') || v.includes('недоступ')) return 'error'
  return 'default'
}

export function AdminDashboardPage() {
  const dash = useAdminDashboard('30d')
  const moderation = useModerationSummary()

  const loading = dash.isLoading || moderation.isLoading
  const error = dash.isError || moderation.isError

  const overview = dash.data?.overview
  const health = dash.data?.health
  const recent = dash.data?.recentActivity ?? []

  const metrics: {
    label: string
    value: string | number
    delta?: PeriodDelta
    to?: string
  }[] = overview
    ? [
        { label: 'Пользователи', value: overview.users.value, delta: overview.users, to: ROUTES.ADMIN_USERS },
        {
          label: 'Компании',
          value: overview.companies.value,
          delta: overview.companies,
          to: ROUTES.ADMIN_COMPANIES,
        },
        {
          label: 'Активные запросы',
          value: overview.activeRequests.value,
          delta: overview.activeRequests,
          to: ROUTES.ADMIN_ANALYTICS,
        },
        {
          label: 'Предложения',
          value: overview.proposals.value,
          delta: overview.proposals,
        },
        {
          label: 'Переговоры',
          value: overview.negotiations.value,
          delta: overview.negotiations,
        },
        {
          label: 'На модерации',
          value: moderation.data?.pendingTotal ?? overview.pendingModeration.value,
          delta: overview.pendingModeration,
          to: ROUTES.ADMIN_MODERATION,
        },
        {
          label: 'Открытые жалобы',
          value: overview.openReportsDelta.value,
          delta: overview.openReportsDelta,
          to: ROUTES.MODERATION_REPORTS,
        },
      ]
    : []

  return (
    <Box>
      <PageHeader
        title="Обзор платформы"
        subtitle="Состояние B2B Match · Demo / Model data"
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <AppButton component={RouterLink} to={ROUTES.ADMIN_USERS} variant="outlined" sx={{ minHeight: 44 }}>
              Пользователи
            </AppButton>
            <AppButton
              component={RouterLink}
              to={ROUTES.ADMIN_COMPANIES}
              variant="outlined"
              sx={{ minHeight: 44 }}
            >
              Компании
            </AppButton>
            <AppButton
              component={RouterLink}
              to={ROUTES.ADMIN_ANALYTICS}
              variant="contained"
              sx={{ minHeight: 44 }}
            >
              Аналитика
            </AppButton>
          </Stack>
        }
      />

      {loading ? <LoadingState rows={3} /> : null}
      {error ? (
        <ErrorState
          onRetry={() => {
            void dash.refetch()
            void moderation.refetch()
          }}
        />
      ) : null}

      {!loading && !error && overview ? (
        <>
          <Grid container spacing={1.5} sx={{ mb: 3 }}>
            {metrics.map((m) => (
              <Grid key={m.label} size={{ xs: 6, sm: 4, md: 3 }}>
                {m.to ? (
                  <CardActionArea
                    component={RouterLink}
                    to={m.to}
                    sx={{ borderRadius: 1, height: '100%', display: 'block' }}
                  >
                    <MetricCard label={m.label} value={m.value} delta={m.delta} />
                  </CardActionArea>
                ) : (
                  <MetricCard label={m.label} value={m.value} delta={m.delta} />
                )}
              </Grid>
            ))}
          </Grid>

          <Typography variant="h3" sx={{ mb: 1.5 }}>
            Здоровье платформы
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
            {health
              ? (
                  [
                    ['Mini App', health.miniApp],
                    ['Mock API', health.mockApi],
                    ['Уведомления', health.notifications],
                    ['Matching', health.matching],
                    ['Обслуживание', health.maintenance],
                  ] as const
                ).map(([label, value]) => (
                  <Chip
                    key={label}
                    label={`${label}: ${value}`}
                    color={healthColor(value)}
                    variant="outlined"
                    sx={{ minHeight: 36 }}
                  />
                ))
              : null}
            <Chip label={health?.label ?? 'Demo / Model data'} size="small" />
          </Stack>

          <Typography variant="h3" sx={{ mb: 1.5 }}>
            Модерация
          </Typography>
          <Grid container spacing={1.5} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, md: 3 }}>
              <MetricCard
                label="В очереди"
                value={moderation.data?.pendingTotal ?? overview.moderationPending}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <MetricCard label="Жалобы" value={overview.openReports} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <MetricCard
                label="Эскалации"
                value={moderation.data?.escalations ?? overview.moderation.escalations}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <MetricCard
                label="Ср. возраст очереди"
                value={`${overview.moderation.averageQueueAgeHours} ч`}
              />
            </Grid>
          </Grid>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ sm: 'center' }}
            sx={{ mb: 1.5 }}
          >
            <Typography variant="h3">Недавняя активность</Typography>
            <AppButton component={RouterLink} to={ROUTES.ADMIN_AUDIT} size="small">
              Весь audit log
            </AppButton>
          </Stack>
          <Stack spacing={1} sx={{ mb: 3 }}>
            {recent.map((ev) => (
              <Card key={ev.id} variant="outlined">
                <CardContent sx={{ py: 1.25, '&:last-child': { pb: 1.25 } }}>
                  <Typography variant="subtitle2">
                    {AUDIT_ACTION_LABELS[ev.action] ?? ev.action}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {ev.actorName} · {ev.entityName} · {formatRelativeDate(ev.timestamp)}
                  </Typography>
                  {ev.reason ? (
                    <Typography variant="caption" color="text.secondary">
                      Причина: {ev.reason}
                    </Typography>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </Stack>

          <Typography variant="h3" sx={{ mb: 1.5 }}>
            Быстрые действия
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {[
              { to: ROUTES.ADMIN_USERS, label: 'Пользователи' },
              { to: ROUTES.ADMIN_COMPANIES, label: 'Компании' },
              { to: ROUTES.ADMIN_MODERATION, label: 'Модерация' },
              { to: ROUTES.ADMIN_DICTIONARIES, label: 'Справочники' },
              { to: ROUTES.ADMIN_SETTINGS, label: 'Настройки' },
              { to: ROUTES.ADMIN_FEATURE_FLAGS, label: 'Feature flags' },
              { to: ROUTES.ADMIN_NOTIFICATIONS, label: 'Уведомления' },
            ].map((a) => (
              <AppButton
                key={a.to}
                component={RouterLink}
                to={a.to}
                variant="outlined"
                sx={{ minHeight: 44 }}
              >
                {a.label}
              </AppButton>
            ))}
            <AppButton
              component={RouterLink}
              to={adminUserPath('user-platform-admin')}
              variant="text"
              sx={{ minHeight: 44 }}
            >
              Мой профиль
            </AppButton>
            <AppButton
              component={RouterLink}
              to={adminCompanyPath('company-techsolutions')}
              variant="text"
              sx={{ minHeight: 44 }}
            >
              Пример компании
            </AppButton>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            Данные обновлены: {formatDate(new Date().toISOString())} · источник — model data
          </Typography>
        </>
      ) : null}
    </Box>
  )
}
