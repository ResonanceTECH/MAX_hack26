import { Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import {
  useCompanyCases,
  useCompanyDocuments,
  useCompanyMembers,
  useCompanyServices,
} from '@/features/company-management/api/queries'
import { ROUTES } from '@/shared/constants/routes'
import { AppButton, LoadingState, PageHeader, VerifiedBadge } from '@/shared/ui'

export function CompanyAdminOverviewPage() {
  const company = useSessionStore((s) => s.company)
  const companyId = company?.id
  const members = useCompanyMembers(companyId)
  const services = useCompanyServices(companyId)
  const cases = useCompanyCases(companyId)
  const documents = useCompanyDocuments(companyId)

  if (!company) return <LoadingState variant="page" />

  const completion = Math.min(
    100,
    Math.round(
      ((company.description ? 20 : 0) +
        (company.website ? 15 : 0) +
        (company.industries.length ? 15 : 0) +
        (company.technologies.length ? 15 : 0) +
        ((services.data?.length ?? 0) > 0 ? 15 : 0) +
        ((cases.data?.length ?? 0) > 0 ? 10 : 0) +
        ((documents.data?.length ?? 0) > 0 ? 10 : 0)) ,
    ),
  )

  const stats = [
    { label: 'Сотрудники', value: members.data?.length ?? '—', to: ROUTES.PROFILE_COMPANY_TEAM },
    { label: 'Услуги', value: services.data?.length ?? '—', to: ROUTES.PROFILE_COMPANY_SERVICES },
    { label: 'Кейсы', value: cases.data?.length ?? '—', to: ROUTES.PROFILE_COMPANY_CASES },
    { label: 'Документы', value: documents.data?.length ?? '—', to: ROUTES.PROFILE_COMPANY_DOCUMENTS },
  ]

  return (
    <Box>
      <PageHeader title={company.shortName} subtitle="Управление компанией" />
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <VerifiedBadge verified={company.verified} />
          <Typography variant="body2" color="text.secondary">
            ИНН {company.inn} · {company.region}
          </Typography>
        </Stack>

        <Box>
          <Typography variant="body2" gutterBottom>
            Заполненность профиля: {completion}%
          </Typography>
          <LinearProgress variant="determinate" value={completion} aria-label={`Заполненность профиля ${completion} процентов`} />
        </Box>

        <Grid container spacing={1.5}>
          {stats.map((s) => (
            <Grid key={s.label} size={{ xs: 6, sm: 3 }}>
              <Card component={RouterLink} to={s.to} sx={{ textDecoration: 'none', height: '100%' }}>
                <CardContent>
                  <Typography variant="h2">{s.value}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {s.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Typography variant="h3">Быстрые действия</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap" useFlexGap>
          <AppButton component={RouterLink} to={ROUTES.PROFILE_COMPANY_TEAM} variant="contained">
            Добавить сотрудника
          </AppButton>
          <AppButton component={RouterLink} to={ROUTES.PROFILE_COMPANY_SERVICES} variant="outlined">
            Добавить услугу
          </AppButton>
          <AppButton component={RouterLink} to={ROUTES.PROFILE_COMPANY_CASES} variant="outlined">
            Добавить кейс
          </AppButton>
          <AppButton component={RouterLink} to={ROUTES.PROFILE_COMPANY_DOCUMENTS} variant="outlined">
            Загрузить документ
          </AppButton>
          <AppButton component={RouterLink} to={ROUTES.PROFILE_COMPANY_EDIT} variant="outlined">
            Редактировать профиль
          </AppButton>
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <AppButton component={RouterLink} to={ROUTES.PROFILE_COMPANY_PERMISSIONS} size="small">
            Права доступа
          </AppButton>
          <AppButton component={RouterLink} to={ROUTES.PROFILE_COMPANY_VERIFICATION} size="small">
            Верификация
          </AppButton>
          <AppButton component={RouterLink} to={ROUTES.PROFILE_COMPANY_SETTINGS} size="small">
            Настройки
          </AppButton>
        </Stack>
      </Stack>
    </Box>
  )
}
