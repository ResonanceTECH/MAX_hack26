import type { ChipProps } from '@mui/material/Chip'
import { SYSTEM_ROLES, USER_STATUS, type SystemRole, type UserStatus } from '@/entities/user'

export const SYSTEM_ROLE_LABELS: Record<SystemRole, string> = {
  [SYSTEM_ROLES.BUSINESS_USER]: 'Бизнес-пользователь',
  [SYSTEM_ROLES.COMPANY_ADMIN]: 'Админ компании',
  [SYSTEM_ROLES.MODERATOR]: 'Модератор',
  [SYSTEM_ROLES.PLATFORM_ADMIN]: 'Админ платформы',
}

export const SYSTEM_ROLE_CHIP_COLOR: Record<SystemRole, ChipProps['color']> = {
  [SYSTEM_ROLES.BUSINESS_USER]: 'default',
  [SYSTEM_ROLES.COMPANY_ADMIN]: 'primary',
  [SYSTEM_ROLES.MODERATOR]: 'warning',
  [SYSTEM_ROLES.PLATFORM_ADMIN]: 'secondary',
}

export const USER_STATUS_LABELS: Record<UserStatus | string, string> = {
  [USER_STATUS.ACTIVE]: 'Активен',
  [USER_STATUS.BLOCKED]: 'Заблокирован',
  [USER_STATUS.INVITED]: 'Приглашён',
  suspended: 'Приостановлен',
  ACTIVE: 'Активен',
  BLOCKED: 'Заблокирован',
  INVITED: 'Приглашён',
  SUSPENDED: 'Приостановлен',
}

export const USER_STATUS_CHIP_COLOR: Record<string, ChipProps['color']> = {
  active: 'success',
  ACTIVE: 'success',
  suspended: 'warning',
  SUSPENDED: 'warning',
  blocked: 'error',
  BLOCKED: 'error',
  invited: 'info',
  INVITED: 'info',
}

export const PLATFORM_COMPANY_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Активна',
  SUSPENDED: 'Приостановлена',
  BLOCKED: 'Заблокирована',
  ARCHIVED: 'В архиве',
  active: 'Активна',
  suspended: 'Приостановлена',
  blocked: 'Заблокирована',
  archived: 'В архиве',
  pending_moderation: 'На модерации',
}

export const PLATFORM_COMPANY_STATUS_CHIP_COLOR: Record<string, ChipProps['color']> = {
  ACTIVE: 'success',
  active: 'success',
  SUSPENDED: 'warning',
  suspended: 'warning',
  BLOCKED: 'error',
  blocked: 'error',
  ARCHIVED: 'default',
  archived: 'default',
  pending_moderation: 'warning',
}

export const VERIFICATION_STATUS_LABELS: Record<string, string> = {
  NOT_VERIFIED: 'Не верифицирована',
  PENDING: 'На проверке',
  VERIFIED: 'Верифицирована',
  REJECTED: 'Отклонена',
  REQUIRES_UPDATE: 'Требует обновления',
  not_verified: 'Не верифицирована',
  pending: 'На проверке',
  verified: 'Верифицирована',
  rejected: 'Отклонена',
  requires_update: 'Требует обновления',
  unverified: 'Не верифицирована',
}

export const VERIFICATION_STATUS_CHIP_COLOR: Record<string, ChipProps['color']> = {
  NOT_VERIFIED: 'default',
  not_verified: 'default',
  unverified: 'default',
  PENDING: 'warning',
  pending: 'warning',
  VERIFIED: 'success',
  verified: 'success',
  REJECTED: 'error',
  rejected: 'error',
  REQUIRES_UPDATE: 'info',
  requires_update: 'info',
}

export const DICTIONARY_TYPE_LABELS: Record<string, string> = {
  categories: 'Категории',
  subcategories: 'Подкатегории',
  industries: 'Отрасли',
  skills: 'Компетенции',
  technologies: 'Технологии',
  regions: 'Регионы',
  documentTypes: 'Типы документов',
  opportunityTypes: 'Типы запросов',
  verificationReasons: 'Причины верификации',
  reportReasons: 'Причины жалоб',
}

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  USER_BLOCKED: 'Заблокировал пользователя',
  USER_UNBLOCKED: 'Разблокировал пользователя',
  USER_ROLE_CHANGED: 'Изменил системную роль',
  USER_SUSPENDED: 'Приостановил доступ',
  USER_ACTIVATED: 'Активировал пользователя',
  COMPANY_BLOCKED: 'Заблокировал компанию',
  COMPANY_STATUS_CHANGED: 'Изменил статус компании',
  COMPANY_VERIFICATION_CHANGED: 'Изменил verification',
  MODERATION_OVERRIDDEN: 'Переопределил решение модерации',
  DICTIONARY_CREATED: 'Создал элемент справочника',
  DICTIONARY_UPDATED: 'Обновил справочник',
  DICTIONARY_ARCHIVED: 'Архивировал справочник',
  PLATFORM_SETTING_CHANGED: 'Изменил настройки платформы',
  FEATURE_FLAG_CHANGED: 'Изменил feature flag',
  MAINTENANCE_MODE_CHANGED: 'Изменил режим обслуживания',
  ESCALATION_RESOLVED: 'Закрыл эскалацию',
  block_user: 'Заблокировал пользователя',
  unblock_user: 'Разблокировал пользователя',
  update_company_status: 'Изменил статус компании',
  update_platform_settings: 'Изменил настройки',
  create_dictionary: 'Создал справочник',
  archive_dictionary: 'Архивировал справочник',
  edit_dictionary: 'Обновил справочник',
}
