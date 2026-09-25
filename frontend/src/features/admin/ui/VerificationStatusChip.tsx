import Chip from '@mui/material/Chip'
import {
  VERIFICATION_STATUS_CHIP_COLOR,
  VERIFICATION_STATUS_LABELS,
} from '../model/statusConfig'

export function VerificationStatusChip({ status }: { status: string }) {
  return (
    <Chip
      size="small"
      variant="outlined"
      color={VERIFICATION_STATUS_CHIP_COLOR[status] ?? 'default'}
      label={VERIFICATION_STATUS_LABELS[status] ?? status}
    />
  )
}
