import { Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import {
  useAdminNotifications,
  useMarkAdminNotificationRead,
  useMarkAllAdminNotificationsRead,
} from '@/features/admin'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { formatRelativeDate } from '@/shared/lib/format'
import {
  AppButton,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from '@/shared/ui'

const TYPE_LABELS: Record<string, string> = {
  NEW_ESCALATION: 'Эскалация',
  MANY_REPORTS: 'Жалобы',
  PLATFORM_SETTING_CHANGED: 'Настройки',
  FEATURE_FLAG_CHANGED: 'Feature flag',
}

export function AdminNotificationsPage() {
  const query = useAdminNotifications()
  const markRead = useMarkAdminNotificationRead()
  const markAll = useMarkAllAdminNotificationsRead()
  const showSuccess = useSnackbarStore((s) => s.showSuccess)

  const unread = (query.data ?? []).filter((n) => !n.read).length

  return (
    <Box>
      <PageHeader
        title="Системные уведомления"
        subtitle={unread > 0 ? `${unread} непрочитанных` : 'Все прочитаны'}
        actions={
          <AppButton
            variant="outlined"
            disabled={unread === 0 || markAll.isPending}
            onClick={() =>
              void markAll.mutateAsync().then(() => showSuccess('Все уведомления прочитаны'))
            }
            sx={{ minHeight: 44 }}
          >
            Прочитать все
          </AppButton>
        }
      />

      {query.isLoading ? <LoadingState variant="list" /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : null}
      {!query.isLoading && (query.data?.length ?? 0) === 0 ? (
        <EmptyState title="Уведомлений нет" />
      ) : null}

      <Stack spacing={1.5}>
        {(query.data ?? []).map((n) => {
          const content = (
            <CardContent>
              <Stack direction="row" spacing={1} sx={{ mb: 0.75 }} flexWrap="wrap" useFlexGap>
                <Chip size="small" label={TYPE_LABELS[n.type] ?? n.type} />
                {!n.read ? <Chip size="small" color="error" label="Новое" /> : null}
              </Stack>
              <Typography variant="h4">{n.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {n.body}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatRelativeDate(n.createdAt)}
              </Typography>
            </CardContent>
          )

          return (
            <Card
              key={n.id}
              variant="outlined"
              sx={{ bgcolor: n.read ? 'background.paper' : 'action.hover' }}
            >
              {n.href ? (
                <CardActionArea
                  component={RouterLink}
                  to={n.href}
                  onClick={() => {
                    if (!n.read) void markRead.mutateAsync(n.id)
                  }}
                >
                  {content}
                </CardActionArea>
              ) : (
                <Box
                  onClick={() => {
                    if (!n.read) void markRead.mutateAsync(n.id)
                  }}
                  sx={{ cursor: 'pointer' }}
                >
                  {content}
                </Box>
              )}
            </Card>
          )
        })}
      </Stack>
    </Box>
  )
}
