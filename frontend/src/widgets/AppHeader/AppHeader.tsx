import { Link as RouterLink, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { SYSTEM_ROLES } from '@/entities/user'
import { APP_NAME } from '@/shared/config/app'
import { ROUTES } from '@/shared/constants/routes'
import { AppIcon } from '@/shared/ui'
import { ArrowLeft01Icon } from '@/shared/ui/icons'
import { HeaderActions } from '@/widgets/AppHeader/HeaderActions'

export interface AppHeaderProps {
  showBack?: boolean
  title?: string
}

export function AppHeader({ showBack, title }: AppHeaderProps) {
  const navigate = useNavigate()
  const company = useSessionStore((s) => s.company)
  const role = useSessionStore((s) => s.role)
  const isModerator = role === SYSTEM_ROLES.MODERATOR
  const isPlatformAdmin = role === SYSTEM_ROLES.PLATFORM_ADMIN
  const home = isPlatformAdmin
    ? ROUTES.ADMIN
    : isModerator
      ? ROUTES.MODERATION
      : ROUTES.HOME

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
        <HeaderActions />
      </Toolbar>
    </AppBar>
  )
}
