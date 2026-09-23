import Chip from '@mui/material/Chip'
import {
  DEAL_STATUS_LABELS,
  OPPORTUNITY_STATUS_LABELS,
  PROPOSAL_STATUS_LABELS,
} from '@/shared/constants/labels'

type StatusKind = 'opportunity' | 'proposal' | 'deal'

const colorMap: Record<
  string,
  'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'
> = {
  draft: 'default',
  published: 'primary',
  collecting_proposals: 'secondary',
  shortlisting: 'warning',
  negotiation: 'warning',
  agreement: 'primary',
  closed: 'success',
  cancelled: 'error',
  expired: 'error',
  submitted: 'primary',
  viewed: 'secondary',
  shortlisted: 'warning',
  accepted: 'success',
  rejected: 'error',
  withdrawn: 'default',
}

export interface StatusChipProps {
  status: string
  kind?: StatusKind
}

const labelByKind: Record<StatusKind, Record<string, string>> = {
  opportunity: OPPORTUNITY_STATUS_LABELS,
  proposal: PROPOSAL_STATUS_LABELS,
  deal: DEAL_STATUS_LABELS,
}

export function StatusChip({ status, kind = 'opportunity' }: StatusChipProps) {
  const labels = labelByKind[kind]
  return (
    <Chip
      size="small"
      label={labels[status] ?? status}
      color={colorMap[status] ?? 'default'}
      sx={{ borderRadius: 1.5, fontWeight: 600 }}
    />
  )
}
