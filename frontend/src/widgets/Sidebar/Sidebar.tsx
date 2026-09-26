import { NavLink, useNavigate } from 'react-router-dom'
import Badge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import { useAdminUnreadCount } from '@/features/admin/api/queries'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { SYSTEM_ROLES } from '@/entities/user'
import { Permission } from '@/features/permissions/model/permissions'
import { useCompanyPermission } from '@/features/permissions/hooks/useCompanyPermission'
import { APP_NAME } from '@/shared/config/app'
import { getNavConfig, type NavGroup, type NavItem } from '@/shared/config/navigation'
import { ROUTES } from '@/shared/constants/routes'
import { AppIcon, CompanyAvatar } from '@/shared/ui'
import { Notification03Icon, UserCircleIcon } from '@/shared/ui/icons'

function NavList({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  return (
    <List sx={{ px: 1, py: 0.5 }}>
      {items.map((item) => (
        <ListItemButton
          key={item.to}
          component={NavLink}
          to={item.to}
          onClick={onNavigate}
          sx={{
            borderRadius: 2,
            mb: 0.25,
            minHeight: 44,
            '&.active': {
              bgcolor: 'match.light',
              color: 'secondary.dark',
            },
            ...(item.emphasize ? { color: 'secondary.main', fontWeight: 700 } : {}),
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
            <AppIcon icon={item.icon} size={22} />
          </ListItemIcon>
          <ListItemText
            primary={item.label}
            primaryTypographyProps={{ fontWeight: item.emphasize ? 700 : 500, fontSize: 14 }}
          />
        </ListItemButton>
      ))}
    </List>
  )
}

function GroupedNav({ groups, onNavigate }: { groups: NavGroup[]; onNavigate?: () => void }) {
  return (
    <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
      {groups.map((group) => (
        <Box key={group.id} sx={{ mb: 1 }}>
          {group.label ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ px: 2.5, py: 0.75, display: 'block', fontWeight: 700, letterSpacing: 0.4 }}
            >
              {group.label}
            </Typography>
          ) : null}
          <NavList items={group.items} onNavigate={onNavigate} />
        </Box>
      ))}
    </Box>
  )
}

export function Sidebar() {
  const role = useSessionStore((s) => s.role)
  const user = useSessionStore((s) => s.user)
  const canCreateOpportunity = useCompanyPermission(Permission.CREATE_OPPORTUNITY)
  const config = getNavConfig(role)
  const navigate = useNavigate()
  const isPlatformAdmin = role === SYSTEM_ROLES.PLATFORM_ADMIN

  const desktopItems = config.desktop.filter(
    (item) => item.to !== ROUTES.OPPORTUNITY_CREATE || canCreateOpportunity,
  )
  const desktopGroups = config.desktopGroups?.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => item.to !== ROUTES.OPPORTUNITY_CREATE || canCreateOpportunity,
    ),
  }))
  const { unread: adminUnread } = useAdminUnreadCount()

  return (
    <Box
      component="nav"
      aria-label="Основная навигация"
      sx={{
        width: 260,
        flexShrink: 0,
        borderRight: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        pt: 'env(safe-area-inset-top)',
        position: 'sticky',
        top: 0,
        height: '100dvh',
      }}
    >
      <Box sx={{ px: 2.5, py: 2.5 }}>
        <Typography variant="h3" color="primary">
          {APP_NAME}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {role === SYSTEM_ROLES.MODERATOR
            ? 'Модерация'
            : isPlatformAdmin
              ? 'Platform Admin'
              : 'B2B-контрагенты'}
        </Typography>
      </Box>
      <Divider />
      {desktopGroups ? (
        <GroupedNav groups={desktopGroups} />
      ) : (
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <NavList items={desktopItems} />
        </Box>
      )}
      {isPlatformAdmin ? (
        <>
          <Divider />
          <List sx={{ px: 1, py: 1 }}>
            <ListItemButton
              component={NavLink}
              to={ROUTES.ADMIN_NOTIFICATIONS}
              sx={{ borderRadius: 2, minHeight: 44 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {adminUnread > 0 ? (
                  <Badge badgeContent={adminUnread} color="secondary" max={99}>
                    <AppIcon icon={Notification03Icon} size={22} />
                  </Badge>
                ) : (
                  <AppIcon icon={Notification03Icon} size={22} />
                )}
              </ListItemIcon>
              <ListItemText primary="Уведомления" />
            </ListItemButton>
            <ListItemButton
              onClick={() => void navigate(ROUTES.ADMIN_PROFILE)}
              sx={{ borderRadius: 2, minHeight: 48 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {user ? (
                  <CompanyAvatar
                    name={`${user.firstName} ${user.lastName}`}
                    logoUrl={user.avatarUrl}
                    size={28}
                  />
                ) : (
                  <AppIcon icon={UserCircleIcon} size={22} />
                )}
              </ListItemIcon>
              <ListItemText
                primary={user ? `${user.firstName} ${user.lastName}` : 'Профиль'}
                secondary="Platform Admin"
                primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}
                secondaryTypographyProps={{ fontSize: 12 }}
              />
            </ListItemButton>
          </List>
        </>
      ) : null}
    </Box>
  )
}
