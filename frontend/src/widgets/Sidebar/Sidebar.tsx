import { NavLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import { APP_NAME } from '@/shared/config/app'
import { ROUTES } from '@/shared/constants/routes'
import { AppIcon } from '@/shared/ui'
import {
  AddCircleIcon,
  Briefcase02Icon,
  Building02Icon,
  FavouriteIcon,
  Home01Icon,
  Layers01Icon,
  Task01Icon,
} from '@/shared/ui/icons'

const NAV_ITEMS = [
  { to: ROUTES.HOME, label: 'Главная', icon: Home01Icon },
  { to: ROUTES.OPPORTUNITIES, label: 'Возможности', icon: Briefcase02Icon },
  { to: ROUTES.OPPORTUNITY_CREATE, label: 'Создать запрос', icon: AddCircleIcon, emphasize: true },
  { to: ROUTES.COMPANIES, label: 'Компании', icon: Layers01Icon },
  { to: ROUTES.MY, label: 'Мои процессы', icon: Task01Icon },
  { to: ROUTES.FAVORITES, label: 'Избранное', icon: FavouriteIcon },
  { to: ROUTES.PROFILE_COMPANY, label: 'Профиль компании', icon: Building02Icon },
] as const

export function Sidebar() {
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
          B2B-контрагенты
        </Typography>
      </Box>
      <Divider />
      <List sx={{ px: 1, py: 1.5, flex: 1 }}>
        {NAV_ITEMS.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              minHeight: 48,
              '&.active': {
                bgcolor: 'match.light',
                color: 'secondary.dark',
              },
              ...('emphasize' in item && item.emphasize
                ? { color: 'secondary.main', fontWeight: 700 }
                : {}),
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
              <AppIcon icon={item.icon} size={22} />
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontWeight: 'emphasize' in item && item.emphasize ? 700 : 500,
              }}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  )
}
