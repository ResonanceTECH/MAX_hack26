import { useState } from 'react'
import { Link as RouterLink, useParams, useSearchParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Rating from '@mui/material/Rating'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { useCompany } from '@/entities/company/api/queries'
import { useMatch } from '@/entities/match/api/queries'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { useMyOpportunities } from '@/entities/opportunity/api/queries'
import { formatCurrency } from '@/shared/lib/format'
import {
  AppButton,
  AppIcon,
  CompanyAvatar,
  ErrorState,
  FavoriteButton,
  LoadingState,
  MatchExplanationFromMatch,
  ShareButton,
  Tag,
  VerifiedBadge,
} from '@/shared/ui'
import { Globe02Icon } from '@/shared/ui/icons'

const TABS = ['О компании', 'Услуги', 'Кейсы', 'Компетенции', 'Документы'] as const

export function CompanyDetailsPage() {
  const { id = '' } = useParams()
  const [searchParams] = useSearchParams()
  const fromOpportunity = searchParams.get('fromOpportunity') ?? ''
  const [tab, setTab] = useState(0)
  const [inviteOpen, setInviteOpen] = useState(false)
  const companyId = useSessionStore((s) => s.company?.id)
  const myRequests = useMyOpportunities(companyId)
  const { data, isLoading, isError, refetch } = useCompany(id)
  const matchQuery = useMatch(fromOpportunity, id)

  if (isLoading) return <LoadingState variant="page" />
  if (isError || !data) return <ErrorState onRetry={() => void refetch()} />

  const match = matchQuery.data
  const requests = myRequests.data ?? []

  const handleInvite = () => {
    if (requests.length > 1) {
      setInviteOpen(true)
      return
    }
    window.alert(
      requests[0]
        ? `Mock: ${data.shortName} приглашена в «${requests[0].title}»`
        : 'Mock: создайте запрос, чтобы пригласить компанию',
    )
  }

  return (
    <Box sx={{ pb: { xs: 10, md: 2 } }}>
      <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 3 }}>
        <CompanyAvatar name={data.shortName} logoUrl={data.logoUrl} size={72} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="h1" component="h1">
              {data.shortName}
            </Typography>
            <VerifiedBadge verified={data.verified} />
            <FavoriteButton type="company" targetId={data.id} />
            <ShareButton title={data.shortName} text={data.description} />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {data.name}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
            <Rating value={data.rating} precision={0.1} readOnly size="small" />
            <Typography variant="body2">
              {data.rating.toFixed(1)} · {data.reviewsCount} отзывов
            </Typography>
            <Typography variant="body2" color="text.secondary">
              · {data.region}
            </Typography>
          </Stack>
          {data.website ? (
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
              <AppIcon icon={Globe02Icon} size={16} aria-hidden />
              <Typography
                component="a"
                href={data.website}
                target="_blank"
                rel="noreferrer"
                variant="body2"
                color="secondary"
              >
                {data.website.replace(/^https?:\/\//, '')}
              </Typography>
            </Stack>
          ) : null}
        </Box>
      </Stack>

      {match ? (
        <Box sx={{ mb: 3 }}>
          <MatchExplanationFromMatch match={match} companyName={data.shortName} />
        </Box>
      ) : null}

      <Tabs
        value={tab}
        onChange={(_, v: number) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        {TABS.map((label) => (
          <Tab key={label} label={label} />
        ))}
      </Tabs>

      {tab === 0 ? (
        <Stack spacing={1.5}>
          <Typography variant="body1">{data.description}</Typography>
          {data.priceFrom != null ? (
            <Typography variant="body2" fontWeight={600}>
              Стоимость от {formatCurrency(data.priceFrom)}
            </Typography>
          ) : null}
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {data.industries.map((i) => (
              <Tag key={i} label={i} />
            ))}
          </Stack>
        </Stack>
      ) : null}
      {tab === 1 ? (
        <Stack spacing={1}>
          {data.services.map((s) => (
            <Typography key={s} variant="body1">
              · {s}
            </Typography>
          ))}
        </Stack>
      ) : null}
      {tab === 2 ? (
        <Typography variant="body1" color="text.secondary">
          В портфолио {data.casesCount} кейсов. Детальные кейсы появятся после подключения API.
        </Typography>
      ) : null}
      {tab === 3 ? (
        <Stack spacing={2}>
          <Box>
            <Typography variant="h4" sx={{ mb: 1 }}>
              Компетенции
            </Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {data.capabilities.map((c) => (
                <Tag key={c} label={c} />
              ))}
            </Stack>
          </Box>
          <Box>
            <Typography variant="h4" sx={{ mb: 1 }}>
              Технологии
            </Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {data.technologies.map((t) => (
                <Tag key={t} label={t} color="secondary" />
              ))}
            </Stack>
          </Box>
        </Stack>
      ) : null}
      {tab === 4 ? (
        <Typography variant="body1" color="text.secondary">
          ИНН {data.inn} · ОГРН {data.ogrn}. Документы — после интеграции с backend.
        </Typography>
      ) : null}

      <Box
        sx={{
          position: { xs: 'fixed', md: 'static' },
          left: 0,
          right: 0,
          bottom: { xs: 'calc(64px + env(safe-area-inset-bottom))', md: 'auto' },
          p: { xs: 2, md: 0 },
          mt: { md: 3 },
          bgcolor: { xs: 'background.paper', md: 'transparent' },
          borderTop: { xs: '1px solid', md: 'none' },
          borderColor: 'divider',
          zIndex: 10,
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <AppButton variant="contained" fullWidth onClick={handleInvite}>
            Пригласить в запрос
          </AppButton>
          <AppButton
            component={RouterLink}
            to={`/companies`}
            variant="outlined"
            fullWidth
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
          >
            К каталогу
          </AppButton>
        </Stack>
      </Box>

      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Выберите запрос</DialogTitle>
        <DialogContent>
          <List>
            {requests.map((r) => (
              <ListItemButton
                key={r.id}
                onClick={() => {
                  setInviteOpen(false)
                  window.alert(`Mock: ${data.shortName} приглашена в «${r.title}»`)
                }}
              >
                <ListItemText primary={r.title} secondary={r.status} />
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <AppButton onClick={() => setInviteOpen(false)}>Отмена</AppButton>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
