import { Link as RouterLink, useNavigate } from 'react-router-dom'
import Badge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { useNotificationsStore } from '@/features/notifications/model/notificationsStore'
import { SYSTEM_ROLES } from '@/entities/user'
import { BaseUiMenu } from '@/features/company-management/ui/BaseUiMenu'
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
  const role = useSessionStore((s) => s.role)
  const unread = useNotificationsStore((s) => s.unreadCount())
  const isModerator = role === SYSTEM_ROLES.MODERATOR
  const isPlatformAdmin = role === SYSTEM_ROLES.PLATFORM_ADMIN
  const home = isPlatformAdmin
    ? ROUTES.ADMIN
    : isModerator
      ? ROUTES.MODERATION
      : ROUTES.HOME
  const notificationsPath = isPlatformAdmin ? ROUTES.ADMIN_NOTIFICATIONS : ROUTES.NOTIFICATIONS

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
            to={home}
            variant="h3"
            color="primary"
            noWrap
            sx={{ textDecoration: 'none', display: 'block' }}
          >
            {title ?? APP_NAME}
          </Typography>
          {company && !isModerator && !isPlatformAdmin ? (
            <Typography variant="body2" color="text.secondary" noWrap>
              {company.shortName}
            </Typography>
          ) : null}
          {isModerator ? (
            <Typography variant="body2" color="text.secondary" noWrap>
              Модерация
            </Typography>
          ) : null}
          {isPlatformAdmin ? (
            <Typography variant="body2" color="text.secondary" noWrap>
              Platform Admin
            </Typography>
          ) : null}
        </Box>
        <IconButton
          component={RouterLink}
          to={notificationsPath}
          aria-label={`Уведомления${unread ? `, непрочитанных: ${unread}` : ''}`}
          color="inherit"
        >
          <Badge badgeContent={unread} color="secondary">
            <AppIcon icon={Notification03Icon} size={22} />
          </Badge>
        </IconButton>
        {user ? (
          isModerator || isPlatformAdmin ? (
            <BaseUiMenu
              aria-label={isPlatformAdmin ? 'Меню профиля администратора' : 'Меню профиля модератора'}
              trigger={
                <CompanyAvatar
                  name={`${user.firstName} ${user.lastName}`}
                  logoUrl={user.avatarUrl}
                  size={36}
                />
              }
              items={
                isPlatformAdmin
                  ? [
                      {
                        key: 'name',
                        label: `${user.firstName} ${user.lastName}`,
                        disabled: true,
                      },
                      { key: 'role', label: 'Platform Admin', disabled: true },
                      {
                        key: 'profile',
                        label: 'Профиль',
                        separatorBefore: true,
                        onClick: () => navigate(ROUTES.ADMIN_PROFILE),
                      },
                      {
                        key: 'notifications',
                        label: 'Уведомления',
                        onClick: () => navigate(ROUTES.ADMIN_NOTIFICATIONS),
                      },
                      {
                        key: 'settings',
                        label: 'Настройки интерфейса',
                        onClick: () => navigate(ROUTES.ADMIN_SETTINGS),
                      },
                      {
                        key: 'logout',
                        label: 'Выйти',
                        separatorBefore: true,
                        destructive: true,
                        onClick: () => navigate(ROUTES.HOME),
                      },
                    ]
                  : [
                      {
                        key: 'name',
                        label: `${user.firstName} ${user.lastName}`,
                        disabled: true,
                      },
                      { key: 'role', label: 'Модератор', disabled: true },
                      {
                        key: 'profile',
                        label: 'Мой профиль',
                        separatorBefore: true,
                        onClick: () => navigate(ROUTES.MODERATION_PROFILE),
                      },
                      {
                        key: 'notifications',
                        label: 'Уведомления',
                        onClick: () => navigate(ROUTES.NOTIFICATIONS),
                      },
                      {
                        key: 'logout',
                        label: 'Выйти',
                        separatorBefore: true,
                        destructive: true,
                        onClick: () => navigate(ROUTES.HOME),
                      },
                    ]
              }
            />
          ) : (
            <CompanyAvatar
              name={`${user.firstName} ${user.lastName}`}
              logoUrl={user.avatarUrl}
              size={36}
            />
          )
        ) : null}
      </Toolbar>
    </AppBar>
  )
}
