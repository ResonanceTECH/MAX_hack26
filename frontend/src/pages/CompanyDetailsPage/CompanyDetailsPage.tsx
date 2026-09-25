import { useState } from 'react'
import { Link as RouterLink, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
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
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { casesApi } from '@/shared/api/casesApi'
import { documentsApi } from '@/shared/api/documentsApi'
import { inviteApi } from '@/shared/api/inviteApi'
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
  const [inviteMessage, setInviteMessage] = useState<string | null>(null)
  const companyId = useSessionStore((s) => s.company?.id)
  const myRequests = useMyOpportunities(companyId)
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const { data, isLoading, isError, refetch } = useCompany(id)
  const matchQuery = useMatch(fromOpportunity, id)
  const casesQuery = useQuery({
    queryKey: ['company-cases', id],
    queryFn: () => casesApi.list(id),
    enabled: Boolean(id),
  })
  const docsQuery = useQuery({
    queryKey: ['company-documents', id],
    queryFn: () => documentsApi.list(id),
    enabled: Boolean(id),
  })

  if (isLoading) return <LoadingState variant="page" />
  if (isError || !data) return <ErrorState onRetry={() => void refetch()} />

  const match = matchQuery.data
  const requests = (myRequests.data ?? []).filter((r) =>
    ['published', 'collecting_proposals', 'shortlisting', 'draft'].includes(r.status),
  )

  const inviteTo = async (opportunityId: string, title: string) => {
    await inviteApi.invite({
      opportunityId,
      opportunityTitle: title,
      companyId: data.id,
      companyName: data.shortName,
    })
    const message = `${data.shortName} приглашена в «${title}»`
    setInviteMessage(message)
    showSuccess(message)
    setInviteOpen(false)
  }

  const handleInvite = () => {
    if (requests.length === 0) {
      setInviteMessage('Создайте запрос, чтобы пригласить компанию')
      return
    }
    if (requests.length === 1 && requests[0]) {
      void inviteTo(requests[0].id, requests[0].title)
      return
    }
    setInviteOpen(true)
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

      {inviteMessage ? (
        <Typography variant="body1" color="secondary" sx={{ mb: 2 }} role="status">
          {inviteMessage}
        </Typography>
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
        <Stack spacing={2}>
          {(casesQuery.data ?? []).length === 0 ? (
            <Typography variant="body1" color="text.secondary">
              В портфолио {data.casesCount} кейсов. Подробные описания появятся позже.
            </Typography>
          ) : (
            (casesQuery.data ?? []).map((item) => (
              <Box
                key={item.id}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="h3">{item.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {item.industry}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {item.description}
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  Результат: {item.result}
                </Typography>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                  {item.technologies.map((t) => (
                    <Tag key={t} label={t} color="secondary" />
                  ))}
                </Stack>
              </Box>
            ))
          )}
        </Stack>
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
        <Stack spacing={1.5}>
          {(docsQuery.data ?? []).map((doc) => (
            <Box
              key={doc.id}
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="body1" fontWeight={600}>
                {doc.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {doc.type} · {doc.fileName} · {doc.status}
              </Typography>
            </Box>
          ))}
        </Stack>
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
                  void inviteTo(r.id, r.title)
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
