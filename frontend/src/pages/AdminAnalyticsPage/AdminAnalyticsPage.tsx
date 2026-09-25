import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { usePlatformAnalytics } from '@/features/admin/api/queries'
import { ErrorState, LoadingState, PageHeader } from '@/shared/ui'

export function AdminAnalyticsPage() {
  const query = usePlatformAnalytics()

  if (query.isLoading) return <LoadingState variant="page" />
  if (query.isError || !query.data) return <ErrorState onRetry={() => void query.refetch()} />

  const data = query.data
  const maxFunnel = Math.max(...data.funnel.map((f) => f.value), 1)

  return (
    <Box>
      <PageHeader title="Аналитика" subtitle="Продуктовые показатели платформы" />
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        {[
          { label: 'Созданные запросы', value: data.createdOpportunities },
          { label: 'Опубликованные', value: data.publishedOpportunities },
          { label: 'Proposals', value: data.createdProposals },
          { label: 'Matches', value: data.metrics.matches },
          { label: 'Shortlists', value: data.shortlists },
          { label: 'Negotiations', value: data.negotiations },
        ].map((m) => (
          <Grid key={m.label} size={{ xs: 6, sm: 4, md: 2 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {m.label}
                </Typography>
                <Typography variant="h2">{m.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h3" sx={{ mb: 2 }}>
        Funnel: Opportunity → Proposal → Shortlist → Negotiation
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

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Метрика</TableCell>
            <TableCell align="right">Значение</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>Пользователи</TableCell>
            <TableCell align="right">{data.usersTotal}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Компании</TableCell>
            <TableCell align="right">{data.companiesTotal}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Pending moderation</TableCell>
            <TableCell align="right">{data.moderationPending}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Box>
  )
}
