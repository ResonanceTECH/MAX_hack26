import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import SwipeableDrawer from '@mui/material/SwipeableDrawer'
import Typography from '@mui/material/Typography'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { APP_NAME } from '@/shared/config/app'
import { getNavConfig, type NavItem } from '@/shared/config/navigation'
import { AppIcon } from '@/shared/ui'
import { Layers01Icon } from '@/shared/ui/icons'

function NavList({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  return (
    <List sx={{ px: 1, py: 1.5, flex: 1 }}>
      {items.map((item) => (
        <ListItemButton
          key={item.to}
          component={NavLink}
          to={item.to}
          onClick={onNavigate}
          sx={{
            borderRadius: 2,
            mb: 0.5,
            minHeight: 48,
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
            primaryTypographyProps={{ fontWeight: item.emphasize ? 700 : 500 }}
          />
        </ListItemButton>
      ))}
    </List>
  )
}

export function Sidebar() {
  const role = useSessionStore((s) => s.role)
  const config = getNavConfig(role)
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
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
            B2B-контрагенты
          </Typography>
        </Box>
        <Divider />
        <NavList items={config.desktop} />
      </Box>

      {config.mobileAsDrawer ? (
        <>
          <IconButton
            aria-label="Открыть меню"
            onClick={() => setDrawerOpen(true)}
            sx={{
              display: { xs: 'inline-flex', md: 'none' },
              position: 'fixed',
              left: 12,
              bottom: 'calc(16px + env(safe-area-inset-bottom))',
              zIndex: (t) => t.zIndex.fab,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              boxShadow: 2,
              '&:hover': { bgcolor: 'primary.dark' },
            }}
          >
            <AppIcon icon={Layers01Icon} size={22} />
          </IconButton>
          <SwipeableDrawer
            anchor="left"
            open={drawerOpen}
            onOpen={() => setDrawerOpen(true)}
            onClose={() => setDrawerOpen(false)}
          >
            <Box sx={{ width: 280, pt: 'env(safe-area-inset-top)' }}>
              <Box sx={{ px: 2.5, py: 2 }}>
                <Typography variant="h3">{APP_NAME}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Platform Admin
                </Typography>
              </Box>
              <Divider />
              <NavList items={config.desktop} onNavigate={() => setDrawerOpen(false)} />
            </Box>
          </SwipeableDrawer>
        </>
      ) : null}
    </>
  )
}
