import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import Badge from '@mui/material/Badge'
import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Paper from '@mui/material/Paper'
import SwipeableDrawer from '@mui/material/SwipeableDrawer'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { useModerationDashboard } from '@/features/moderation/api/queries'
import { SYSTEM_ROLES } from '@/entities/user'
import { getNavConfig } from '@/shared/config/navigation'
import { AppIcon } from '@/shared/ui'

function resolveValue(pathname: string, items: { to: string; matchPrefix?: string; isMore?: boolean }[]): string {
  for (const item of items) {
    if (item.isMore) continue
    if (item.matchPrefix && pathname.startsWith(item.matchPrefix)) return item.to
    if (item.to !== '/' && pathname.startsWith(item.to)) return item.to
  }
  if (pathname === '/') return items[0]?.to ?? '/'
  return items.find((i) => i.to === pathname)?.to ?? items[0]?.to ?? '/'
}

export function AppBottomNavigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const role = useSessionStore((s) => s.role)
  const config = getNavConfig(role)
  const dashboard = useModerationDashboard()
  const isModerator = role === SYSTEM_ROLES.MODERATOR
  const [moreOpen, setMoreOpen] = useState(false)

  const value = resolveValue(location.pathname, config.mobile)
  const badges = {
    pendingQueue: isModerator ? (dashboard.data?.pendingTotal ?? 0) : 0,
    openReports: isModerator ? (dashboard.data?.openReports ?? 0) : 0,
    adminNotifications: 0,
  }

  const moreMatched = (config.mobileMore ?? []).some(
    (item) =>
      location.pathname === item.to ||
      (item.matchPrefix && location.pathname.startsWith(item.matchPrefix)),
  )

  return (
    <>
      <Paper
        elevation={3}
        sx={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: (t) => t.zIndex.appBar,
          display: { xs: 'block', md: 'none' },
          pb: 'env(safe-area-inset-bottom)',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <BottomNavigation value={moreMatched ? '#more' : value} showLabels>
          {config.mobile.map((item) => {
            const count = item.badgeKey ? badges[item.badgeKey] : 0
            const icon = (
              <AppIcon
                icon={item.icon}
                size={item.emphasize ? 28 : 22}
                color={item.emphasize ? '#1F6F8B' : undefined}
              />
            )
            if (item.isMore) {
              return (
                <BottomNavigationAction
                  key="more"
                  label={item.label}
                  value="#more"
                  icon={icon}
                  onClick={() => setMoreOpen(true)}
                />
              )
            }
            return (
              <BottomNavigationAction
                key={item.to}
                label={item.label}
                value={item.to}
                icon={
                  count > 0 ? (
                    <Badge badgeContent={count} color="secondary" max={99}>
                      {icon}
                    </Badge>
                  ) : (
                    icon
                  )
                }
                component={NavLink}
                to={item.to}
                sx={
                  item.emphasize
                    ? {
                        '& .MuiBottomNavigationAction-label': {
                          fontWeight: 700,
                          color: 'secondary.main',
                        },
                      }
                    : undefined
                }
              />
            )
          })}
        </BottomNavigation>
      </Paper>

      {config.mobileMore ? (
        <SwipeableDrawer
          anchor="bottom"
          open={moreOpen}
          onOpen={() => setMoreOpen(true)}
          onClose={() => setMoreOpen(false)}
          disableDiscovery
        >
          <Box sx={{ pb: 'env(safe-area-inset-bottom)' }}>
            <Box sx={{ px: 2.5, pt: 2, pb: 1 }}>
              <Typography variant="h4">Ещё</Typography>
              <Typography variant="body2" color="text.secondary">
                Platform Admin
              </Typography>
            </Box>
            <Divider />
            <List sx={{ px: 1, py: 1 }}>
              {config.mobileMore.map((item) => (
                <ListItemButton
                  key={item.to}
                  sx={{ borderRadius: 2, minHeight: 48, mb: 0.5 }}
                  onClick={() => {
                    setMoreOpen(false)
                    void navigate(item.to)
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <AppIcon icon={item.icon} size={22} />
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              ))}
            </List>
          </Box>
        </SwipeableDrawer>
      ) : null}
    </>
  )
}
