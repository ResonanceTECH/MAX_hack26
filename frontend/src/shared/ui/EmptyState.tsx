import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import { AppButton } from './AppButton'
import { AppIcon } from './AppIcon'
import { InboxIcon } from './icons'

export interface EmptyStateProps {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  icon?: ReactNode
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <Box
      sx={{
        py: 6,
        px: 2,
        textAlign: 'center',
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper',
      }}
    >
      <Stack spacing={1.5} alignItems="center">
        <Box color="text.secondary" aria-hidden>
          {icon ?? <AppIcon icon={InboxIcon} size={40} />}
        </Box>
        <Typography variant="h3">{title}</Typography>
        {description ? (
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
            {description}
          </Typography>
        ) : null}
        {actionLabel && onAction ? (
          <AppButton variant="contained" onClick={onAction}>
            {actionLabel}
          </AppButton>
        ) : null}
      </Stack>
    </Box>
  )
}
