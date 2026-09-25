import Chip from '@mui/material/Chip'
import type { ModerationPriority } from '@/entities/moderation'
import { getModerationPriorityConfig } from '../model/statusConfig'

export function ModerationPriorityChip({ priority }: { priority: ModerationPriority }) {
  const cfg = getModerationPriorityConfig(priority)
  return (
    <Chip
      size="small"
      variant="outlined"
      label={`Приоритет: ${cfg.label}`}
      color={cfg.color}
      aria-label={`Приоритет ${cfg.label}`}
    />
  )
}
