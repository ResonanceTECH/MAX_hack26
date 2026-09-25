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
  UserGroupIcon,
  Clock01Icon,
  AlertCircleIcon,
  Share08Icon,
  Shield01Icon,
  Settings01Icon,
  Activity01Icon,
  CheckmarkBadge01Icon,
  MoreHorizontalIcon,
} from '@/shared/ui/icons'

export interface NavItem {
  to: string
  label: string
  icon: IconSvgElement
  emphasize?: boolean
  matchPrefix?: string
  badgeKey?: 'pendingQueue' | 'openReports' | 'adminNotifications'
  /** Special mobile "More" entry — opens menu/drawer instead of navigating */
  isMore?: boolean
}

export interface NavGroup {
  id: string
  label?: string
  items: NavItem[]
}

export interface NavConfig {
  mobile: NavItem[]
  desktop: NavItem[]
  desktopGroups?: NavGroup[]
  /** Extra items revealed by mobile "More" */
  mobileMore?: NavItem[]
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

const COMPANY_ADMIN_DESKTOP: NavItem[] = [
  ...BUSINESS_DESKTOP.slice(0, -1),
  { to: ROUTES.PROFILE_COMPANY, label: 'Компания', icon: Building02Icon },
]

const MODERATOR_MOBILE: NavItem[] = [
  { to: ROUTES.MODERATION, label: 'Обзор', icon: DashboardSquare01Icon },
  {
    to: ROUTES.MODERATION_QUEUE,
    label: 'Очередь',
    icon: InboxIcon,
    matchPrefix: '/moderation/queue',
    badgeKey: 'pendingQueue',
  },
  {
    to: ROUTES.MODERATION_REPORTS,
    label: 'Жалобы',
    icon: AlertCircleIcon,
    matchPrefix: '/moderation/reports',
    badgeKey: 'openReports',
  },
  { to: ROUTES.MODERATION_HISTORY, label: 'История', icon: Clock01Icon },
]

const MODERATOR_DESKTOP: NavItem[] = [
  { to: ROUTES.MODERATION, label: 'Обзор', icon: DashboardSquare01Icon },
  { to: ROUTES.MODERATION_QUEUE, label: 'Очередь', icon: InboxIcon, matchPrefix: '/moderation/queue' },
  {
    to: ROUTES.MODERATION_QUEUE_COMPANIES,
    label: 'Компании',
    icon: Building02Icon,
  },
  {
    to: ROUTES.MODERATION_QUEUE_OPPORTUNITIES,
    label: 'Запросы',
    icon: Briefcase02Icon,
  },
  {
    to: ROUTES.MODERATION_QUEUE_CASES,
    label: 'Кейсы',
    icon: Layers01Icon,
  },
  {
    to: ROUTES.MODERATION_QUEUE_DOCUMENTS,
    label: 'Документы',
    icon: File02Icon,
  },
  { to: ROUTES.MODERATION_REPORTS, label: 'Жалобы', icon: AlertCircleIcon },
  { to: ROUTES.MODERATION_ESCALATIONS, label: 'Эскалации', icon: Share08Icon },
  { to: ROUTES.MODERATION_HISTORY, label: 'История', icon: Clock01Icon },
  { to: ROUTES.NOTIFICATIONS, label: 'Уведомления', icon: Shield01Icon },
  { to: ROUTES.MODERATION_PROFILE, label: 'Профиль', icon: UserCircleIcon },
]

const PLATFORM_ADMIN_MOBILE: NavItem[] = [
  { to: ROUTES.ADMIN, label: 'Обзор', icon: DashboardSquare01Icon },
  { to: ROUTES.ADMIN_USERS, label: 'Пользователи', icon: UserGroupIcon, matchPrefix: '/admin/users' },
  {
    to: ROUTES.ADMIN_COMPANIES,
    label: 'Компании',
    icon: Building02Icon,
    matchPrefix: '/admin/companies',
  },
  { to: '#more', label: 'Ещё', icon: MoreHorizontalIcon, isMore: true },
]

const PLATFORM_ADMIN_MOBILE_MORE: NavItem[] = [
  { to: ROUTES.ADMIN_MODERATION, label: 'Модерация', icon: Shield01Icon },
  { to: ROUTES.ADMIN_DICTIONARIES, label: 'Справочники', icon: Layers01Icon },
  { to: ROUTES.ADMIN_ANALYTICS, label: 'Аналитика', icon: Analytics01Icon },
  { to: ROUTES.ADMIN_AUDIT, label: 'Audit Log', icon: Activity01Icon },
  { to: ROUTES.ADMIN_SETTINGS, label: 'Настройки', icon: Settings01Icon },
  { to: ROUTES.ADMIN_FEATURE_FLAGS, label: 'Feature Flags', icon: CheckmarkBadge01Icon },
  { to: ROUTES.ADMIN_PROFILE, label: 'Профиль администратора', icon: UserCircleIcon },
]

const PLATFORM_ADMIN_DESKTOP_GROUPS: NavGroup[] = [
  {
    id: 'platform',
    label: 'Платформа',
    items: [{ to: ROUTES.ADMIN, label: 'Обзор', icon: DashboardSquare01Icon }],
  },
  {
    id: 'management',
    label: 'Управление',
    items: [
      { to: ROUTES.ADMIN_USERS, label: 'Пользователи', icon: UserGroupIcon, matchPrefix: '/admin/users' },
      {
        to: ROUTES.ADMIN_COMPANIES,
        label: 'Компании',
        icon: Building02Icon,
        matchPrefix: '/admin/companies',
      },
      { to: ROUTES.ADMIN_MODERATION, label: 'Модерация', icon: Shield01Icon },
    ],
  },
  {
    id: 'data',
    label: 'Данные',
    items: [
      {
        to: ROUTES.ADMIN_DICTIONARIES,
        label: 'Справочники',
        icon: Layers01Icon,
        matchPrefix: '/admin/dictionaries',
      },
      { to: ROUTES.ADMIN_DICTIONARIES_CATEGORIES, label: 'Категории', icon: DocumentValidationIcon },
      { to: ROUTES.ADMIN_DICTIONARIES_INDUSTRIES, label: 'Отрасли', icon: Briefcase02Icon },
      { to: ROUTES.ADMIN_DICTIONARIES_REGIONS, label: 'Регионы', icon: File02Icon },
    ],
  },
  {
    id: 'control',
    label: 'Контроль',
    items: [
      { to: ROUTES.ADMIN_ANALYTICS, label: 'Аналитика', icon: Analytics01Icon },
      { to: ROUTES.ADMIN_AUDIT, label: 'Audit Log', icon: Activity01Icon },
    ],
  },
  {
    id: 'system',
    label: 'Система',
    items: [
      { to: ROUTES.ADMIN_FEATURE_FLAGS, label: 'Feature Flags', icon: CheckmarkBadge01Icon },
      { to: ROUTES.ADMIN_SETTINGS, label: 'Настройки', icon: Settings01Icon },
    ],
  },
]

const PLATFORM_ADMIN_DESKTOP: NavItem[] = PLATFORM_ADMIN_DESKTOP_GROUPS.flatMap((g) => g.items)

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
        mobile: MODERATOR_MOBILE,
        desktop: MODERATOR_DESKTOP,
        homePath: ROUTES.MODERATION,
      }
    case SYSTEM_ROLES.PLATFORM_ADMIN:
      return {
        mobile: PLATFORM_ADMIN_MOBILE,
        desktop: PLATFORM_ADMIN_DESKTOP,
        desktopGroups: PLATFORM_ADMIN_DESKTOP_GROUPS,
        mobileMore: PLATFORM_ADMIN_MOBILE_MORE,
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
