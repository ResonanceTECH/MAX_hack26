import type { ReactNode } from 'react'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { Menu } from '@base-ui/react/menu'
import type { IconSvgElement } from '@hugeicons/react'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import ButtonBase from '@mui/material/ButtonBase'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { Permission } from '@/features/permissions/model/permissions'
import { usePermissions } from '@/features/permissions/hooks/usePermission'
import { ROUTES } from '@/shared/constants/routes'
import { AppIcon } from '@/shared/ui'
import {
  Activity01Icon,
  Briefcase02Icon,
  Building02Icon,
  CheckmarkBadge01Icon,
  DashboardSquare01Icon,
  Edit02Icon,
  File02Icon,
  Key01Icon,
  Layers01Icon,
  Settings01Icon,
  UserGroupIcon,
} from '@/shared/ui/icons'

export interface CompanyNavItem {
  to: string
  label: string
  shortLabel?: string
  icon: IconSvgElement
  permission?: Permission | Permission[]
  /** Match exact path or prefix for nested routes */
  match?: 'exact' | 'prefix'
}

export const COMPANY_ADMIN_NAV: CompanyNavItem[] = [
  {
    to: ROUTES.PROFILE_COMPANY,
    label: 'Обзор',
    icon: DashboardSquare01Icon,
    match: 'exact',
  },
  {
    to: ROUTES.PROFILE_COMPANY_EDIT,
    label: 'Профиль',
    icon: Edit02Icon,
    permission: Permission.EDIT_COMPANY,
  },
  {
    to: ROUTES.PROFILE_COMPANY_TEAM,
    label: 'Сотрудники',
    shortLabel: 'Команда',
    icon: UserGroupIcon,
    permission: Permission.MANAGE_COMPANY_MEMBERS,
    match: 'prefix',
  },
  {
    to: ROUTES.PROFILE_COMPANY_SERVICES,
    label: 'Услуги',
    icon: Briefcase02Icon,
    permission: Permission.MANAGE_COMPANY_SERVICES,
    match: 'prefix',
  },
  {
    to: ROUTES.PROFILE_COMPANY_CASES,
    label: 'Кейсы',
    icon: Layers01Icon,
    permission: Permission.MANAGE_COMPANY_CASES,
    match: 'prefix',
  },
  {
    to: ROUTES.PROFILE_COMPANY_DOCUMENTS,
    label: 'Документы',
    icon: File02Icon,
    permission: Permission.MANAGE_COMPANY_DOCUMENTS,
    match: 'prefix',
  },
  {
    to: ROUTES.PROFILE_COMPANY_PERMISSIONS,
    label: 'Права',
    icon: Key01Icon,
    permission: [Permission.VIEW_COMPANY_PERMISSIONS, Permission.MANAGE_COMPANY_PERMISSIONS],
  },
  {
    to: ROUTES.PROFILE_COMPANY_VERIFICATION,
    label: 'Верификация',
    icon: CheckmarkBadge01Icon,
    permission: Permission.VIEW_COMPANY_VERIFICATION,
  },
  {
    to: ROUTES.PROFILE_COMPANY_SETTINGS,
    label: 'Настройки',
    icon: Settings01Icon,
    permission: Permission.MANAGE_COMPANY_SETTINGS,
  },
  {
    to: ROUTES.PROFILE_COMPANY_ACTIVITY,
    label: 'История',
    icon: Activity01Icon,
    permission: Permission.VIEW_COMPANY_ACTIVITY,
  },
]

const MOBILE_PRIMARY = [
  ROUTES.PROFILE_COMPANY,
  ROUTES.PROFILE_COMPANY_EDIT,
  ROUTES.PROFILE_COMPANY_TEAM,
  ROUTES.PROFILE_COMPANY_SERVICES,
]

function isActive(pathname: string, item: CompanyNavItem): boolean {
  if (item.match === 'exact' || item.to === ROUTES.PROFILE_COMPANY) {
    return pathname === item.to || pathname === `${item.to}/`
  }
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}

function useVisibleNav(): CompanyNavItem[] {
  const { has, hasAny } = usePermissions()
  return COMPANY_ADMIN_NAV.filter((item) => {
    if (!item.permission) return true
    const list = Array.isArray(item.permission) ? item.permission : [item.permission]
    return list.length === 1 ? has(list[0]!) : hasAny(list)
  })
}

function breadcrumbLabel(pathname: string, items: CompanyNavItem[]): string {
  const match = [...items]
    .sort((a, b) => b.to.length - a.to.length)
    .find((item) => isActive(pathname, item))
  return match?.label ?? 'Компания'
}

export function CompanyNavigation() {
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
  const location = useLocation()
  const items = useVisibleNav()

  if (items.length === 0) return null

  if (isDesktop) {
    return (
      <Box
        component="nav"
        aria-label="Управление компанией"
        sx={{
          width: 200,
          flexShrink: 0,
          pr: 2,
          borderRight: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack spacing={0.25}>
          {items.map((item) => {
            const active = isActive(location.pathname, item)
            return (
              <ButtonBase
                key={item.to}
                component={RouterLink}
                to={item.to}
                sx={{
                  justifyContent: 'flex-start',
                  gap: 1,
                  px: 1.25,
                  py: 0.85,
                  borderRadius: 1.5,
                  color: active ? 'primary.main' : 'text.secondary',
                  bgcolor: active ? 'action.selected' : 'transparent',
                  typography: 'body2',
                  fontWeight: active ? 600 : 500,
                  textAlign: 'left',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <AppIcon icon={item.icon} size={18} aria-hidden />
                {item.label}
              </ButtonBase>
            )
          })}
        </Stack>
      </Box>
    )
  }

  const primary = items.filter((i) => MOBILE_PRIMARY.includes(i.to))
  const more = items.filter((i) => !MOBILE_PRIMARY.includes(i.to))
  const primaryIndex = Math.max(
    0,
    primary.findIndex((i) => isActive(location.pathname, i)),
  )
  const moreActive = more.some((i) => isActive(location.pathname, i))

  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Tabs
          value={moreActive ? false : primaryIndex}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ flex: 1, minHeight: 40, '& .MuiTab-root': { minHeight: 40, py: 0 } }}
        >
          {primary.map((item) => (
            <Tab
              key={item.to}
              component={RouterLink}
              to={item.to}
              label={item.shortLabel ?? item.label}
              icon={<AppIcon icon={item.icon} size={16} aria-hidden />}
              iconPosition="start"
            />
          ))}
        </Tabs>
        {more.length > 0 ? (
          <Menu.Root>
            <Menu.Trigger
              render={
                <ButtonBase
                  sx={{
                    px: 1.25,
                    py: 0.75,
                    borderRadius: 1.5,
                    typography: 'body2',
                    fontWeight: moreActive ? 600 : 500,
                    color: moreActive ? 'primary.main' : 'text.secondary',
                    bgcolor: moreActive ? 'action.selected' : 'transparent',
                    border: '1px solid',
                    borderColor: 'divider',
                    whiteSpace: 'nowrap',
                  }}
                />
              }
            >
              Ещё
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner sideOffset={6} align="end">
                <Menu.Popup
                  style={{
                    zIndex: 1300,
                    minWidth: 200,
                    padding: 6,
                    borderRadius: 12,
                    border: '1px solid',
                    background: 'var(--mui-palette-background-paper, #fff)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  }}
                >
                  {more.map((item) => (
                    <Menu.Item
                      key={item.to}
                      render={<RouterLink to={item.to} />}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 10px',
                        borderRadius: 8,
                        textDecoration: 'none',
                        color: 'inherit',
                        cursor: 'pointer',
                        fontSize: 14,
                      }}
                    >
                      <AppIcon icon={item.icon} size={16} aria-hidden />
                      {item.label}
                    </Menu.Item>
                  ))}
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        ) : null}
      </Stack>
    </Box>
  )
}

export function CompanyManagementLayout({ children }: { children?: ReactNode }) {
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
  const location = useLocation()
  const { has } = usePermissions()
  const canManage = has(Permission.EDIT_COMPANY)
  const items = useVisibleNav()

  if (!canManage) {
    return <>{children ?? null}</>
  }

  return (
    <Box>
      {isDesktop ? (
        <Breadcrumbs sx={{ mb: 2 }} aria-label="Навигация">
          <Link component={RouterLink} to={ROUTES.HOME} underline="hover" color="inherit">
            Главная
          </Link>
          <Link
            component={RouterLink}
            to={ROUTES.PROFILE_COMPANY}
            underline="hover"
            color="inherit"
          >
            <Stack direction="row" spacing={0.5} alignItems="center" component="span">
              <AppIcon icon={Building02Icon} size={14} aria-hidden />
              <span>Компания</span>
            </Stack>
          </Link>
          <Typography color="text.primary">{breadcrumbLabel(location.pathname, items)}</Typography>
        </Breadcrumbs>
      ) : null}

      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <CompanyNavigation />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <CompanyNavigation />
          </Box>
          {children}
        </Box>
      </Box>
    </Box>
  )
}
