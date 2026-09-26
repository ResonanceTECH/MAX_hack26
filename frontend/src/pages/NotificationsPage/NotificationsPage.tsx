import { useCallback, useEffect, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useNotificationsStore } from '@/features/notifications/model/notificationsStore'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import {
  inviteApi,
  OPPORTUNITY_INVITE_STATUS,
  type CompanyInvite,
  type OpportunityInviteStatus,
} from '@/shared/api/inviteApi'
import {
  opportunityDetailsPath,
  opportunityProposePath,
} from '@/shared/constants/routes'
import { formatBudgetRange, formatRelativeDate } from '@/shared/lib/format'
import { AppButton, EmptyState, ErrorState, LoadingState, PageHeader } from '@/shared/ui'

const INVITE_STATUS_LABEL: Record<
  OpportunityInviteStatus,
  { label: string; color: 'warning' | 'success' | 'default' | 'error' }
> = {
  PENDING: { label: 'Ожидает ответа', color: 'warning' },
  ACCEPTED: { label: 'Принято', color: 'success' },
  DECLINED: { label: 'Отклонено', color: 'default' },
  EXPIRED: { label: 'Истекло', color: 'error' },
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const items = useNotificationsStore((s) => s.items)
  const isLoading = useNotificationsStore((s) => s.isLoading)
  const error = useNotificationsStore((s) => s.error)
  const fetchAll = useNotificationsStore((s) => s.fetchAll)
  const markAsRead = useNotificationsStore((s) => s.markAsRead)
  const markAllAsRead = useNotificationsStore((s) => s.markAllAsRead)
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)

  const [invites, setInvites] = useState<CompanyInvite[]>([])
  const [invitesLoading, setInvitesLoading] = useState(true)
  const [invitesError, setInvitesError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)

  const loadInvites = useCallback(async () => {
    setInvitesLoading(true)
    setInvitesError(null)
    try {
      const data = await inviteApi.getAll()
      setInvites(data)
    } catch (err) {
      setInvitesError(err instanceof Error ? err.message : 'Не удалось загрузить приглашения')
    } finally {
      setInvitesLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchAll()
  }, [fetchAll])

  // Initial invite load (avoid setState-in-effect lint on sync wrapper)
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const data = await inviteApi.getAll()
        if (!cancelled) {
          setInvites(data)
          setInvitesLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setInvitesError(err instanceof Error ? err.message : 'Не удалось загрузить приглашения')
          setInvitesLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleAccept = async (invite: CompanyInvite) => {
    setActingId(invite.id)
    try {
      const updated = await inviteApi.accept(invite.id)
      setInvites((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
      showSuccess('Приглашение принято — оформите отклик')
      void navigate(opportunityProposePath(invite.opportunityId))
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Не удалось принять')
    } finally {
      setActingId(null)
    }
  }

  const handleDecline = async (invite: CompanyInvite) => {
    setActingId(invite.id)
    try {
      const updated = await inviteApi.decline(invite.id)
      setInvites((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
      showSuccess('Приглашение отклонено')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Не удалось отклонить')
    } finally {
      setActingId(null)
    }
  }

  const pageLoading = isLoading || invitesLoading
  const empty = !pageLoading && !error && !invitesError && items.length === 0 && invites.length === 0

  return (
    <Box>
      <PageHeader
        title="Уведомления"
        actions={
          <AppButton variant="text" size="small" onClick={() => void markAllAsRead()}>
            Прочитать все
          </AppButton>
        }
      />
      {pageLoading ? <LoadingState rows={4} variant="list" /> : null}
      {error ? <ErrorState onRetry={() => void fetchAll()} /> : null}
      {invitesError ? <ErrorState onRetry={() => void loadInvites()} /> : null}
      {empty ? <EmptyState title="Нет уведомлений" /> : null}

      {!pageLoading && invites.length > 0 ? (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h3" sx={{ mb: 1.5 }}>
            Приглашения откликнуться
          </Typography>
          <Stack spacing={1.5}>
            {invites.map((invite) => {
              const statusMeta =
                INVITE_STATUS_LABEL[invite.status] ?? INVITE_STATUS_LABEL.PENDING
              const pending = invite.status === OPPORTUNITY_INVITE_STATUS.PENDING
              const budget = formatBudgetRange(
                invite.budgetMin ?? null,
                invite.budgetMax ?? null,
              )
              return (
                <Card key={`invite-${invite.id}`} sx={{ borderColor: 'secondary.light' }}>
                  <CardContent>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      spacing={1}
                    >
                      <Box>
                        <Typography variant="h4">
                          {invite.invitingCompanyName} приглашает вас откликнуться
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 600 }}>
                          {invite.opportunityTitle}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          Бюджет: {budget}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {formatRelativeDate(invite.createdAt)}
                        </Typography>
                      </Box>
                      <Chip size="small" color={statusMeta.color} label={statusMeta.label} />
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
                      <AppButton
                        component={RouterLink}
                        to={opportunityDetailsPath(invite.opportunityId)}
                        variant="outlined"
                        size="small"
                      >
                        Открыть
                      </AppButton>
                      {pending ? (
                        <>
                          <AppButton
                            variant="contained"
                            size="small"
                            loading={actingId === invite.id}
                            onClick={() => void handleAccept(invite)}
                          >
                            Принять
                          </AppButton>
                          <AppButton
                            variant="text"
                            size="small"
                            disabled={actingId === invite.id}
                            onClick={() => void handleDecline(invite)}
                          >
                            Отклонить
                          </AppButton>
                        </>
                      ) : null}
                      {invite.status === OPPORTUNITY_INVITE_STATUS.ACCEPTED ? (
                        <AppButton
                          component={RouterLink}
                          to={opportunityProposePath(invite.opportunityId)}
                          variant="contained"
                          size="small"
                        >
                          Оформить отклик
                        </AppButton>
                      ) : null}
                    </Stack>
                  </CardContent>
                </Card>
              )
            })}
          </Stack>
        </Box>
      ) : null}

      <Stack spacing={1.5}>
        {items.map((item) => (
          <Card
            key={item.id}
            sx={{
              bgcolor: item.read ? 'background.paper' : 'match.light',
              borderColor: item.read ? 'divider' : 'secondary.light',
            }}
          >
            <CardActionArea
              component={item.link ? RouterLink : 'div'}
              to={item.link}
              onClick={() => {
                if (!item.read) void markAsRead(item.id)
              }}
            >
              <CardContent>
                <Typography variant="h4">{item.title}</Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {item.message}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {formatRelativeDate(item.createdAt)}
                  {!item.read ? ' · новое' : ''}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Stack>
    </Box>
  )
}
