import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppIcon } from '@/shared/ui'
import { FilterHorizontalIcon } from '@/shared/ui/icons'
import Box from '@mui/material/Box'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { useCompanies } from '@/entities/company/api/queries'
import { useCompanySearchStore } from '@/features/company-search/model/searchStore'
import { COMPANY_SERVICES, INDUSTRIES } from '@/shared/constants/labels'
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
  RegionAutocomplete,
  SearchInput,
} from '@/shared/ui'
import { CompanyCard } from '@/widgets/CompanyCard/CompanyCard'

function CompanyFiltersForm() {
  const filters = useCompanySearchStore((s) => s.filters)
  const patch = useCompanySearchStore((s) => s.patchFilters)

  return (
    <Stack spacing={2}>
      <AppSelect
        label="Отрасль"
        value={filters.industries?.[0] ?? ''}
        options={[{ value: '', label: 'Все' }, ...INDUSTRIES.map((i) => ({ value: i, label: i }))]}
        onChange={(v) => patch({ industries: v ? [v] : undefined })}
      />
      <AppSelect
        label="Услуги"
        value={filters.services?.[0] ?? ''}
        options={[{ value: '', label: 'Все' }, ...COMPANY_SERVICES.map((s) => ({ value: s, label: s }))]}
        onChange={(v) => patch({ services: v ? [v] : undefined })}
      />
      <AppInput
        label="Технологии"
        value={filters.technologies?.join(', ') ?? ''}
        onChange={(e) => {
          const technologies = e.target.value
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
          patch({ technologies: technologies.length ? technologies : undefined })
        }}
      />
      <RegionAutocomplete
        label="Регион"
        value={filters.region ?? ''}
        allowEmpty
        emptyLabel="Все"
        helperText={null}
        onChange={(v) => patch({ region: v || undefined })}
      />
      <AppInput
        label="Стоимость до"
        type="number"
        inputMode="numeric"
        inputProps={{ min: 1, step: 1000 }}
        value={filters.priceTo ?? ''}
        onChange={(e) =>
          patch({
            priceTo: e.target.value ? Number(e.target.value) : undefined,
            priceFrom: undefined,
          })
        }
      />
      <AppInput
        label="Рейтинг от"
        type="number"
        value={filters.minRating ?? ''}
        inputProps={{ min: 0, max: 5, step: 0.1 }}
        onChange={(e) => patch({ minRating: e.target.value ? Number(e.target.value) : undefined })}
      />
      <FormControlLabel
        control={
          <Switch
            checked={Boolean(filters.verified)}
            onChange={(e) => patch({ verified: e.target.checked || undefined })}
          />
        }
        label="Только verified"
      />
      <FormControlLabel
        control={
          <Switch
            checked={Boolean(filters.hasCases)}
            onChange={(e) => patch({ hasCases: e.target.checked || undefined })}
          />
        }
        label="Есть кейсы"
      />
    </Stack>
  )
}

export function CompaniesPage() {
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
  const [searchParams] = useSearchParams()
  const filters = useCompanySearchStore((s) => s.filters)
  const reset = useCompanySearchStore((s) => s.reset)
  const drawerOpen = useUiStore((s) => s.filterDrawerOpen)
  const setDrawerOpen = useUiStore((s) => s.setFilterDrawerOpen)
  const [query, setQuery] = useState(filters.query ?? '')

  const focusSupply = searchParams.get('focus') === 'supply'
  const effectiveFilters = useMemo(
    () => ({
      ...filters,
      query: query || filters.query,
      industries: focusSupply ? ['Производство', 'Логистика'] : filters.industries,
      services: focusSupply ? ['поставка сырья', 'грузоперевозки', ...(filters.services ?? [])] : filters.services,
    }),
    [filters, query, focusSupply],
  )

  const { data, isLoading, isError, refetch } = useCompanies(effectiveFilters)

  return (
    <Box>
      <PageHeader
        title="Компании"
        subtitle="Найдите исполнителя или поставщика."
        actions={
          !isDesktop ? (
            <AppButton
              variant="outlined"
              startIcon={<AppIcon icon={FilterHorizontalIcon} size={18} />}
              onClick={() => setDrawerOpen(true)}
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
              alignSelf: 'flex-start',
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              position: 'sticky',
              top: { md: 'calc(56px + 16px)' },
              maxHeight: { md: 'calc(100dvh - 56px - 32px)' },
              overflow: 'auto',
            }}
          >
            <Typography variant="h3" sx={{ mb: 2 }}>
              Фильтры
            </Typography>
            <CompanyFiltersForm />
            <AppButton fullWidth variant="text" sx={{ mt: 2 }} onClick={reset}>
              Сбросить
            </AppButton>
          </Box>
        ) : null}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <SearchInput
            value={query}
            onChange={setQuery}
            label="Поиск компаний"
            placeholder="Digital Lab, React, Healthcare..."
          />
          <Box sx={{ mt: 3 }}>
            {isLoading ? <LoadingState rows={4} /> : null}
            {isError ? <ErrorState onRetry={() => void refetch()} /> : null}
            {!isLoading && !isError && (data?.length ?? 0) === 0 ? (
              <EmptyState
                title="Компании не найдены"
                description="Попробуйте изменить фильтры."
                actionLabel="Сбросить"
                onAction={reset}
              />
            ) : null}
            <Stack spacing={2}>
              {(data ?? []).map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </Stack>
          </Box>
        </Box>
      </Stack>

      <FilterDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onReset={reset}>
        <CompanyFiltersForm />
      </FilterDrawer>
    </Box>
  )
}
