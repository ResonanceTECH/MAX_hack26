import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppIcon } from '@/shared/ui'
import { FilterHorizontalIcon } from '@/shared/ui/icons'
import Box from '@mui/material/Box'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
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
  REGIONS,
} from '@/shared/constants/labels'
import { useUiStore } from '@/shared/hooks/useUiStore'
import {
  AppButton,
  AppInput,
  AppSelect,
  EmptyState,
  ErrorState,
  FilterDrawer,
  LoadingState,
  PageHeader,
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
      <AppSelect
        label="Регион"
        value={filters.region ?? ''}
        options={[{ value: '', label: 'Все' }, ...REGIONS.map((r) => ({ value: r, label: r }))]}
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
      <AppInput
        label="Match Score от"
        type="number"
        value={filters.minMatchScore ?? ''}
        onChange={(e) =>
          patchFilters({
            minMatchScore: e.target.value ? Number(e.target.value) : undefined,
          })
        }
        inputProps={{ min: 0, max: 100 }}
      />
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

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
        {isDesktop ? (
          <Box
            sx={{
              width: 280,
              flexShrink: 0,
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              position: 'sticky',
              top: 24,
            }}
          >
            <Typography variant="h3" sx={{ mb: 2 }}>
              Фильтры
            </Typography>
            <FiltersForm />
            <AppButton fullWidth variant="text" sx={{ mt: 2 }} onClick={reset}>
              Сбросить
            </AppButton>
          </Box>
        ) : null}

        <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
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
        </Box>
      </Stack>

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
