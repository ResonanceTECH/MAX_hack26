import { useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { useAuditLog, AUDIT_ACTION_LABELS, AuditDiffViewer } from '@/features/admin'
import { formatDate } from '@/shared/lib/format'
import {
  AppInput,
  AppSelect,
  EmptyState,
  ErrorState,
  FilterDrawer,
  LoadingState,
  PageHeader,
  SearchInput,
  AppButton,
} from '@/shared/ui'

const ACTION_OPTIONS = [
  { value: '', label: 'Все действия' },
  ...Object.keys(AUDIT_ACTION_LABELS)
    .filter((k) => k === k.toUpperCase())
    .map((k) => ({ value: k, label: AUDIT_ACTION_LABELS[k] ?? k })),
]

export function AdminAuditPage() {
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
  const [query, setQuery] = useState('')
  const [actor, setActor] = useState('')
  const [action, setAction] = useState('')
  const [entityType, setEntityType] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)

  const filters = useMemo(
    () => ({
      query: query || undefined,
      actor: actor || undefined,
      action: action || undefined,
      entityType: entityType || undefined,
    }),
    [query, actor, action, entityType],
  )

  const auditQuery = useAuditLog(filters)
  const items = auditQuery.data ?? []

  const filtersUi = (
    <>
      <AppInput label="Актор" value={actor} onChange={(e) => setActor(e.target.value)} />
      <AppSelect
        label="Действие"
        value={action}
        onChange={setAction}
        options={ACTION_OPTIONS}
      />
      <AppSelect
        label="Тип сущности"
        value={entityType}
        onChange={setEntityType}
        options={[
          { value: '', label: 'Все' },
          { value: 'user', label: 'user' },
          { value: 'company', label: 'company' },
          { value: 'dictionary', label: 'dictionary' },
          { value: 'feature_flag', label: 'feature_flag' },
          { value: 'settings', label: 'settings' },
          { value: 'escalation', label: 'escalation' },
        ]}
      />
    </>
  )

  return (
    <Box>
      <PageHeader
        title="Audit log"
        subtitle="Только просмотр · удаление и редактирование недоступны"
      />
      <Stack spacing={1.5} sx={{ mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
          <Box sx={{ flex: 1 }}>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Поиск по действию / объекту"
            />
          </Box>
          {isDesktop ? (
            <Stack direction="row" spacing={1.5} sx={{ minWidth: 420 }}>
              {filtersUi}
            </Stack>
          ) : (
            <AppButton variant="outlined" onClick={() => setDrawerOpen(true)} sx={{ minHeight: 44 }}>
              Фильтры
            </AppButton>
          )}
        </Stack>
      </Stack>

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onReset={() => {
          setActor('')
          setAction('')
          setEntityType('')
        }}
      >
        {filtersUi}
      </FilterDrawer>

      {auditQuery.isLoading ? <LoadingState variant="list" /> : null}
      {auditQuery.isError ? <ErrorState onRetry={() => void auditQuery.refetch()} /> : null}
      {!auditQuery.isLoading && items.length === 0 ? (
        <EmptyState
          title="Записей нет"
          description="Измените фильтры или выполните admin-действие"
        />
      ) : null}

      {!isDesktop ? (
        <Stack spacing={1}>
          {items.map((event) => (
            <Card key={event.id} variant="outlined">
              <CardContent>
                <Typography variant="h4">
                  {AUDIT_ACTION_LABELS[event.action] ?? event.action}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {event.actorName} ({event.role}) · {event.entityType} ·{' '}
                  {event.entityName} · {formatDate(event.timestamp)}
                </Typography>
                {event.reason ? (
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    Причина: {event.reason}
                  </Typography>
                ) : null}
                <AuditDiffViewer
                  before={event.before}
                  after={event.after}
                  previousValue={event.previousValue}
                  newValue={event.newValue}
                />
              </CardContent>
            </Card>
          ))}
        </Stack>
      ) : items.length > 0 ? (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Время</TableCell>
              <TableCell>Актор</TableCell>
              <TableCell>Действие</TableCell>
              <TableCell>Объект</TableCell>
              <TableCell>Причина</TableCell>
              <TableCell>Diff</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((event) => (
              <TableRow key={event.id} hover>
                <TableCell>{formatDate(event.timestamp)}</TableCell>
                <TableCell>
                  {event.actorName}
                  <Typography variant="caption" display="block" color="text.secondary">
                    {event.role}
                  </Typography>
                </TableCell>
                <TableCell>{AUDIT_ACTION_LABELS[event.action] ?? event.action}</TableCell>
                <TableCell>
                  {event.entityType}/{event.entityName}
                </TableCell>
                <TableCell>{event.reason ?? '—'}</TableCell>
                <TableCell sx={{ minWidth: 220 }}>
                  <AuditDiffViewer
                    before={event.before}
                    after={event.after}
                    previousValue={event.previousValue}
                    newValue={event.newValue}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </Box>
  )
}
