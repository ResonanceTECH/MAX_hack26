import type { ModerationAction, ModerationEntityType, ModerationStatus } from '@/entities/moderation'
import type { ReportReason, ReportStatus } from '@/entities/report'

export const MODERATION_STATUS_LABELS: Record<ModerationStatus, string> = {
  pending: 'Ожидает',
  approved: 'Одобрено',
  rejected: 'Отклонено',
  needs_changes: 'Нужны правки',
  blocked: 'Заблокировано',
}

export const MODERATION_TYPE_LABELS: Record<ModerationEntityType, string> = {
  company: 'Компания',
  opportunity: 'Запрос',
  case: 'Кейс',
  document: 'Документ',
}

export const MODERATION_ACTION_LABELS: Record<ModerationAction, string> = {
  approve: 'Одобрение',
  reject: 'Отклонение',
  request_changes: 'Запрос правок',
  block: 'Блокировка',
}

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  Spam: 'Спам',
  'Fake company': 'Фиктивная компания',
  Fraud: 'Мошенничество',
  'Inappropriate content': 'Недопустимый контент',
  Other: 'Другое',
}

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  open: 'Открыта',
  closed: 'Закрыта',
  action_taken: 'Приняты меры',
}

export const SYSTEM_ROLE_LABELS: Record<string, string> = {
  BUSINESS_USER: 'Бизнес-пользователь',
  COMPANY_ADMIN: 'Админ компании',
  MODERATOR: 'Модератор',
  PLATFORM_ADMIN: 'Админ платформы',
}

export const USER_STATUS_LABELS: Record<string, string> = {
  active: 'Активен',
  blocked: 'Заблокирован',
  invited: 'Приглашён',
}

export const PLATFORM_COMPANY_STATUS_LABELS: Record<string, string> = {
  active: 'Активна',
  pending_moderation: 'На модерации',
  blocked: 'Заблокирована',
  suspended: 'Приостановлена',
}

export const VERIFICATION_STATUS_LABELS: Record<string, string> = {
  verified: 'Верифицирована',
  unverified: 'Не верифицирована',
  pending: 'На проверке',
}
