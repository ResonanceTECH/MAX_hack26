import { useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
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
import type { PlatformCompanyStatus, VerificationStatus } from '@/shared/api/adminCompaniesApi'
import {
  useAdminCompanies,
  PLATFORM_COMPANY_STATUS_LABELS,
  VERIFICATION_STATUS_LABELS,
  PlatformStatusChip,
  VerificationStatusChip,
} from '@/features/admin'
import { BaseUiMenu } from '@/features/company-management/ui/BaseUiMenu'
import { adminCompanyPath, ROUTES } from '@/shared/constants/routes'
import {
  AppButton,
  AppSelect,
  CompanyAvatar,
  EmptyState,
  RegionAutocomplete,
  ErrorState,
  FilterDrawer,
  LoadingState,
  PageHeader,
  SearchInput,
} from '@/shared/ui'

const STATUSES: PlatformCompanyStatus[] = ['ACTIVE', 'SUSPENDED', 'BLOCKED', 'ARCHIVED']
const VERIFICATIONS: VerificationStatus[] = [
  'NOT_VERIFIED',
  'PENDING',
  'VERIFIED',
  'REJECTED',
  'REQUIRES_UPDATE',
]

export function AdminCompaniesPage() {
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<PlatformCompanyStatus | 'all'>('all')
  const [verification, setVerification] = useState<VerificationStatus | 'all'>('all')
  const [region, setRegion] = useState('')
  const [sort, setSort] = useState<'name' | 'created' | 'reports' | 'status'>('name')
  const [drawerOpen, setDrawerOpen] = useState(false)

  const filters = useMemo(
    () => ({
      query: query || undefined,
      status,
      verification,
      region: region || undefined,
      sort,
    }),
    [query, status, verification, region, sort],
  )

  const companiesQuery = useAdminCompanies(filters)
  const items = companiesQuery.data ?? []

  const filtersUi = (
    <>
      <AppSelect
        label="Статус"
        value={status}
        onChange={(v) => setStatus(v as PlatformCompanyStatus | 'all')}
        options={[
          { value: 'all', label: 'Все статусы' },
          ...STATUSES.map((s) => ({ value: s, label: PLATFORM_COMPANY_STATUS_LABELS[s] ?? s })),
        ]}
      />
      <AppSelect
        label="Верификация"
        value={verification}
        onChange={(v) => setVerification(v as VerificationStatus | 'all')}
        options={[
          { value: 'all', label: 'Все' },
          ...VERIFICATIONS.map((s) => ({
            value: s,
            label: VERIFICATION_STATUS_LABELS[s] ?? s,
          })),
        ]}
      />
      <RegionAutocomplete
        label="Регион"
        value={region}
        allowEmpty
        emptyLabel="Все"
        helperText={null}
        onChange={setRegion}
      />
      <AppSelect
        label="Сортировка"
        value={sort}
        onChange={(v) => setSort(v as typeof sort)}
        options={[
          { value: 'name', label: 'По названию' },
          { value: 'created', label: 'По дате' },
          { value: 'reports', label: 'По жалобам' },
          { value: 'status', label: 'По статусу' },
        ]}
      />
    </>
  )

  return (
    <Box>
      <PageHeader
        title="Компании платформы"
        subtitle="Платформенный статус и верификация"
        actions={
          <AppButton component={RouterLink} to={ROUTES.ADMIN} variant="text" sx={{ minHeight: 44 }}>
            К сводке
          </AppButton>
        }
      />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        sx={{ mb: 2 }}
        alignItems={{ md: 'center' }}
      >
        <Box sx={{ flex: 1 }}>
          <SearchInput value={query} onChange={setQuery} placeholder="Название или ИНН" />
        </Box>
        {isDesktop ? (
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            {filtersUi}
          </Stack>
        ) : (
          <AppButton variant="outlined" onClick={() => setDrawerOpen(true)} sx={{ minHeight: 44 }}>
            Фильтры
          </AppButton>
        )}
      </Stack>

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onReset={() => {
          setStatus('all')
          setVerification('all')
          setRegion('')
          setSort('name')
        }}
      >
        {filtersUi}
      </FilterDrawer>

      {companiesQuery.isLoading ? <LoadingState rows={4} /> : null}
      {companiesQuery.isError ? (
        <ErrorState onRetry={() => void companiesQuery.refetch()} />
      ) : null}
      {!companiesQuery.isLoading && !companiesQuery.isError && items.length === 0 ? (
        <EmptyState title="Компании не найдены" />
      ) : null}

      {!isDesktop ? (
        <Stack spacing={1.5}>
          {items.map((company) => (
            <Card key={company.id} variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <CompanyAvatar name={company.name} logoUrl={company.logoUrl} size={44} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} sx={{ mb: 0.5 }} flexWrap="wrap" useFlexGap>
                      <PlatformStatusChip status={company.platformStatus} />
                      <VerificationStatusChip status={company.verificationStatus} />
                    </Stack>
                    <Typography
                      variant="h4"
                      component={RouterLink}
                      to={adminCompanyPath(company.id)}
                      sx={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      {company.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {company.region} · ИНН {company.inn} · {company.employeesCount} сотр.
                    </Typography>
                  </Box>
                  <BaseUiMenu
                    aria-label={`Действия: ${company.name}`}
                    items={[
                      {
                        key: 'open',
                        label: 'Открыть',
                        onClick: () => navigate(adminCompanyPath(company.id)),
                      },
                    ]}
                  />
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      ) : items.length > 0 ? (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Компания</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Верификация</TableCell>
              <TableCell>Регион</TableCell>
              <TableCell>Жалобы</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((company) => (
              <TableRow key={company.id} hover>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CompanyAvatar name={company.name} logoUrl={company.logoUrl} size={32} />
                    <Box>
                      <Typography
                        component={RouterLink}
                        to={adminCompanyPath(company.id)}
                        variant="body2"
                        fontWeight={600}
                        sx={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        {company.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        ИНН {company.inn}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <PlatformStatusChip status={company.platformStatus} />
                </TableCell>
                <TableCell>
                  <VerificationStatusChip status={company.verificationStatus} />
                </TableCell>
                <TableCell>{company.region}</TableCell>
                <TableCell>{company.reportsCount}</TableCell>
                <TableCell align="right">
                  <BaseUiMenu
                    items={[
                      {
                        key: 'open',
                        label: 'Открыть',
                        onClick: () => navigate(adminCompanyPath(company.id)),
                      },
                    ]}
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
