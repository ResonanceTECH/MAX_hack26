import type { ChipProps } from '@mui/material/Chip'
import {
  MODERATION_PRIORITY,
  MODERATION_STATUS,
  type ModerationPriority,
  type ModerationStatus,
} from '@/entities/moderation'

export const MODERATION_STATUS_LABELS: Record<ModerationStatus, string> = {
  [MODERATION_STATUS.PENDING]: 'Ожидает проверки',
  [MODERATION_STATUS.IN_REVIEW]: 'На проверке',
  [MODERATION_STATUS.APPROVED]: 'Одобрено',
  [MODERATION_STATUS.REJECTED]: 'Отклонено',
  [MODERATION_STATUS.NEEDS_CHANGES]: 'Нужны исправления',
  [MODERATION_STATUS.BLOCKED]: 'Заблокировано',
  [MODERATION_STATUS.ESCALATED]: 'Передано администратору',
}

export const MODERATION_STATUS_COLORS: Record<ModerationStatus, ChipProps['color']> = {
  [MODERATION_STATUS.PENDING]: 'default',
  [MODERATION_STATUS.IN_REVIEW]: 'primary',
  [MODERATION_STATUS.APPROVED]: 'success',
  [MODERATION_STATUS.REJECTED]: 'error',
  [MODERATION_STATUS.NEEDS_CHANGES]: 'warning',
  [MODERATION_STATUS.BLOCKED]: 'error',
  [MODERATION_STATUS.ESCALATED]: 'secondary',
}

export function getModerationStatusConfig(status: ModerationStatus) {
  return {
    label: MODERATION_STATUS_LABELS[status],
    color: MODERATION_STATUS_COLORS[status],
  }
}

export const MODERATION_PRIORITY_LABELS: Record<ModerationPriority, string> = {
  [MODERATION_PRIORITY.LOW]: 'Низкий',
  [MODERATION_PRIORITY.NORMAL]: 'Обычный',
  [MODERATION_PRIORITY.HIGH]: 'Высокий',
  [MODERATION_PRIORITY.CRITICAL]: 'Критический',
}

export const MODERATION_PRIORITY_COLORS: Record<ModerationPriority, ChipProps['color']> = {
  [MODERATION_PRIORITY.LOW]: 'default',
  [MODERATION_PRIORITY.NORMAL]: 'info',
  [MODERATION_PRIORITY.HIGH]: 'warning',
  [MODERATION_PRIORITY.CRITICAL]: 'error',
}

export function getModerationPriorityConfig(priority: ModerationPriority) {
  return {
    label: MODERATION_PRIORITY_LABELS[priority],
    color: MODERATION_PRIORITY_COLORS[priority],
  }
}
