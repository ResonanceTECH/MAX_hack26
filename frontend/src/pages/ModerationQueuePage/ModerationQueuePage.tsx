import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Badge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import type { ModerationEntityType } from '@/entities/moderation'
import {
  useAssignModerationItem,
  useEscalateModerationItem,
  useModerationQueue,
} from '@/features/moderation/api/queries'
import { useQueueFiltersStore } from '@/features/moderation/model/queueFiltersStore'
import { ESCALATION_REASON_LABELS } from '@/features/moderation/model/labels'
import { EscalateDialog } from '@/features/moderation/ui/DecisionDialogs'
import { ModerationQueueCard } from '@/features/moderation/ui/ModerationQueueCard'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { ESCALATION_REASON } from '@/entities/escalation'
import { AppButton, EmptyState, ErrorState, FilterDrawer, LoadingState, PageHeader, SearchInput, AppIcon } from '@/shared/ui'
import { FilterHorizontalIcon } from '@/shared/ui/icons'
import { ROUTES } from '@/shared/constants/routes'

type TabKey = 'all' | ModerationEntityType

const TABS: { key: TabKey; label: string; path?: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'company', label: 'Компании', path: 'companies' },
  { key: 'opportunity', label: 'Запросы', path: 'opportunities' },
  { key: 'case', label: 'Кейсы', path: 'cases' },
  { key: 'document', label: 'Документы', path: 'documents' },
]

const PATH_TO_TAB: Record<string, TabKey> = {
  companies: 'company',
  opportunities: 'opportunity',
  cases: 'case',
  documents: 'document',
}

export function ModerationQueuePage() {
  const { queueType } = useParams()
  const navigate = useNavigate()
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)
  const assign = useAssignModerationItem()
  const escalate = useEscalateModerationItem()

  const store = useQueueFiltersStore()
  const [filterOpen, setFilterOpen] = useState(false)
  const [queryLocal, setQueryLocal] = useState(store.query)
  const [escalateId, setEscalateId] = useState<string | null>(null)

  useEffect(() => {
    const tab = queueType ? PATH_TO_TAB[queueType] : 'all'
    if (tab) store.setType(tab)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync route → store once per param
  }, [queueType])

  useEffect(() => {
    const t = window.setTimeout(() => store.setQuery(queryLocal), 300)
    return () => window.clearTimeout(t)
  }, [queryLocal, store])

  const filters = useMemo(
    () => ({
      type: store.type,
      status: store.status,
      priority: store.priority,
      query: store.query || undefined,
      reason: store.reason,
      hasReports: store.hasReports || undefined,
      olderThanHours: store.olderThanHours ?? undefined,
      sort: store.sort,
      source: store.source,
    }),
    [store],
  )

  const queueQuery = useModerationQueue(filters)
  const items = queueQuery.data ?? []
  const tab: TabKey = store.type === 'all' ? 'all' : store.type
  const activeFilters = store.activeFilterCount()

  const onTab = (_: unknown, value: TabKey) => {
    store.setType(value)
    const meta = TABS.find((t) => t.key === value)
    navigate(meta?.path ? `${ROUTES.MODERATION_QUEUE}/${meta.path}` : ROUTES.MODERATION_QUEUE)
  }

  return (
    <Box>
      <PageHeader
        title="Очередь модерации"
        subtitle="Объекты, ожидающие проверки."
        actions={
          <IconButton aria-label="Фильтры" onClick={() => setFilterOpen(true)}>
            <Badge badgeContent={activeFilters || undefined} color="secondary">
              <AppIcon icon={FilterHorizontalIcon} size={22} />
            </Badge>
          </IconButton>
        }
      />

      <Tabs
        value={tab}
        onChange={onTab}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{ mb: 2 }}
      >
        {TABS.map((t) => (
          <Tab key={t.key} value={t.key} label={t.label} />
        ))}
      </Tabs>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <Box sx={{ flex: 1, maxWidth: 480 }}>
          <SearchInput
            value={queryLocal}
            onChange={setQueryLocal}
            placeholder="Поиск по названию, компании, ИНН или ID"
          />
        </Box>
        <TextField
          select
          size="small"
          label="Сортировка"
          value={store.sort}
          onChange={(e) => store.setSort(e.target.value as typeof store.sort)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="urgent">Сначала срочные</MenuItem>
          <MenuItem value="oldest">Сначала старые</MenuItem>
          <MenuItem value="newest">Сначала новые</MenuItem>
          <MenuItem value="reports">По количеству жалоб</MenuItem>
          <MenuItem value="priority">По приоритету</MenuItem>
        </TextField>
      </Stack>

      {queueQuery.isLoading ? <LoadingState rows={4} variant="list" /> : null}
      {queueQuery.isError ? <ErrorState onRetry={() => void queueQuery.refetch()} /> : null}
      {!queueQuery.isLoading && !queueQuery.isError && items.length === 0 ? (
        <EmptyState title="Очередь пуста" description="Новых объектов для проверки пока нет." />
      ) : null}

      <Stack spacing={1.5}>
        {items.map((item) => (
          <ModerationQueueCard
            key={item.id}
            item={item}
            onAssign={() =>
              void assign
                .mutateAsync(item.id)
                .then(() => showSuccess('Объект взят в работу'))
                .catch((e: Error) => showError(e.message))
            }
            onEscalate={() => setEscalateId(item.id)}
          />
        ))}
      </Stack>

      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={() => setFilterOpen(false)}
        onReset={() => store.resetFilters()}
      >
        <TextField
          select
          fullWidth
          label="Status"
          value={store.status}
          onChange={(e) => store.setStatus(e.target.value as typeof store.status)}
        >
          <MenuItem value="open">Открытые (ожидают)</MenuItem>
          <MenuItem value="all">Все</MenuItem>
          <MenuItem value="PENDING">Ожидает проверки</MenuItem>
          <MenuItem value="IN_REVIEW">На проверке</MenuItem>
          <MenuItem value="NEEDS_CHANGES">Нужны исправления</MenuItem>
          <MenuItem value="APPROVED">Одобрено</MenuItem>
          <MenuItem value="REJECTED">Отклонено</MenuItem>
          <MenuItem value="BLOCKED">Заблокировано</MenuItem>
          <MenuItem value="ESCALATED">Эскалировано</MenuItem>
        </TextField>
        <TextField
          select
          fullWidth
          label="Priority"
          value={store.priority}
          onChange={(e) => store.setPriority(e.target.value as typeof store.priority)}
        >
          <MenuItem value="all">Все</MenuItem>
          <MenuItem value="LOW">Низкий</MenuItem>
          <MenuItem value="NORMAL">Обычный</MenuItem>
          <MenuItem value="HIGH">Высокий</MenuItem>
          <MenuItem value="CRITICAL">Критический</MenuItem>
        </TextField>
        <FormControlLabel
          control={
            <Switch
              checked={store.hasReports}
              onChange={(_, v) => store.setHasReports(v)}
            />
          }
          label="Только с жалобами"
        />
        <FormControlLabel
          control={
            <Switch
              checked={store.olderThanHours === 12}
              onChange={(_, v) => store.setOlderThanHours(v ? 12 : null)}
            />
          }
          label="Старше 12 часов"
        />
        <Typography variant="body2" color="text.secondary">
          Активных фильтров: {activeFilters}
        </Typography>
      </FilterDrawer>

      <EscalateDialog
        open={Boolean(escalateId)}
        title="Передать Platform Admin"
        reasons={Object.entries(ESCALATION_REASON_LABELS).map(([value, label]) => ({
          value,
          label,
        }))}
        loading={escalate.isPending}
        onClose={() => setEscalateId(null)}
        onSubmit={async (values) => {
          if (!escalateId) return
          try {
            await escalate.mutateAsync({
              id: escalateId,
              input: {
                reasonCode: values.reasonCode || ESCALATION_REASON.OTHER,
                comment: values.comment,
              },
            })
            showSuccess('Случай передан администратору')
            setEscalateId(null)
          } catch (e) {
            showError(e instanceof Error ? e.message : 'Ошибка')
          }
        }}
      />

      <Box sx={{ mt: 2 }}>
        <AppButton variant="text" onClick={() => navigate(ROUTES.MODERATION)}>
          К обзору
        </AppButton>
      </Box>
    </Box>
  )
}
