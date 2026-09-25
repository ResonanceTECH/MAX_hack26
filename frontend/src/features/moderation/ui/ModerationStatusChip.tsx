import Chip from '@mui/material/Chip'
import type { ModerationStatus } from '@/entities/moderation'
import { getModerationStatusConfig } from '../model/statusConfig'

export function ModerationStatusChip({ status }: { status: ModerationStatus }) {
  const cfg = getModerationStatusConfig(status)
  return <Chip size="small" label={cfg.label} color={cfg.color} />
}
