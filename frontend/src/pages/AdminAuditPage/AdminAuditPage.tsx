import { useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useAuditLog } from '@/features/admin/api/queries'
import { formatDate } from '@/shared/lib/format'
import {
  AppInput,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  SearchInput,
} from '@/shared/ui'

export function AdminAuditPage() {
  const [query, setQuery] = useState('')
  const [actor, setActor] = useState('')
  const [action, setAction] = useState('')
  const [entityType, setEntityType] = useState('')

  const filters = useMemo(
    () => ({
      query: query || undefined,
      actor: actor || undefined,
      action: action || undefined,
      entityType: entityType || undefined,
      targetType: entityType || undefined,
    }),
    [query, actor, action, entityType],
  )

  const auditQuery = useAuditLog(filters)
  const items = auditQuery.data ?? []

  return (
    <Box>
      <PageHeader title="Audit log" subtitle="Действия администраторов и модераторов" />
      <Stack spacing={1.5} sx={{ mb: 2 }}>
        <SearchInput value={query} onChange={setQuery} placeholder="Поиск по действию / объекту" />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <AppInput label="Actor" value={actor} onChange={(e) => setActor(e.target.value)} />
          <AppInput label="Action" value={action} onChange={(e) => setAction(e.target.value)} />
          <AppInput
            label="Entity type"
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
          />
        </Stack>
      </Stack>

      {auditQuery.isLoading ? <LoadingState variant="list" /> : null}
      {auditQuery.isError ? <ErrorState onRetry={() => void auditQuery.refetch()} /> : null}
      {!auditQuery.isLoading && items.length === 0 ? (
        <EmptyState title="Записей нет" description="Измените фильтры или выполните admin-действие" />
      ) : null}

      <Stack spacing={1}>
        {items.map((event) => (
          <Card key={event.id} variant="outlined">
            <CardContent>
              <Typography variant="h4">{event.action}</Typography>
              <Typography variant="body2" color="text.secondary">
                {event.actorName} ({event.role}) · {event.entityType} ·{' '}
                {event.entityLabel || event.targetName} · {formatDate(event.timestamp)}
              </Typography>
              {event.details ? (
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {event.details}
                </Typography>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  )
}
