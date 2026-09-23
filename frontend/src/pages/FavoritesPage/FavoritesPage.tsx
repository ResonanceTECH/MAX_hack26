import { useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { useFavorites } from '@/features/favorites/api/queries'
import { getCompanyById, getOpportunityById } from '@/shared/mocks'
import { EmptyState, ErrorState, LoadingState, PageHeader } from '@/shared/ui'
import { CompanyCard } from '@/widgets/CompanyCard/CompanyCard'
import { OpportunityCard } from '@/widgets/OpportunityCard/OpportunityCard'

const TABS = ['Компании', 'Возможности'] as const

export function FavoritesPage() {
  const [tab, setTab] = useState(0)
  const { data, isLoading, isError, refetch } = useFavorites()

  const companies = useMemo(() => {
    const items = (data ?? []).filter((f) => f.type === 'company')
    return items
      .map((f) => getCompanyById(f.targetId))
      .filter((c): c is NonNullable<typeof c> => c != null)
  }, [data])

  const opportunities = useMemo(() => {
    const items = (data ?? []).filter((f) => f.type === 'opportunity')
    return items
      .map((f) => getOpportunityById(f.targetId))
      .filter((o): o is NonNullable<typeof o> => o != null)
  }, [data])

  return (
    <Box>
      <PageHeader title="Избранное" subtitle="Сохранённые компании и возможности" />

      <Tabs
        value={tab}
        onChange={(_, v: number) => setTab(v)}
        variant="fullWidth"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        {TABS.map((label) => (
          <Tab key={label} label={label} />
        ))}
      </Tabs>

      {isLoading ? <LoadingState variant="page" /> : null}
      {isError ? <ErrorState onRetry={() => void refetch()} /> : null}

      {!isLoading && !isError && tab === 0 ? (
        companies.length === 0 ? (
          <EmptyState
            title="Нет сохранённых компаний"
            description="Нажмите на закладку у карточки компании, чтобы добавить её в избранное."
          />
        ) : (
          <Stack spacing={2}>
            {companies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </Stack>
        )
      ) : null}

      {!isLoading && !isError && tab === 1 ? (
        opportunities.length === 0 ? (
          <EmptyState
            title="Нет сохранённых возможностей"
            description="Сохраняйте интересные запросы, чтобы вернуться к ним позже."
          />
        ) : (
          <Stack spacing={2}>
            {opportunities.map((opportunity) => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </Stack>
        )
      ) : null}
    </Box>
  )
}
