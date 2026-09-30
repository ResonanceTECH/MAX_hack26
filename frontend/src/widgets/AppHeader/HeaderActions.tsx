import { Link as RouterLink, useNavigate } from 'react-router-dom'
import Badge from '@mui/material/Badge'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import { useAdminUnreadCount } from '@/features/admin/api/queries'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { BaseUiMenu } from '@/features/company-management/ui/BaseUiMenu'
import { useNotificationsStore } from '@/features/notifications/model/notificationsStore'
import { SYSTEM_ROLES } from '@/entities/user'
import { ROUTES } from '@/shared/constants/routes'
import { AppIcon, CompanyAvatar } from '@/shared/ui'
import { Notification03Icon } from '@/shared/ui/icons'

/** Bell + user avatar — shared by mobile AppHeader and desktop top chrome. */
export function HeaderActions() {
  const navigate = useNavigate()
  const user = useSessionStore((s) => s.user)
  const role = useSessionStore((s) => s.role)
  const storeUnread = useNotificationsStore((s) => s.unreadCount())
  const { unread: adminUnread } = useAdminUnreadCount()
  const isModerator = role === SYSTEM_ROLES.MODERATOR
  const isPlatformAdmin = role === SYSTEM_ROLES.PLATFORM_ADMIN
  const unread = isPlatformAdmin ? adminUnread : storeUnread
  const notificationsPath = isPlatformAdmin ? ROUTES.ADMIN_NOTIFICATIONS : ROUTES.NOTIFICATIONS

  return (
    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
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
            aria-label={
              isPlatformAdmin ? 'Меню профиля администратора' : 'Меню профиля модератора'
            }
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
    </Stack>
  )
}
