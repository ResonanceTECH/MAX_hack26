import { Link as RouterLink, useNavigate } from 'react-router-dom'
import Badge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { useNotificationsStore } from '@/features/notifications/model/notificationsStore'
import { APP_NAME } from '@/shared/config/app'
import { ROUTES } from '@/shared/constants/routes'
import { AppIcon, CompanyAvatar } from '@/shared/ui'
import { ArrowLeft01Icon, Notification03Icon } from '@/shared/ui/icons'

export interface AppHeaderProps {
  showBack?: boolean
  title?: string
}

export function AppHeader({ showBack, title }: AppHeaderProps) {
  const navigate = useNavigate()
  const company = useSessionStore((s) => s.company)
  const user = useSessionStore((s) => s.user)
  const unread = useNotificationsStore((s) => s.unreadCount())

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        pt: 'env(safe-area-inset-top)',
      }}
    >
      <Toolbar sx={{ gap: 1, minHeight: 56 }}>
        {showBack ? (
          <IconButton aria-label="Назад" onClick={() => navigate(-1)} edge="start">
            <AppIcon icon={ArrowLeft01Icon} size={22} />
          </IconButton>
        ) : null}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            component={RouterLink}
            to={ROUTES.HOME}
            variant="h3"
            color="primary"
            noWrap
            sx={{ textDecoration: 'none', display: 'block' }}
          >
            {title ?? APP_NAME}
          </Typography>
          {company ? (
            <Typography variant="body2" color="text.secondary" noWrap>
              {company.shortName}
            </Typography>
          ) : null}
        </Box>
        {user ? (
          <CompanyAvatar
            name={`${user.firstName} ${user.lastName}`}
            logoUrl={user.avatarUrl}
            size={36}
          />
        ) : null}
        <IconButton
          component={RouterLink}
          to={ROUTES.NOTIFICATIONS}
          aria-label={`Уведомления${unread ? `, непрочитанных: ${unread}` : ''}`}
          color="inherit"
        >
          <Badge badgeContent={unread} color="secondary">
            <AppIcon icon={Notification03Icon} size={22} />
          </Badge>
        </IconButton>
      </Toolbar>
    </AppBar>
  )
}
