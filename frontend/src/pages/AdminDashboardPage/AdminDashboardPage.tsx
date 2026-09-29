import { Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useAdminDashboard, AUDIT_ACTION_LABELS } from '@/features/admin'
import { useModerationSummary } from '@/features/moderation/api/queries'
import { ROUTES, adminUserPath, adminCompanyPath } from '@/shared/constants/routes'
import { formatDate, formatRelativeDate } from '@/shared/lib/format'
import {
  AppButton,
  BentoGrid,
  BentoTile,
  ErrorState,
  LoadingState,
  PageHeader,
} from '@/shared/ui'
import type { PeriodDelta } from '@/shared/mocks/analytics'

function healthColor(value: string): 'success' | 'warning' | 'error' | 'default' {
  const v = value.toLowerCase()
  if (v.includes('выключ') || v.includes('работ')) return 'success'
  if (v.includes('деград') || v.includes('ожид')) return 'warning'
  if (v.includes('ошиб') || v.includes('недоступ')) return 'error'
  return 'default'
}

function formatDelta(delta?: PeriodDelta | null): { text: string; color: string } | null {
  if (!delta) return null
  const sign = delta.changePercent > 0 ? '+' : ''
  const color =
    delta.changePercent > 0
      ? 'success.main'
      : delta.changePercent < 0
        ? 'error.main'
        : 'text.secondary'
  return {
    text: `${sign}${delta.changePercent}% к пред. периоду`,
    color,
  }
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
            <AppButton
              component={RouterLink}
              to={ROUTES.ADMIN_USERS}
              variant="outlined"
              sx={{ minHeight: 44 }}
            >
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
        <BentoGrid>
          <BentoTile span={8} variant="emphasis">
            <Typography variant="h2" component="h2" sx={{ mb: 0.5 }}>
              Ключевые метрики
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Данные обновлены: {formatDate(new Date().toISOString())} · источник — model data
            </Typography>
          </BentoTile>

          <BentoTile span={4}>
            <Typography variant="h4" sx={{ mb: 1 }}>
              Здоровье
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
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
          </BentoTile>

          {metrics.map((m) => {
            const d = formatDelta(m.delta)
            return (
              <BentoTile
                key={m.label}
                span={3}
                to={m.to}
                variant={m.to ? 'action' : 'default'}
              >
                <Typography variant="body2" color="text.secondary">
                  {m.label}
                </Typography>
                <Typography variant="h2" sx={{ mt: 0.5, fontSize: { xs: '1.5rem', md: '1.75rem' } }}>
                  {m.value}
                </Typography>
                {d ? (
                  <Typography variant="caption" sx={{ color: d.color, mt: 0.5 }}>
                    {d.text}
                  </Typography>
                ) : null}
              </BentoTile>
            )
          })}

          <BentoTile span={3} variant="muted">
            <Typography variant="body2" color="text.secondary">
              В очереди
            </Typography>
            <Typography variant="h2" sx={{ mt: 0.5 }}>
              {moderation.data?.pendingTotal ?? overview.moderationPending}
            </Typography>
          </BentoTile>
          <BentoTile span={3} variant="muted">
            <Typography variant="body2" color="text.secondary">
              Жалобы
            </Typography>
            <Typography variant="h2" sx={{ mt: 0.5 }}>
              {overview.openReports}
            </Typography>
          </BentoTile>
          <BentoTile span={3} variant="muted">
            <Typography variant="body2" color="text.secondary">
              Эскалации
            </Typography>
            <Typography variant="h2" sx={{ mt: 0.5 }}>
              {moderation.data?.escalations ?? overview.moderation.escalations}
            </Typography>
          </BentoTile>
          <BentoTile span={3} variant="muted">
            <Typography variant="body2" color="text.secondary">
              Ср. возраст очереди
            </Typography>
            <Typography variant="h2" sx={{ mt: 0.5 }}>
              {overview.moderation.averageQueueAgeHours} ч
            </Typography>
          </BentoTile>

          <BentoTile span={8}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 1.5 }}
            >
              <Typography variant="h3">Недавняя активность</Typography>
              <AppButton component={RouterLink} to={ROUTES.ADMIN_AUDIT} size="small">
                Весь audit log
              </AppButton>
            </Stack>
            <Stack spacing={1}>
              {recent.map((ev) => (
                <Box
                  key={ev.id}
                  sx={{
                    py: 1.25,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 0 },
                  }}
                >
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
                </Box>
              ))}
            </Stack>
          </BentoTile>

          <BentoTile span={4}>
            <Typography variant="h3" sx={{ mb: 1.5 }}>
              Быстрые действия
            </Typography>
            <Stack spacing={1}>
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
                  sx={{ minHeight: 44, justifyContent: 'flex-start' }}
                >
                  {a.label}
                </AppButton>
              ))}
              <AppButton
                component={RouterLink}
                to={adminUserPath('user-platform-admin')}
                variant="text"
                sx={{ minHeight: 44, justifyContent: 'flex-start' }}
              >
                Мой профиль
              </AppButton>
              <AppButton
                component={RouterLink}
                to={adminCompanyPath('company-techsolutions')}
                variant="text"
                sx={{ minHeight: 44, justifyContent: 'flex-start' }}
              >
                Пример компании
              </AppButton>
            </Stack>
          </BentoTile>
        </BentoGrid>
      ) : null}
    </Box>
  )
}
