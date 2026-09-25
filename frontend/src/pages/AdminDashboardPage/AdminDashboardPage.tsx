import { Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import {
  useAdminAnalyticsOverview,
  useAdminCompanies,
  useAdminUsers,
} from '@/features/admin/api/queries'
import { useModerationSummary } from '@/features/moderation/api/queries'
import { ROUTES } from '@/shared/constants/routes'
import { AppButton, ErrorState, LoadingState, PageHeader } from '@/shared/ui'

export function AdminDashboardPage() {
  const overview = useAdminAnalyticsOverview()
  const users = useAdminUsers()
  const companies = useAdminCompanies()
  const moderation = useModerationSummary()

  const loading =
    overview.isLoading || users.isLoading || companies.isLoading || moderation.isLoading
  const error = overview.isError || users.isError || companies.isError || moderation.isError

  const metrics = [
    { label: 'Пользователи', value: overview.data?.usersTotal ?? users.data?.length ?? '—' },
    { label: 'Компании', value: overview.data?.companiesTotal ?? companies.data?.length ?? '—' },
    { label: 'Открытые запросы', value: overview.data?.opportunitiesOpen ?? '—' },
    { label: 'Активные сделки', value: overview.data?.dealsActive ?? '—' },
    { label: 'Матчи за месяц', value: overview.data?.matchesThisMonth ?? '—' },
    { label: 'На модерации', value: moderation.data?.pendingTotal ?? overview.data?.moderationPending ?? '—' },
  ]

  return (
    <Box>
      <PageHeader
        title="Админка платформы"
        subtitle="Сводка состояния B2B Match"
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <AppButton component={RouterLink} to={ROUTES.ADMIN_USERS} variant="outlined">
              Пользователи
            </AppButton>
            <AppButton component={RouterLink} to={ROUTES.ADMIN_COMPANIES} variant="outlined">
              Компании
            </AppButton>
            <AppButton component={RouterLink} to={ROUTES.ADMIN_ANALYTICS} variant="contained">
              Аналитика
            </AppButton>
          </Stack>
        }
      />

      {loading ? <LoadingState rows={2} /> : null}
      {error ? (
        <ErrorState
          onRetry={() => {
            void overview.refetch()
            void users.refetch()
            void companies.refetch()
            void moderation.refetch()
          }}
        />
      ) : null}

      {!loading && !error ? (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {metrics.map((m) => (
            <Grid item xs={6} md={4} key={m.label}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    {m.label}
                  </Typography>
                  <Typography variant="h2" sx={{ mt: 0.5 }}>
                    {m.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : null}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap" useFlexGap>
        <AppButton component={RouterLink} to={ROUTES.ADMIN_DICTIONARIES} variant="text">
          Справочники
        </AppButton>
        <AppButton component={RouterLink} to={ROUTES.ADMIN_AUDIT} variant="text">
          Аудит
        </AppButton>
        <AppButton component={RouterLink} to={ROUTES.ADMIN_SETTINGS} variant="text">
          Настройки
        </AppButton>
        <AppButton component={RouterLink} to={ROUTES.ADMIN_MODERATION} variant="text">
          Модерация
        </AppButton>
      </Stack>
    </Box>
  )
}
