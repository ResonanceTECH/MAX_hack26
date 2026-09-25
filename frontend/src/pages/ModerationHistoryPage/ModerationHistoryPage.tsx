import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useModerationHistory } from '@/features/moderation/api/queries'
import {
  MODERATION_ACTION_LABELS,
  MODERATION_TYPE_LABELS,
} from '@/features/moderation/model/labels'
import { formatDate } from '@/shared/lib/format'
import { EmptyState, ErrorState, LoadingState, PageHeader } from '@/shared/ui'

export function ModerationHistoryPage() {
  const query = useModerationHistory()

  return (
    <Box>
      <PageHeader title="История решений" subtitle="Действия модераторов по объектам платформы" />
      {query.isLoading ? <LoadingState variant="list" /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : null}
      {!query.isLoading && !query.isError && (query.data?.length ?? 0) === 0 ? (
        <EmptyState title="История пуста" description="Решения появятся после проверки объектов" />
      ) : null}
      <Stack spacing={1.5}>
        {(query.data ?? []).map((entry) => (
          <Card key={entry.id} variant="outlined">
            <CardContent>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
                <Chip size="small" label={MODERATION_ACTION_LABELS[entry.decision.action]} />
                <Chip size="small" label={MODERATION_TYPE_LABELS[entry.entityType]} variant="outlined" />
              </Stack>
              <Typography variant="h4">{entry.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {entry.decision.moderatorName} · {entry.companyName} ·{' '}
                {formatDate(entry.decision.timestamp)}
              </Typography>
              {entry.decision.reason ? (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Причина: {entry.decision.reason}
                </Typography>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  )
}
