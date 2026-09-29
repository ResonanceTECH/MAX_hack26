import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppIcon } from '@/shared/ui'
import { FilterHorizontalIcon, InformationCircleIcon } from '@/shared/ui/icons'
import Box from '@mui/material/Box'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { useOpportunities } from '@/entities/opportunity/api/queries'
import { useAllMatches } from '@/entities/match/api/queries'
import { useOpportunitySearchStore } from '@/features/opportunity-search/model/searchStore'
import type { OpportunitySort } from '@/shared/api/opportunityApi'
import {
  INDUSTRIES,
  OPPORTUNITY_CATEGORIES,
  OPPORTUNITY_STATUS_LABELS,
} from '@/shared/constants/labels'
import { useUiStore } from '@/shared/hooks/useUiStore'
import {
  AppButton,
  AppInput,
  AppSelect,
  BentoGrid,
  BentoTile,
  EmptyState,
  ErrorState,
  FilterDrawer,
  LoadingState,
  PageHeader,
  RegionAutocomplete,
  SearchInput,
} from '@/shared/ui'
import { OpportunityCard } from '@/widgets/OpportunityCard/OpportunityCard'

const SORT_OPTIONS: { value: OpportunitySort; label: string }[] = [
  { value: 'match', label: 'Сначала подходящие' },
  { value: 'newest', label: 'Новые' },
  { value: 'budget_asc', label: 'Бюджет по возрастанию' },
  { value: 'budget_desc', label: 'Бюджет по убыванию' },
  { value: 'deadline', label: 'Скоро заканчивается приём' },
]

const MATCH_SCORE_HINT =
  'Оценка совпадения запроса с профилем вашей компании от 0 до 100%. Чем выше — тем лучше совпадают отрасль, технологии, бюджет и регион. Фильтр скрывает запросы ниже указанного порога.'

/** Integer percent 0–100 for filter store; empty → undefined. */
function parseMinMatchScore(raw: string): number | undefined {
  const trimmed = raw.trim()
  if (!trimmed) return undefined
  const n = Number(trimmed)
  if (!Number.isFinite(n)) return undefined
  return Math.min(100, Math.max(0, Math.round(n)))
}

function MatchScoreFilterField() {
  const committed = useOpportunitySearchStore((s) => s.filters.minMatchScore)
  const patchFilters = useOpportunitySearchStore((s) => s.patchFilters)
  const [draft, setDraft] = useState(() => (committed != null ? String(committed) : ''))
  const [focused, setFocused] = useState(false)

  // Keep input in sync when filters reset externally
  useEffect(() => {
    if (!focused) setDraft(committed != null ? String(committed) : '')
  }, [committed, focused])

  const commit = (raw: string) => {
    const next = parseMinMatchScore(raw)
    patchFilters({ minMatchScore: next })
    setDraft(next != null ? String(next) : '')
  }

  return (
    <AppInput
      label={
        <Stack component="span" direction="row" alignItems="center" spacing={0.25}>
          <span>Совпадение от, %</span>
          <Tooltip title={MATCH_SCORE_HINT} enterTouchDelay={0} leaveTouchDelay={3000}>
            <IconButton
              size="small"
              aria-label="Что такое совпадение"
              tabIndex={0}
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => e.preventDefault()}
              sx={{ p: 0.25, color: 'text.secondary' }}
            >
              <AppIcon icon={InformationCircleIcon} size={16} aria-hidden />
            </IconButton>
          </Tooltip>
        </Stack>
      }
      type="number"
      inputMode="numeric"
      placeholder="например, 80"
      value={draft}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        commit(draft)
        setFocused(false)
      }}
      onChange={(e) => {
        const raw = e.target.value
        setDraft(raw)
        const next = parseMinMatchScore(raw)
        patchFilters({ minMatchScore: next })
      }}
      onKeyDown={(e) => {
        if (['e', 'E', '+', '-', '.', ','].includes(e.key)) e.preventDefault()
      }}
      inputProps={{ min: 0, max: 100, step: 1 }}
    />
  )
}

function FiltersForm() {
  const filters = useOpportunitySearchStore((s) => s.filters)
  const patchFilters = useOpportunitySearchStore((s) => s.patchFilters)

  return (
    <Stack spacing={2}>
      <AppSelect
        label="Категория"
        value={filters.category ?? ''}
        options={[
          { value: '', label: 'Все' },
          ...OPPORTUNITY_CATEGORIES.map((c) => ({ value: c, label: c })),
        ]}
        onChange={(value) => patchFilters({ category: value || undefined })}
      />
      <AppSelect
        label="Отрасль"
        value={filters.industries?.[0] ?? ''}
        options={[{ value: '', label: 'Все' }, ...INDUSTRIES.map((i) => ({ value: i, label: i }))]}
        onChange={(value) => patchFilters({ industries: value ? [value] : undefined })}
      />
      <RegionAutocomplete
        label="Регион"
        value={filters.region ?? ''}
        allowEmpty
        emptyLabel="Все"
        helperText={null}
        onChange={(value) => patchFilters({ region: value || undefined })}
      />
      <AppInput
        label="Бюджет от"
        type="number"
        value={filters.budgetMin ?? ''}
        onChange={(e) =>
          patchFilters({
            budgetMin: e.target.value ? Number(e.target.value) : undefined,
          })
        }
      />
      <AppInput
        label="Бюджет до"
        type="number"
        value={filters.budgetMax ?? ''}
        onChange={(e) =>
          patchFilters({
            budgetMax: e.target.value ? Number(e.target.value) : undefined,
          })
        }
      />
      <AppInput
        label="Технологии"
        placeholder="React, 1С"
        value={filters.technologies?.join(', ') ?? ''}
        onChange={(e) => {
          const techs = e.target.value
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
          patchFilters({ technologies: techs.length ? techs : undefined })
        }}
      />
      <FormControlLabel
        control={
          <Switch
            checked={Boolean(filters.remoteAllowed)}
            onChange={(e) =>
              patchFilters({
                remoteAllowed: e.target.checked ? true : undefined,
              })
            }
          />
        }
        label="Удалённый формат"
      />
      <AppSelect
        label="Статус"
        value={filters.status ?? ''}
        options={[
          { value: '', label: 'Все' },
          ...Object.entries(OPPORTUNITY_STATUS_LABELS).map(([value, label]) => ({
            value,
            label,
          })),
        ]}
        onChange={(value) => patchFilters({ status: value || undefined })}
      />
      <MatchScoreFilterField />
    </Stack>
  )
}

export function OpportunitiesPage() {
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
  const [searchParams] = useSearchParams()
  const filters = useOpportunitySearchStore((s) => s.filters)
  const sort = useOpportunitySearchStore((s) => s.sort)
  const setSort = useOpportunitySearchStore((s) => s.setSort)
  const reset = useOpportunitySearchStore((s) => s.reset)
  const drawerOpen = useUiStore((s) => s.filterDrawerOpen)
  const setDrawerOpen = useUiStore((s) => s.setFilterDrawerOpen)
  const queryFromUrl = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(queryFromUrl || filters.query || '')

  const effectiveQuery = query || queryFromUrl || filters.query

  const { data, isLoading, isError, refetch } = useOpportunities(
    { ...filters, query: effectiveQuery || undefined },
    sort,
  )
  const matchesQuery = useAllMatches()

  const items = data ?? []

  return (
    <Box>
      <PageHeader
        title="Возможности"
        subtitle="Найдите подходящий заказ для вашей компании."
        actions={
          !isDesktop ? (
            <AppButton
              variant="outlined"
              startIcon={<AppIcon icon={FilterHorizontalIcon} size={18} />}
              onClick={() => setDrawerOpen(true)}
              aria-label="Открыть фильтры"
            >
              Фильтры
            </AppButton>
          ) : null
        }
      />

      <BentoGrid>
        {isDesktop ? (
          <BentoTile
            span={4}
            sx={{
              position: 'sticky',
              top: { md: 'calc(56px + 16px)' },
              maxHeight: { md: 'calc(100dvh - 56px - 32px)' },
              overflow: 'auto',
              alignSelf: 'start',
            }}
          >
            <Typography variant="h3" sx={{ mb: 2 }}>
              Фильтры
            </Typography>
            <FiltersForm />
            <AppButton fullWidth variant="text" sx={{ mt: 2 }} onClick={reset}>
              Сбросить
            </AppButton>
          </BentoTile>
        ) : null}

        <BentoTile span={isDesktop ? 8 : 12}>
          <Stack spacing={2} sx={{ mb: 3 }}>
            <SearchInput
              value={query}
              onChange={setQuery}
              label="Поиск возможностей"
              placeholder="CRM, логистика, поставка..."
            />
            <TextField
              select
              fullWidth
              label="Сортировка"
              value={sort}
              onChange={(e) => setSort(e.target.value as OpportunitySort)}
            >
              {SORT_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          {isLoading ? <LoadingState rows={4} /> : null}
          {isError ? <ErrorState onRetry={() => void refetch()} /> : null}
          {!isLoading && !isError && items.length === 0 ? (
            <EmptyState
              title="Пока нет подходящих заказов"
              description="Попробуйте изменить фильтры или дополнить профиль компании."
              actionLabel="Сбросить фильтры"
              onAction={reset}
            />
          ) : null}
          {!isLoading && !isError ? (
            <Stack spacing={2}>
              {items.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  match={matchesQuery.data?.find((m) => m.opportunityId === opp.id)}
                />
              ))}
            </Stack>
          ) : null}
        </BentoTile>
      </BentoGrid>

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onReset={reset}
        onApply={() => undefined}
      >
        <FiltersForm />
      </FilterDrawer>
    </Box>
  )
}
