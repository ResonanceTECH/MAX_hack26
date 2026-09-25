import { useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { usePlatformAnalytics, MetricCard } from '@/features/admin'
import type { AnalyticsPeriod } from '@/shared/mocks/analytics'
import { ErrorState, LoadingState, PageHeader } from '@/shared/ui'

export function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d')
  const query = usePlatformAnalytics(period)

  if (query.isLoading) return <LoadingState variant="page" />
  if (query.isError || !query.data) return <ErrorState onRetry={() => void query.refetch()} />

  const data = query.data
  const maxFunnel = Math.max(...data.funnel.map((f) => f.value), 1)

  return (
    <Box>
      <PageHeader
        title="Аналитика платформы"
        subtitle="Model data · без случайных чисел"
        actions={
          <ToggleButtonGroup
            exclusive
            size="small"
            value={period}
            onChange={(_, v: AnalyticsPeriod | null) => {
              if (v) setPeriod(v)
            }}
          >
            <ToggleButton value="7d" sx={{ minHeight: 44, px: 2 }}>
              7 дней
            </ToggleButton>
            <ToggleButton value="30d" sx={{ minHeight: 44, px: 2 }}>
              30 дней
            </ToggleButton>
            <ToggleButton value="90d" sx={{ minHeight: 44, px: 2 }}>
              90 дней
            </ToggleButton>
          </ToggleButtonGroup>
        }
      />

      <Typography variant="h3" sx={{ mb: 1.5 }}>
        Воронка
      </Typography>
      <Stack spacing={1.5} sx={{ mb: 3 }}>
        {data.funnel.map((step) => (
          <Box key={step.label}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2">{step.label}</Typography>
              <Typography variant="body2" fontWeight={600}>
                {step.value}
                {step.rate != null ? ` · ${step.rate}%` : ''}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={(step.value / maxFunnel) * 100}
              aria-label={`${step.label}: ${step.value}`}
              sx={{ height: 10, borderRadius: 1 }}
            />
          </Box>
        ))}
      </Stack>

      <Typography variant="h3" sx={{ mb: 1.5 }}>
        Конверсии
      </Typography>
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <MetricCard label="Match → Proposal" value={`${data.conversions.matchToProposal}%`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <MetricCard
            label="Proposal → Shortlist"
            value={`${data.conversions.proposalToShortlist}%`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <MetricCard
            label="Shortlist → Negotiation"
            value={`${data.conversions.shortlistToNegotiation}%`}
          />
        </Grid>
      </Grid>

      <Typography variant="h3" sx={{ mb: 1.5 }}>
        Рост
      </Typography>
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <MetricCard
            label="Новые пользователи"
            value={data.growth.newUsers.value}
            delta={data.growth.newUsers}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <MetricCard
            label="Новые компании"
            value={data.growth.newCompanies.value}
            delta={data.growth.newCompanies}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <MetricCard
            label="Новые запросы"
            value={data.growth.newOpportunities.value}
            delta={data.growth.newOpportunities}
          />
        </Grid>
      </Grid>

      <Typography variant="h3" sx={{ mb: 1.5 }}>
        Качество матчей
      </Typography>
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <MetricCard label="Ср. score" value={data.matchQuality.averageMatchScore} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <MetricCard label="Просмотр матча" value={`${data.matchQuality.matchViewedRate}%`} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <MetricCard
            label="Match → Proposal"
            value={`${data.matchQuality.matchToProposalRate}%`}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <MetricCard
            label="Негативный feedback"
            value={`${data.matchQuality.negativeMatchFeedback}%`}
          />
        </Grid>
      </Grid>

      <Typography variant="h3" sx={{ mb: 1.5 }}>
        Модерация
      </Typography>
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <MetricCard label="В очереди" value={data.moderation.pendingItems} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <MetricCard label="Ср. возраст (ч)" value={data.moderation.averageQueueAgeHours} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <MetricCard label="Одобрено" value={data.moderation.approved} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <MetricCard label="Отклонено" value={data.moderation.rejected} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <MetricCard label="Нужны правки" value={data.moderation.needsChanges} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <MetricCard label="Жалобы" value={data.moderation.reports} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <MetricCard label="Эскалации" value={data.moderation.escalations} />
        </Grid>
      </Grid>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            Период: {data.period} · isModelData: {String(data.isModelData)} · пользователи{' '}
            {data.usersTotal} · компании {data.companiesTotal}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
