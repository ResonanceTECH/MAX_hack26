import { Link as RouterLink } from 'react-router-dom'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Rating from '@mui/material/Rating'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { companyDetailsPath, ROUTES } from '@/shared/constants/routes'
import { formatCurrency } from '@/shared/lib/format'
import { AppButton, LoadingState, PageHeader, Tag, VerifiedBadge } from '@/shared/ui'

export function CompanyProfilePage() {
  const user = useSessionStore((s) => s.user)
  const company = useSessionStore((s) => s.company)
  const isLoading = useSessionStore((s) => s.isLoading)

  if (isLoading || !company || !user) return <LoadingState variant="page" />

  return (
    <Box>
      <PageHeader title="Профиль компании" subtitle="Рабочий профиль в B2B Match" />
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
