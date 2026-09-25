import { Link as RouterLink, useNavigate } from 'react-router-dom'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import {
  useModerationDashboard,
  useModeratorNotifications,
  useMarkNotificationRead,
} from '@/features/moderation/api/queries'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { ROUTES } from '@/shared/constants/routes'
import { AppButton, LoadingState, PageHeader } from '@/shared/ui'
import { formatRelativeDate } from '@/shared/lib/format'

export function ModerationProfilePage() {
  const user = useSessionStore((s) => s.user)
  const dashboard = useModerationDashboard()
  const notifications = useModeratorNotifications()
  const markRead = useMarkNotificationRead()
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const navigate = useNavigate()

  return (
    <Box>
      <PageHeader title="Профиль модератора" />
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ width: 56, height: 56 }}>
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </Avatar>
            <Box>
              <Typography variant="h3">
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Модератор платформы
              </Typography>
              <Typography variant="caption" color="success.main">
                В сети · mock work status
              </Typography>
            </Box>
          </Stack>
          {dashboard.data ? (
            <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
              Сегодня обработано: {dashboard.data.todayProcessed}
            </Typography>
          ) : (
            <LoadingState rows={1} />
          )}
        </CardContent>
      </Card>

      <Typography variant="h4" sx={{ mb: 1 }}>
        Уведомления
      </Typography>
      <Card variant="outlined" sx={{ mb: 2 }}>
        <List disablePadding>
          {(notifications.data ?? []).map((n, idx) => (
            <Box key={n.id}>
              {idx > 0 ? <Divider /> : null}
              <ListItemButton
                onClick={() => {
                  void markRead.mutateAsync(n.id)
                  navigate(n.href)
                }}
                sx={{ bgcolor: n.read ? undefined : 'action.hover' }}
              >
                <ListItemText
                  primary={n.title}
                  secondary={`${n.body} · ${formatRelativeDate(n.createdAt)}`}
                />
              </ListItemButton>
            </Box>
          ))}
        </List>
      </Card>

      <Stack spacing={1}>
        <AppButton component={RouterLink} to={ROUTES.NOTIFICATIONS} variant="outlined">
          Все уведомления
        </AppButton>
        <AppButton
          color="error"
          variant="text"
          onClick={() => {
        showSuccess('Вы вышли из mock-сессии')
            navigate(ROUTES.HOME)
          }}
        >
          Выйти (mock)
        </AppButton>
      </Stack>
    </Box>
  )
}
