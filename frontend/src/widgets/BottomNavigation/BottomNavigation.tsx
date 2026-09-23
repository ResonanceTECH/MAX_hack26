import { NavLink, useLocation } from 'react-router-dom'
import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import Paper from '@mui/material/Paper'
import { ROUTES } from '@/shared/constants/routes'
import { AppIcon } from '@/shared/ui'
import {
  AddCircleIcon,
  Briefcase02Icon,
  Building02Icon,
  Home01Icon,
  Task01Icon,
} from '@/shared/ui/icons'

function resolveValue(pathname: string): string {
  if (pathname.startsWith('/opportunities/create')) return ROUTES.OPPORTUNITY_CREATE
  if (pathname.startsWith('/opportunities')) return ROUTES.OPPORTUNITIES
  if (pathname.startsWith('/my')) return ROUTES.MY
  if (pathname.startsWith('/profile') || pathname.startsWith('/companies')) {
    return ROUTES.PROFILE_COMPANY
  }
  return ROUTES.HOME
}

export function AppBottomNavigation() {
  const location = useLocation()
  const value = resolveValue(location.pathname)

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
        <BottomNavigationAction
          label="Главная"
          value={ROUTES.HOME}
          icon={<AppIcon icon={Home01Icon} size={22} />}
          component={NavLink}
          to={ROUTES.HOME}
        />
        <BottomNavigationAction
          label="Возможности"
          value={ROUTES.OPPORTUNITIES}
          icon={<AppIcon icon={Briefcase02Icon} size={22} />}
          component={NavLink}
          to={ROUTES.OPPORTUNITIES}
        />
        <BottomNavigationAction
          label="Создать"
          value={ROUTES.OPPORTUNITY_CREATE}
          icon={<AppIcon icon={AddCircleIcon} size={28} color="#1F6F8B" />}
          component={NavLink}
          to={ROUTES.OPPORTUNITY_CREATE}
          sx={{
            '& .MuiBottomNavigationAction-label': {
              fontWeight: 700,
              color: 'secondary.main',
            },
          }}
        />
        <BottomNavigationAction
          label="Мои"
          value={ROUTES.MY}
          icon={<AppIcon icon={Task01Icon} size={22} />}
          component={NavLink}
          to={ROUTES.MY}
        />
        <BottomNavigationAction
          label="Компания"
          value={ROUTES.PROFILE_COMPANY}
          icon={<AppIcon icon={Building02Icon} size={22} />}
          component={NavLink}
          to={ROUTES.PROFILE_COMPANY}
        />
      </BottomNavigation>
    </Paper>
  )
}
