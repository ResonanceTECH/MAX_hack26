import type { IconSvgElement } from '@hugeicons/react'
import { SYSTEM_ROLES, type SystemRole } from '@/entities/user'
import { ROUTES } from '@/shared/constants/routes'
import {
  Analytics01Icon,
  Briefcase02Icon,
  Building02Icon,
  DashboardSquare01Icon,
  DocumentValidationIcon,
  FavouriteIcon,
  File02Icon,
  Home01Icon,
  InboxIcon,
  Layers01Icon,
  AddCircleIcon,
  Task01Icon,
  UserCircleIcon,
  WorkflowSquare01Icon,
  Clock01Icon,
  AlertCircleIcon,
} from '@/shared/ui/icons'

export interface NavItem {
  to: string
  label: string
  icon: IconSvgElement
  emphasize?: boolean
  matchPrefix?: string
}

export interface NavConfig {
  mobile: NavItem[]
  desktop: NavItem[]
  /** Platform admin: use drawer on mobile instead of bottom nav */
  mobileAsDrawer?: boolean
  homePath: string
}

const BUSINESS_MOBILE: NavItem[] = [
  { to: ROUTES.HOME, label: 'Главная', icon: Home01Icon },
  { to: ROUTES.OPPORTUNITIES, label: 'Возможности', icon: Briefcase02Icon, matchPrefix: '/opportunities' },
  {
    to: ROUTES.OPPORTUNITY_CREATE,
    label: 'Создать',
    icon: AddCircleIcon,
    emphasize: true,
  },
  { to: ROUTES.MY, label: 'Мои процессы', icon: Task01Icon, matchPrefix: '/my' },
  {
    to: ROUTES.PROFILE_COMPANY,
    label: 'Компания',
    icon: Building02Icon,
    matchPrefix: '/profile',
  },
]

const BUSINESS_DESKTOP: NavItem[] = [
  { to: ROUTES.HOME, label: 'Главная', icon: Home01Icon },
  { to: ROUTES.OPPORTUNITIES, label: 'Возможности', icon: Briefcase02Icon },
  {
    to: ROUTES.OPPORTUNITY_CREATE,
    label: 'Создать запрос',
    icon: AddCircleIcon,
    emphasize: true,
  },
  { to: ROUTES.COMPANIES, label: 'Компании', icon: Layers01Icon },
  { to: ROUTES.MY, label: 'Мои процессы', icon: Task01Icon },
  { to: ROUTES.FAVORITES, label: 'Избранное', icon: FavouriteIcon },
  { to: ROUTES.PROFILE_COMPANY, label: 'Профиль компании', icon: Building02Icon },
]

/** Same as BUSINESS_DESKTOP, but profile entry labelled «Компания» */
const COMPANY_ADMIN_DESKTOP: NavItem[] = [
  ...BUSINESS_DESKTOP.slice(0, -1),
  { to: ROUTES.PROFILE_COMPANY, label: 'Компания', icon: Building02Icon },
]

const MODERATOR_NAV: NavItem[] = [
  { to: ROUTES.MODERATION, label: 'Очередь', icon: InboxIcon, matchPrefix: '/moderation/queue' },
  { to: ROUTES.MODERATION_REPORTS, label: 'Жалобы', icon: AlertCircleIcon },
  { to: ROUTES.MODERATION_HISTORY, label: 'История', icon: Clock01Icon },
  { to: ROUTES.PROFILE, label: 'Профиль', icon: UserCircleIcon },
]

const PLATFORM_ADMIN_NAV_RU: NavItem[] = [
  { to: ROUTES.ADMIN, label: 'Dashboard', icon: DashboardSquare01Icon },
  { to: ROUTES.ADMIN_USERS, label: 'Пользователи', icon: UserCircleIcon },
  { to: ROUTES.ADMIN_COMPANIES, label: 'Компании', icon: Building02Icon },
  { to: ROUTES.ADMIN_MODERATION, label: 'Модерация', icon: DocumentValidationIcon },
  { to: ROUTES.ADMIN_DICTIONARIES, label: 'Справочники', icon: File02Icon },
  { to: ROUTES.ADMIN_ANALYTICS, label: 'Аналитика', icon: Analytics01Icon },
  { to: ROUTES.ADMIN_AUDIT, label: 'Аудит', icon: WorkflowSquare01Icon },
  { to: ROUTES.ADMIN_SETTINGS, label: 'Настройки', icon: Layers01Icon },
]

export function getNavConfig(role: SystemRole | null): NavConfig {
  switch (role) {
    case SYSTEM_ROLES.COMPANY_ADMIN:
      return {
        mobile: BUSINESS_MOBILE,
        desktop: COMPANY_ADMIN_DESKTOP,
        homePath: ROUTES.HOME,
      }
    case SYSTEM_ROLES.MODERATOR:
      return {
        mobile: [
          { to: ROUTES.MODERATION, label: 'Очередь', icon: InboxIcon },
          { to: ROUTES.MODERATION_REPORTS, label: 'Жалобы', icon: AlertCircleIcon },
          { to: ROUTES.MODERATION_HISTORY, label: 'История', icon: Clock01Icon },
          { to: ROUTES.PROFILE, label: 'Профиль', icon: UserCircleIcon },
        ],
        desktop: [
          { to: ROUTES.MODERATION, label: 'Dashboard', icon: DashboardSquare01Icon },
          ...MODERATOR_NAV,
        ],
        homePath: ROUTES.MODERATION,
      }
    case SYSTEM_ROLES.PLATFORM_ADMIN:
      return {
        mobile: PLATFORM_ADMIN_NAV_RU.slice(0, 4),
        desktop: PLATFORM_ADMIN_NAV_RU,
        mobileAsDrawer: true,
        homePath: ROUTES.ADMIN,
      }
    case SYSTEM_ROLES.BUSINESS_USER:
    default:
      return {
        mobile: BUSINESS_MOBILE,
        desktop: BUSINESS_DESKTOP,
        homePath: ROUTES.HOME,
      }
  }
}
