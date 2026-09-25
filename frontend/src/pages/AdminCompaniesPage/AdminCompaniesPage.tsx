import { useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { PlatformCompanyStatus } from '@/shared/api/adminCompaniesApi'
import { useAdminCompanies } from '@/features/admin/api/queries'
import {
  PLATFORM_COMPANY_STATUS_LABELS,
  VERIFICATION_STATUS_LABELS,
} from '@/features/moderation/model/labels'
import { REGIONS } from '@/shared/constants/labels'
import { adminCompanyPath, ROUTES } from '@/shared/constants/routes'
import {
  AppButton,
  AppSelect,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  SearchInput,
} from '@/shared/ui'

export function AdminCompaniesPage() {
  const [query, setQuery] = useState('')
  const [verified, setVerified] = useState<'all' | 'true' | 'false'>('all')
  const [status, setStatus] = useState<PlatformCompanyStatus | 'all'>('all')
  const [region, setRegion] = useState('')

  const filters = useMemo(
    () => ({
      query: query || undefined,
      verified: verified === 'all' ? ('all' as const) : verified === 'true',
      status,
      region: region || undefined,
    }),
    [query, verified, status, region],
  )

  const companiesQuery = useAdminCompanies(filters)
  const items = companiesQuery.data ?? []

  return (
    <Box>
      <PageHeader
        title="Компании платформы"
        subtitle="Платформенный статус и верификация"
        actions={
          <AppButton component={RouterLink} to={ROUTES.ADMIN} variant="text">
            К сводке
          </AppButton>
        }
      />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <SearchInput value={query} onChange={setQuery} placeholder="Название или ИНН" />
        </Box>
        <Box sx={{ minWidth: 180 }}>
          <AppSelect
            label="Верификация"
            value={verified}
            onChange={(v) => setVerified(v as 'all' | 'true' | 'false')}
            options={[
              { value: 'all', label: 'Все' },
              { value: 'true', label: 'Верифицированы' },
              { value: 'false', label: 'Не верифицированы' },
            ]}
          />
        </Box>
        <Box sx={{ minWidth: 200 }}>
          <AppSelect
            label="Статус"
            value={status}
            onChange={(v) => setStatus(v as PlatformCompanyStatus | 'all')}
            options={[
              { value: 'all', label: 'Все статусы' },
              { value: 'active', label: 'Активна' },
              { value: 'pending_moderation', label: 'На модерации' },
              { value: 'blocked', label: 'Заблокирована' },
              { value: 'suspended', label: 'Приостановлена' },
            ]}
          />
        </Box>
        <Box sx={{ minWidth: 180 }}>
          <AppSelect
            label="Регион"
            value={region}
            onChange={setRegion}
            options={[{ value: '', label: 'Все' }, ...REGIONS.map((r) => ({ value: r, label: r }))]}
          />
        </Box>
      </Stack>

      {companiesQuery.isLoading ? <LoadingState rows={4} /> : null}
      {companiesQuery.isError ? (
        <ErrorState onRetry={() => void companiesQuery.refetch()} />
      ) : null}
      {!companiesQuery.isLoading && !companiesQuery.isError && items.length === 0 ? (
        <EmptyState title="Компании не найдены" />
      ) : null}

      <Stack spacing={1.5}>
        {items.map((company) => (
          <Card key={company.id} variant="outlined">
            <CardContent>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                spacing={1.5}
                alignItems={{ sm: 'center' }}
              >
                <Box>
                  <Stack direction="row" spacing={1} sx={{ mb: 0.5 }} flexWrap="wrap" useFlexGap>
                    <Chip
                      size="small"
                      label={PLATFORM_COMPANY_STATUS_LABELS[company.platformStatus]}
                    />
                    <Chip
                      size="small"
                      label={VERIFICATION_STATUS_LABELS[company.verificationStatus]}
                      color={company.verificationStatus === 'verified' ? 'success' : 'default'}
                    />
                  </Stack>
                  <Typography variant="h4">{company.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {company.region} · ИНН {company.inn} · сотрудников {company.employeesCount}
                  </Typography>
                </Box>
                <AppButton
                  component={RouterLink}
                  to={adminCompanyPath(company.id)}
                  variant="contained"
                  size="small"
                >
                  Открыть
                </AppButton>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  )
}
