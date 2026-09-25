import Chip from '@mui/material/Chip'
import type { SystemRole } from '@/entities/user'
import { SYSTEM_ROLE_CHIP_COLOR, SYSTEM_ROLE_LABELS } from '../model/statusConfig'

export function SystemRoleChip({ role }: { role: SystemRole | string }) {
  return (
    <Chip
      size="small"
      color={SYSTEM_ROLE_CHIP_COLOR[role as SystemRole] ?? 'default'}
      label={SYSTEM_ROLE_LABELS[role as SystemRole] ?? role}
    />
  )
}
