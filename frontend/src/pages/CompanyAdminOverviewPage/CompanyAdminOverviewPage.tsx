import { Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid2'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import {
  CompanyActivityItem,
  CompanyStatCard,
  ProfileCompletion,
  useCompanyActivity,
  useCompanyCases,
  useCompanyCompletion,
  useCompanyDocuments,
  useCompanyMembers,
  useCompanyServices,
} from '@/features/company-management'
import { COMPANY_DOCUMENT_STATUS } from '@/entities/company-document'
import { COMPANY_MEMBER_STATUS } from '@/entities/company-member'
import { COMPANY_SERVICE_STATUS } from '@/entities/company-service'
import { COMPANY_CASE_STATUS } from '@/entities/company-case'
import {
  companyDetailsPath,
  ROUTES,
} from '@/shared/constants/routes'
import {
  AppButton,
  CompanyAvatar,
  LoadingState,
  PageHeader,
  Tag,
  VerifiedBadge,
} from '@/shared/ui'

export function CompanyAdminOverviewPage() {
  const company = useSessionStore((s) => s.company)
  const companyId = company?.id
  const completionQ = useCompanyCompletion(companyId)
  const members = useCompanyMembers(companyId)
  const services = useCompanyServices(companyId)
  const cases = useCompanyCases(companyId)
  const documents = useCompanyDocuments(companyId)
  const activity = useCompanyActivity(companyId, { limit: 5 })

  if (!company) return <LoadingState variant="page" />

  const completion = completionQ.data
  const activeMembers =
    members.data?.filter((m) => m.status === COMPANY_MEMBER_STATUS.ACTIVE).length ?? 0
  const activeServices =
    services.data?.filter((s) => s.status === COMPANY_SERVICE_STATUS.ACTIVE).length ?? 0
  const publishedCases =
    cases.data?.filter((c) => c.status === COMPANY_CASE_STATUS.PUBLISHED).length ?? 0
  const pendingDocs =
    documents.data?.filter((d) => d.status === COMPANY_DOCUMENT_STATUS.PENDING).length ?? 0

  const stats = [
    {
      label: 'Сотрудники',
      value: activeMembers || members.data?.length || '—',
      to: ROUTES.PROFILE_COMPANY_TEAM,
    },
    {
      label: 'Услуги',
      value: activeServices || services.data?.length || '—',
      to: ROUTES.PROFILE_COMPANY_SERVICES,
    },
    {
      label: 'Кейсы',
      value: publishedCases || cases.data?.length || '—',
      to: ROUTES.PROFILE_COMPANY_CASES,
    },
    {
      label: 'Документы',
      value: documents.data?.length ?? '—',
      to: ROUTES.PROFILE_COMPANY_DOCUMENTS,
      hint: pendingDocs > 0 ? `${pendingDocs} на проверке` : undefined,
    },
  ]

  return (
    <Box>
      <PageHeader title="Обзор" subtitle="Управление компанией" />

      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ sm: 'flex-start' }}
        >
          <CompanyAvatar name={company.shortName} logoUrl={company.logoUrl} size={72} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="h2" component="h1">
                {company.shortName}
              </Typography>
              <VerifiedBadge verified={company.verified} />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {company.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {company.region}
              {company.inn ? ` · ИНН ${company.inn}` : ''}
            </Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
              {company.industries.map((i) => (
                <Tag key={i} label={i} />
              ))}
            </Stack>
            {company.website ? (
              <Typography
                component="a"
                href={company.website}
                target="_blank"
                rel="noreferrer"
                variant="body2"
                color="secondary"
                sx={{ display: 'inline-block', mt: 0.75 }}
              >
                {company.website.replace(/^https?:\/\//, '')}
              </Typography>
            ) : null}
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <AppButton
              component={RouterLink}
              to={ROUTES.PROFILE_COMPANY_EDIT}
              variant="contained"
            >
              Редактировать
            </AppButton>
            <AppButton
              component={RouterLink}
              to={companyDetailsPath(company.id)}
              variant="outlined"
            >
              Публичная страница
            </AppButton>
          </Stack>
        </Stack>

        {completion ? <ProfileCompletion completion={completion} /> : null}

        <Grid container spacing={1.5}>
          {stats.map((s) => (
            <Grid key={s.label} size={{ xs: 6, md: 3 }}>
              <CompanyStatCard label={s.label} value={s.value} to={s.to} hint={s.hint} />
            </Grid>
          ))}
        </Grid>

        <Box>
          <Typography variant="h3" sx={{ mb: 1.5 }}>
            Быстрые действия
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap" useFlexGap>
            <AppButton
              component={RouterLink}
              to={ROUTES.PROFILE_COMPANY_TEAM_INVITE}
              variant="contained"
            >
              Пригласить сотрудника
            </AppButton>
            <AppButton
              component={RouterLink}
              to={ROUTES.PROFILE_COMPANY_SERVICES_CREATE}
              variant="outlined"
            >
              Создать услугу
            </AppButton>
            <AppButton
              component={RouterLink}
              to={ROUTES.PROFILE_COMPANY_CASES_CREATE}
              variant="outlined"
            >
              Добавить кейс
            </AppButton>
            <AppButton
              component={RouterLink}
              to={ROUTES.PROFILE_COMPANY_DOCUMENTS_UPLOAD}
              variant="outlined"
            >
              Загрузить документ
            </AppButton>
            <AppButton
              component={RouterLink}
              to={ROUTES.PROFILE_COMPANY_EDIT}
              variant="outlined"
            >
              Редактировать профиль
            </AppButton>
          </Stack>
        </Box>

        {completion && completion.recommendations.length > 0 ? (
          <Box>
            <Typography variant="h3" sx={{ mb: 1 }}>
              Рекомендации
            </Typography>
            <Stack spacing={0.75} component="ul" sx={{ m: 0, pl: 2.5 }}>
              {completion.recommendations.slice(0, 5).map((r) => (
                <Typography key={r} component="li" variant="body2" color="text.secondary">
                  {r}
                </Typography>
              ))}
            </Stack>
          </Box>
        ) : null}

        <Box>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 1 }}
          >
            <Typography variant="h3">Недавняя активность</Typography>
            <AppButton
              component={RouterLink}
              to={ROUTES.PROFILE_COMPANY_ACTIVITY}
              size="small"
            >
              Вся история
            </AppButton>
          </Stack>
          {activity.data && activity.data.length > 0 ? (
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                px: 2,
                bgcolor: 'background.paper',
              }}
            >
              {activity.data.map((event) => (
                <CompanyActivityItem key={event.id} event={event} dense />
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Пока нет событий
            </Typography>
          )}
        </Box>
      </Stack>
    </Box>
  )
}
