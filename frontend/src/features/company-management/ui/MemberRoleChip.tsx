import Chip from '@mui/material/Chip'
import {
  COMPANY_MEMBER_ROLE_LABELS,
  COMPANY_MEMBER_STATUS,
  type CompanyMemberRole,
  type CompanyMemberStatus,
} from '@/entities/company-member'

const ROLE_COLOR: Record<CompanyMemberRole, 'primary' | 'secondary' | 'default'> = {
  COMPANY_ADMIN: 'primary',
  MANAGER: 'secondary',
  VIEWER: 'default',
}

export function MemberRoleChip({ role }: { role: CompanyMemberRole }) {
  return (
    <Chip
      size="small"
      color={ROLE_COLOR[role] ?? 'default'}
      label={COMPANY_MEMBER_ROLE_LABELS[role] ?? role}
    />
  )
}

const STATUS_META: Record<
  CompanyMemberStatus,
  { label: string; color: 'success' | 'info' | 'warning' | 'default' | 'error' }
> = {
  [COMPANY_MEMBER_STATUS.ACTIVE]: { label: 'Активен', color: 'success' },
  [COMPANY_MEMBER_STATUS.INVITED]: { label: 'Приглашён', color: 'info' },
  [COMPANY_MEMBER_STATUS.SUSPENDED]: { label: 'Доступ приостановлен', color: 'warning' },
  [COMPANY_MEMBER_STATUS.DEACTIVATED]: { label: 'Удалён', color: 'default' },
}

export function MemberStatusChip({ status }: { status: CompanyMemberStatus }) {
  const meta = STATUS_META[status] ?? { label: status, color: 'default' as const }
  return <Chip size="small" color={meta.color} label={meta.label} />
}

export { STATUS_META as MEMBER_STATUS_META }
