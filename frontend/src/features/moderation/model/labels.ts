import {
  DATA_ORIGIN,
  MODERATION_ACTION,
  MODERATION_ENTITY_TYPES,
  MODERATION_REASON,
  type DataOrigin,
  type ModerationAction,
  type ModerationEntityType,
  type ModerationReason,
} from '@/entities/moderation'
import { REPORT_STATUS, REPORT_TYPE, type ReportStatus, type ReportType } from '@/entities/report'
import { type EscalationReason } from '@/entities/escalation'
import {
  MODERATION_PRIORITY_LABELS,
  MODERATION_STATUS_LABELS,
} from './statusConfig'

export { MODERATION_STATUS_LABELS, MODERATION_PRIORITY_LABELS }

export const MODERATION_TYPE_LABELS: Record<ModerationEntityType, string> = {
  [MODERATION_ENTITY_TYPES.COMPANY]: 'Компания',
  [MODERATION_ENTITY_TYPES.OPPORTUNITY]: 'Запрос',
  [MODERATION_ENTITY_TYPES.CASE]: 'Кейс',
  [MODERATION_ENTITY_TYPES.DOCUMENT]: 'Документ',
}

export const MODERATION_ACTION_LABELS: Record<ModerationAction, string> = {
  [MODERATION_ACTION.ASSIGNED]: 'Взято в работу',
  [MODERATION_ACTION.APPROVED]: 'Одобрение',
  [MODERATION_ACTION.REJECTED]: 'Отклонение',
  [MODERATION_ACTION.CHANGES_REQUESTED]: 'Запрос исправлений',
  [MODERATION_ACTION.BLOCKED]: 'Блокировка',
  [MODERATION_ACTION.REPORT_RESOLVED]: 'Жалоба закрыта',
  [MODERATION_ACTION.ESCALATED]: 'Эскалация',
}

export const MODERATION_REASON_LABELS: Record<ModerationReason, string> = {
  [MODERATION_REASON.NEW_COMPANY]: 'Новая регистрация',
  [MODERATION_REASON.PROFILE_UPDATED]: 'Обновление профиля',
  [MODERATION_REASON.NEW_DOCUMENT]: 'Новый документ',
  [MODERATION_REASON.NEW_CASE]: 'Новый кейс',
  [MODERATION_REASON.NEW_OPPORTUNITY]: 'Новый запрос',
  [MODERATION_REASON.CONTENT_REPORT]: 'Жалоба на контент',
  [MODERATION_REASON.AUTOMATED_FLAG]: 'Автоматическая проверка',
  [MODERATION_REASON.RESUBMISSION]: 'Повторная проверка',
}

export const DATA_ORIGIN_LABELS: Record<DataOrigin, string> = {
  [DATA_ORIGIN.USER]: 'Данные пользователя',
  [DATA_ORIGIN.REPORT]: 'Жалоба пользователя',
  [DATA_ORIGIN.AUTOMATED_RULE]: 'Автоматическое правило',
  [DATA_ORIGIN.MODEL_DATA]: 'Модельные данные',
  [DATA_ORIGIN.MODERATION_DECISION]: 'Модерационное решение',
}

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  [REPORT_TYPE.SPAM]: 'Спам',
  [REPORT_TYPE.FRAUD]: 'Мошенничество',
  [REPORT_TYPE.FAKE_COMPANY]: 'Фиктивная компания',
  [REPORT_TYPE.MISLEADING_INFORMATION]: 'Вводящая в заблуждение информация',
  [REPORT_TYPE.INAPPROPRIATE_CONTENT]: 'Недопустимый контент',
  [REPORT_TYPE.DUPLICATE]: 'Дубликат',
  [REPORT_TYPE.OTHER]: 'Другое',
}

/** @deprecated alias */
export const REPORT_REASON_LABELS = REPORT_TYPE_LABELS

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  [REPORT_STATUS.OPEN]: 'Открыта',
  [REPORT_STATUS.IN_PROGRESS]: 'В работе',
  [REPORT_STATUS.RESOLVED]: 'Решена',
  [REPORT_STATUS.CLOSED]: 'Закрыта',
  [REPORT_STATUS.ESCALATED]: 'Эскалирована',
}

export const ESCALATION_REASON_LABELS: Record<EscalationReason, string> = {
  AMBIGUOUS: 'Неоднозначный случай',
  REPEAT_VIOLATION: 'Повторное нарушение',
  FRAUD_SUSPICION: 'Подозрение на мошенничество',
  DATA_CONFLICT: 'Конфликт данных',
  ADMIN_BLOCK_NEEDED: 'Нужна административная блокировка',
  SYSTEM_ISSUE: 'Системная проблема',
  OTHER: 'Другое',
}

export const COMPANY_REJECT_REASONS = [
  { value: 'INVALID_DATA', label: 'Некорректные данные' },
  { value: 'INSUFFICIENT_INFO', label: 'Недостаточно информации' },
  { value: 'SUSPICIOUS', label: 'Подозрительные сведения' },
  { value: 'FORBIDDEN_CONTENT', label: 'Запрещённый контент' },
  { value: 'DUPLICATE', label: 'Дублирующая компания' },
  { value: 'OTHER', label: 'Другое' },
] as const

export const OPPORTUNITY_REJECT_REASONS = [
  { value: 'INVALID_DESCRIPTION', label: 'Некорректное описание' },
  { value: 'SPAM', label: 'Спам' },
  { value: 'DUPLICATE', label: 'Дублирующий запрос' },
  { value: 'FORBIDDEN_CONTENT', label: 'Запрещённый контент' },
  { value: 'CATEGORY_MISMATCH', label: 'Несоответствие категории' },
  { value: 'INSUFFICIENT_INFO', label: 'Недостаточно информации' },
  { value: 'FRAUD', label: 'Мошеннический / подозрительный запрос' },
  { value: 'OTHER', label: 'Другое' },
] as const

export const GENERIC_REJECT_REASONS = [
  { value: 'FORBIDDEN_CONTENT', label: 'Запрещённый контент' },
  { value: 'INSUFFICIENT_INFO', label: 'Недостаточно информации' },
  { value: 'SPAM', label: 'Спам' },
  { value: 'OTHER', label: 'Другое' },
] as const

export const CLOSE_REPORT_REASONS = [
  { value: 'NO_VIOLATION', label: 'Нарушение не подтверждено' },
  { value: 'DUPLICATE', label: 'Дубликат жалобы' },
  { value: 'ALREADY_FIXED', label: 'Проблема уже устранена' },
  { value: 'OTHER', label: 'Другое' },
] as const

export const COMPANY_CHANGE_FIELDS = [
  { value: 'description', label: 'Описание' },
  { value: 'website', label: 'Website' },
  { value: 'industry', label: 'Отрасль' },
  { value: 'documents', label: 'Документы' },
] as const

export const OPPORTUNITY_CHANGE_FIELDS = [
  { value: 'title', label: 'Заголовок' },
  { value: 'description', label: 'Описание' },
  { value: 'category', label: 'Категория' },
  { value: 'budget', label: 'Бюджет' },
  { value: 'requirements', label: 'Требования' },
] as const

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
