import {
  MODERATION_STATUS,
  type ModerationItem,
  type ModerationPriority,
  type ModerationStatus,
} from '@/entities/moderation'
import { REPORT_STATUS, type Report } from '@/entities/report'

export const CURRENT_MODERATOR_ID = 'user-moderator'
export const CURRENT_MODERATOR_NAME = 'Елена Морозова'

export interface GuardResult {
  allowed: boolean
  reason?: string
}

function deny(reason: string): GuardResult {
  return { allowed: false, reason }
}

function ok(): GuardResult {
  return { allowed: true }
}

export function isTerminalStatus(status: ModerationStatus): boolean {
  return (
    status === MODERATION_STATUS.APPROVED ||
    status === MODERATION_STATUS.REJECTED ||
    status === MODERATION_STATUS.BLOCKED
  )
}

export function canAssignItem(
  item: ModerationItem,
  moderatorId: string = CURRENT_MODERATOR_ID,
): GuardResult {
  if (item.status === MODERATION_STATUS.IN_REVIEW) {
    if (item.assignedModeratorId && item.assignedModeratorId !== moderatorId) {
      return deny(`Проверяет: ${item.assignedModeratorName ?? 'другой модератор'}`)
    }
    if (item.assignedModeratorId === moderatorId) {
      return deny('Объект уже у вас в работе')
    }
  }
  if (item.status !== MODERATION_STATUS.PENDING && item.status !== MODERATION_STATUS.NEEDS_CHANGES) {
    return deny('Объект нельзя взять в работу в текущем статусе')
  }
  return ok()
}

export function canDecideItem(
  item: ModerationItem,
  moderatorId: string = CURRENT_MODERATOR_ID,
): GuardResult {
  if (isTerminalStatus(item.status)) {
    return deny('Решение по этому объекту уже принято')
  }
  if (item.status === MODERATION_STATUS.ESCALATED) {
    return deny('Объект передан администратору')
  }
  if (
    item.assignedModeratorId &&
    item.assignedModeratorId !== moderatorId &&
    item.status === MODERATION_STATUS.IN_REVIEW
  ) {
    return deny(`Проверяет: ${item.assignedModeratorName ?? 'другой модератор'}`)
  }
  return ok()
}

export function canApproveItem(item: ModerationItem, moderatorId?: string): GuardResult {
  if (item.status === MODERATION_STATUS.APPROVED) {
    return deny('Объект уже одобрен')
  }
  return canDecideItem(item, moderatorId)
}

export function canRejectItem(item: ModerationItem, moderatorId?: string): GuardResult {
  if (item.status === MODERATION_STATUS.BLOCKED) {
    return deny('Заблокированный объект нельзя отклонить')
  }
  if (item.status === MODERATION_STATUS.REJECTED) {
    return deny('Объект уже отклонён')
  }
  return canDecideItem(item, moderatorId)
}

export function canRequestChanges(item: ModerationItem, moderatorId?: string): GuardResult {
  return canDecideItem(item, moderatorId)
}

export function canBlockItem(item: ModerationItem, moderatorId?: string): GuardResult {
  if (item.status === MODERATION_STATUS.BLOCKED) {
    return deny('Объект уже заблокирован')
  }
  return canDecideItem(item, moderatorId)
}

export function canEscalateItem(item: ModerationItem, moderatorId?: string): GuardResult {
  if (item.status === MODERATION_STATUS.ESCALATED) {
    return deny('Объект уже эскалирован')
  }
  if (isTerminalStatus(item.status)) {
    return deny('По объекту уже принято финальное решение')
  }
  return canDecideItem(item, moderatorId)
}

export function canResolveReport(report: Report): GuardResult {
  if (
    report.status === REPORT_STATUS.RESOLVED ||
    report.status === REPORT_STATUS.CLOSED ||
    report.status === REPORT_STATUS.ESCALATED
  ) {
    return deny('Жалоба уже обработана')
  }
  return ok()
}

const PRIORITY_RANK: Record<ModerationPriority, number> = {
  CRITICAL: 4,
  HIGH: 3,
  NORMAL: 2,
  LOW: 1,
}

export function getModerationPriorityRank(priority: ModerationPriority): number {
  return PRIORITY_RANK[priority]
}

export function getQueueAgeHours(submittedAt: string, now = Date.now()): number {
  return (now - new Date(submittedAt).getTime()) / (1000 * 60 * 60)
}

export function needsAttention(item: ModerationItem, now = Date.now()): boolean {
  if (item.priority === 'CRITICAL' || item.priority === 'HIGH') return true
  if (item.reportsCount >= 2) return true
  if (getQueueAgeHours(item.submittedAt, now) >= 12) return true
  return false
}
