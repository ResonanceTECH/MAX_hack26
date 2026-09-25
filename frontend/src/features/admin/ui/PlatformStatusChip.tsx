import Chip from '@mui/material/Chip'
import {
  PLATFORM_COMPANY_STATUS_CHIP_COLOR,
  PLATFORM_COMPANY_STATUS_LABELS,
  USER_STATUS_CHIP_COLOR,
  USER_STATUS_LABELS,
} from '../model/statusConfig'

export function PlatformStatusChip({
  status,
  kind = 'company',
}: {
  status: string
  kind?: 'company' | 'user'
}) {
  if (kind === 'user') {
    return (
      <Chip
        size="small"
        color={USER_STATUS_CHIP_COLOR[status] ?? 'default'}
        label={USER_STATUS_LABELS[status] ?? status}
      />
    )
  }
  return (
    <Chip
      size="small"
      color={PLATFORM_COMPANY_STATUS_CHIP_COLOR[status] ?? 'default'}
      label={PLATFORM_COMPANY_STATUS_LABELS[status] ?? status}
    />
  )
}
