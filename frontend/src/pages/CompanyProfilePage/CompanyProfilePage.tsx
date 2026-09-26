import { Link as RouterLink } from 'react-router-dom'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Rating from '@mui/material/Rating'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { Permission } from '@/features/permissions'
import { useCompanyPermissions } from '@/features/permissions/hooks/useCompanyPermission'
import { NeedsChangesList } from '@/features/moderation/ui/NeedsChangesBanner'
import { companyDetailsPath, ROUTES } from '@/shared/constants/routes'
import { formatCurrency } from '@/shared/lib/format'
import { AppButton, EmptyState, LoadingState, PageHeader, Tag, VerifiedBadge } from '@/shared/ui'

const MANAGEMENT_LINKS = [
  { to: ROUTES.COMPANY_ADMIN, label: 'Панель управления' },
  { to: ROUTES.COMPANY_EDIT, label: 'Редактировать' },
  { to: ROUTES.COMPANY_TEAM, label: 'Команда' },
  { to: ROUTES.COMPANY_SERVICES, label: 'Услуги' },
  { to: ROUTES.COMPANY_CASES, label: 'Кейсы' },
  { to: ROUTES.COMPANY_DOCUMENTS, label: 'Документы' },
  { to: ROUTES.COMPANY_VERIFICATION, label: 'Верификация' },
] as const

export function CompanyProfilePage() {
  const user = useSessionStore((s) => s.user)
  const company = useSessionStore((s) => s.company)
  const isLoading = useSessionStore((s) => s.isLoading)
  const { has } = useCompanyPermissions()
  const canManageCompany =
    has(Permission.EDIT_COMPANY) || has(Permission.MANAGE_COMPANY_MEMBERS)

  if (isLoading) return <LoadingState variant="page" />

  if (!user) return <LoadingState variant="page" />

  if (!company) {
    return (
      <Box>
        <PageHeader title="Профиль компании" subtitle="Компания не привязана к аккаунту" />
        <EmptyState
          title="Нет компании"
          description="Для вашей роли компания не назначена. Marketplace и управление компанией недоступны."
        />
      </Box>
    )
  }

  return (
    <Box>
      <PageHeader title="Профиль компании" subtitle="Рабочий профиль в B2B Match" />
      <NeedsChangesList />
      <Stack spacing={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
            {company.shortName.slice(0, 1)}
          </Avatar>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h2">{company.shortName}</Typography>
              <VerifiedBadge verified={company.verified} />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {user.firstName} {user.lastName} · {user.role}
            </Typography>
          </Box>
        </Stack>

        <Typography variant="body1">{company.description}</Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <Rating value={company.rating} readOnly size="small" precision={0.1} />
          <Typography variant="body2">
            {company.rating.toFixed(1)} · {company.region}
          </Typography>
        </Stack>

        {company.priceFrom != null ? (
          <Typography variant="body2" fontWeight={600}>
            от {formatCurrency(company.priceFrom)}
          </Typography>
        ) : null}

        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          {company.services.map((s) => (
            <Tag key={s} label={s} />
          ))}
        </Stack>
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          {company.technologies.map((t) => (
            <Tag key={t} label={t} color="secondary" />
          ))}
        </Stack>

        {canManageCompany ? (
          <Box>
            <Typography variant="h3" sx={{ mb: 1 }}>
              Управление
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {MANAGEMENT_LINKS.map((link) => (
                <AppButton
                  key={link.to}
                  component={RouterLink}
                  to={link.to}
                  variant="outlined"
                  size="small"
                >
                  {link.label}
                </AppButton>
              ))}
            </Stack>
          </Box>
        ) : null}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <AppButton component={RouterLink} to={companyDetailsPath(company.id)} variant="contained">
            Публичная карточка
          </AppButton>
          <AppButton component={RouterLink} to={ROUTES.COMPANIES} variant="outlined">
            Каталог компаний
          </AppButton>
        </Stack>
      </Stack>
    </Box>
  )
}
