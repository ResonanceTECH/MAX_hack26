import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Chip from '@mui/material/Chip'
import { AppIcon } from './AppIcon'
import { CheckmarkBadge01Icon } from './icons'

export interface VerifiedBadgeProps {
  verified: boolean
  compact?: boolean
}

export function VerifiedBadge({ verified, compact }: VerifiedBadgeProps) {
  if (!verified) return null

  if (compact) {
    return (
      <Tooltip title="Проверенная компания">
        <Stack component="span" aria-label="Проверенная компания">
          <AppIcon icon={CheckmarkBadge01Icon} size={18} color="#1F6F8B" />
        </Stack>
      </Tooltip>
    )
  }

  return (
    <Chip
      icon={<AppIcon icon={CheckmarkBadge01Icon} size={16} />}
      label="Проверена"
      size="small"
      color="secondary"
      variant="outlined"
      sx={{ borderRadius: 1.5, fontWeight: 600 }}
    />
  )
}
