import { useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import {
  COMPANY_ACTIVITY_TYPE,
  type CompanyActivityType,
} from '@/entities/company-activity'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { CompanyActivityItem, useCompanyActivity } from '@/features/company-management'
import { EmptyState, ErrorState, LoadingState, PageHeader } from '@/shared/ui'

type FilterKey =
  | 'all'
  | 'profile'
  | 'team'
  | 'services'
  | 'cases'
  | 'documents'
  | 'settings'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'profile', label: 'Профиль' },
  { key: 'team', label: 'Команда' },
  { key: 'services', label: 'Услуги' },
  { key: 'cases', label: 'Кейсы' },
  { key: 'documents', label: 'Документы' },
  { key: 'settings', label: 'Настройки' },
]

const TYPE_GROUPS: Record<Exclude<FilterKey, 'all'>, CompanyActivityType[]> = {
  profile: [COMPANY_ACTIVITY_TYPE.PROFILE_UPDATED],
  team: [
    COMPANY_ACTIVITY_TYPE.MEMBER_INVITED,
    COMPANY_ACTIVITY_TYPE.MEMBER_ROLE_CHANGED,
    COMPANY_ACTIVITY_TYPE.MEMBER_SUSPENDED,
    COMPANY_ACTIVITY_TYPE.MEMBER_REMOVED,
  ],
  services: [
    COMPANY_ACTIVITY_TYPE.SERVICE_CREATED,
    COMPANY_ACTIVITY_TYPE.SERVICE_UPDATED,
    COMPANY_ACTIVITY_TYPE.SERVICE_ARCHIVED,
    COMPANY_ACTIVITY_TYPE.SERVICE_HIDDEN,
  ],
  cases: [
    COMPANY_ACTIVITY_TYPE.CASE_CREATED,
    COMPANY_ACTIVITY_TYPE.CASE_UPDATED,
    COMPANY_ACTIVITY_TYPE.CASE_ARCHIVED,
  ],
  documents: [
    COMPANY_ACTIVITY_TYPE.DOCUMENT_UPLOADED,
    COMPANY_ACTIVITY_TYPE.DOCUMENT_REMOVED,
    COMPANY_ACTIVITY_TYPE.DOCUMENT_REPLACED,
  ],
  settings: [COMPANY_ACTIVITY_TYPE.SETTINGS_UPDATED],
}

export function CompanyActivityPage() {
  const companyId = useSessionStore((s) => s.company?.id)
  const { data, isLoading, isError, refetch } = useCompanyActivity(companyId)
  const [filter, setFilter] = useState<FilterKey>('all')

  const filtered = useMemo(() => {
    const list = data ?? []
    if (filter === 'all') return list
    const types = TYPE_GROUPS[filter]
    return list.filter((e) => types.includes(e.type))
  }, [data, filter])

  return (
    <Box>
      <PageHeader title="История" subtitle="События управления компанией" />

      <Tabs
        value={FILTERS.findIndex((f) => f.key === filter)}
        onChange={(_, i: number) => setFilter(FILTERS[i]!.key)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        {FILTERS.map((f) => (
          <Tab key={f.key} label={f.label} />
        ))}
      </Tabs>

      {isLoading ? <LoadingState variant="list" /> : null}
      {isError ? <ErrorState onRetry={() => void refetch()} /> : null}
      {!isLoading && !isError && filtered.length === 0 ? (
        <EmptyState title="Нет событий" description="По выбранному фильтру записей нет." />
      ) : null}

      {filtered.length > 0 ? (
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            px: 2,
            bgcolor: 'background.paper',
          }}
        >
          <Stack>
            {filtered.map((event) => (
              <CompanyActivityItem key={event.id} event={event} />
            ))}
          </Stack>
        </Box>
      ) : null}

      {!isLoading && data && data.length > 0 ? (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Показано {filtered.length} из {data.length}
        </Typography>
      ) : null}
    </Box>
  )
}
