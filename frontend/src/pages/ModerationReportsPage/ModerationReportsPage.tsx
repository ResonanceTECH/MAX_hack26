import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { useReports } from '@/features/moderation/api/queries'
import {
  REPORT_STATUS_LABELS,
  REPORT_TYPE_LABELS,
} from '@/features/moderation/model/labels'
import { ModerationPriorityChip } from '@/features/moderation/ui/ModerationPriorityChip'
import { formatDate } from '@/shared/lib/format'
import { moderationReportPath, ROUTES } from '@/shared/constants/routes'
import { AppButton, EmptyState, ErrorState, LoadingState, PageHeader } from '@/shared/ui'
import Chip from '@mui/material/Chip'

type TabKey = 'open_tab' | 'in_progress_tab' | 'closed_tab' | 'escalated_tab'

export function ModerationReportsPage() {
  const [tab, setTab] = useState<TabKey>('open_tab')
  const query = useReports({ status: tab })
  const navigate = useNavigate()

  return (
    <Box>
      <PageHeader title="Жалобы" subtitle="Обращения о нарушениях на платформе" />
      <Tabs
        value={tab}
        onChange={(_, v: TabKey) => setTab(v)}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{ mb: 2 }}
      >
        <Tab value="open_tab" label="Открытые" />
        <Tab value="in_progress_tab" label="В работе" />
        <Tab value="closed_tab" label="Закрытые" />
        <Tab value="escalated_tab" label="Эскалированные" />
      </Tabs>

      {query.isLoading ? <LoadingState variant="cards" /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : null}
      {!query.isLoading && !query.isError && (query.data?.length ?? 0) === 0 ? (
        <EmptyState title="Открытых жалоб нет." description="Новые обращения появятся здесь." />
      ) : null}

      <Stack spacing={1.5}>
        {(query.data ?? []).map((report) => (
          <Card key={report.id} variant="outlined">
            <CardContent>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
                <Chip size="small" label={REPORT_TYPE_LABELS[report.type]} />
                <Chip size="small" label={REPORT_STATUS_LABELS[report.status]} />
                <ModerationPriorityChip priority={report.priority} />
              </Stack>
              <Typography variant="h4">{report.targetName}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                От: {report.reporterName} · {formatDate(report.createdAt)} · {report.targetType}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                {report.description}
              </Typography>
            </CardContent>
            <CardActions sx={{ px: 2, pb: 2 }}>
              <AppButton
                component={RouterLink}
                to={moderationReportPath(report.id)}
                variant="contained"
                size="small"
              >
                Рассмотреть
              </AppButton>
              <AppButton size="small" onClick={() => navigate(ROUTES.MODERATION_QUEUE)}>
                К очереди
              </AppButton>
            </CardActions>
          </Card>
        ))}
      </Stack>
    </Box>
  )
}
