import { useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useModerationHistory } from '@/features/moderation/api/queries'
import {
  MODERATION_ACTION_LABELS,
  MODERATION_TYPE_LABELS,
} from '@/features/moderation/model/labels'
import { isSyntheticModerationHistory } from '@/shared/api/moderationHistoryApi'
import { formatDate } from '@/shared/lib/format'
import { EmptyState, ErrorState, LoadingState, PageHeader, SearchInput } from '@/shared/ui'

export function ModerationHistoryPage() {
  const [query, setQuery] = useState('')
  const [action, setAction] = useState<string>('all')
  const [entityType, setEntityType] = useState<string>('all')
  const filters = useMemo(
    () => ({
      query: query || undefined,
      action: action === 'all' ? undefined : action,
      entityType: entityType === 'all' ? undefined : entityType,
    }),
    [query, action, entityType],
  )
  const historyQuery = useModerationHistory(filters)
  const synthetic = isSyntheticModerationHistory()

  return (
    <Box>
      <PageHeader
        title="История решений"
        subtitle="Read-only журнал модерационных действий"
      />
      {synthetic ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          Полный decision log на backend пока недоступен. Показаны закрытые объекты очереди с
          последним статусом (не полный журнал action/actor/reason по каждому решению).
        </Alert>
      ) : null}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <Box sx={{ flex: 1, maxWidth: 420 }}>
          <SearchInput value={query} onChange={setQuery} placeholder="Поиск по объекту или модератору" />
        </Box>
        <TextField
          select
          size="small"
          label="Действие"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="all">Все</MenuItem>
          {Object.entries(MODERATION_ACTION_LABELS).map(([value, label]) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Тип"
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="all">Все</MenuItem>
          {Object.entries(MODERATION_TYPE_LABELS).map(([value, label]) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {historyQuery.isLoading ? <LoadingState variant="list" /> : null}
      {historyQuery.isError ? <ErrorState onRetry={() => void historyQuery.refetch()} /> : null}
      {!historyQuery.isLoading && !historyQuery.isError && (historyQuery.data?.length ?? 0) === 0 ? (
        <EmptyState title="История пока пуста." description="Решения появятся после проверки объектов." />
      ) : null}

      <Stack spacing={1.5}>
        {(historyQuery.data ?? []).map((entry) => (
          <Card key={entry.id} variant="outlined">
            <CardContent>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
                <Chip size="small" label={MODERATION_ACTION_LABELS[entry.decision.action]} />
                <Chip
                  size="small"
                  label={MODERATION_TYPE_LABELS[entry.entityType]}
                  variant="outlined"
                />
              </Stack>
              <Typography variant="h4">{entry.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {entry.decision.moderatorName} · {entry.companyName} ·{' '}
                {formatDate(entry.decision.createdAt)}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {entry.decision.previousStatus} → {entry.decision.newStatus}
              </Typography>
              {entry.decision.comment ? (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Причина: {entry.decision.comment}
                </Typography>
              ) : null}
              {entry.decision.reasonCode ? (
                <Typography variant="caption" color="text.secondary">
                  Код: {entry.decision.reasonCode}
                </Typography>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  )
}
