import { NavLink, useLocation } from 'react-router-dom'
import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import Paper from '@mui/material/Paper'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { getNavConfig } from '@/shared/config/navigation'
import { AppIcon } from '@/shared/ui'

function resolveValue(pathname: string, items: { to: string; matchPrefix?: string }[]): string {
  for (const item of items) {
    if (item.matchPrefix && pathname.startsWith(item.matchPrefix)) return item.to
    if (item.to !== '/' && pathname.startsWith(item.to)) return item.to
  }
  if (pathname === '/') return items[0]?.to ?? '/'
  return items.find((i) => i.to === pathname)?.to ?? items[0]?.to ?? '/'
}

export function AppBottomNavigation() {
  const location = useLocation()
  const role = useSessionStore((s) => s.role)
  const config = getNavConfig(role)

  if (config.mobileAsDrawer) return null

  const value = resolveValue(location.pathname, config.mobile)

  return (
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
      <BottomNavigation value={value} showLabels>
        {config.mobile.map((item) => (
          <BottomNavigationAction
            key={item.to}
            label={item.label}
            value={item.to}
            icon={
              <AppIcon
                icon={item.icon}
                size={item.emphasize ? 28 : 22}
                color={item.emphasize ? '#1F6F8B' : undefined}
              />
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
        ))}
      </BottomNavigation>
    </Paper>
  )
}
