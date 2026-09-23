import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'

export interface SectionHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="flex-start"
      spacing={2}
      sx={{ mb: 2 }}
    >
      <Box>
        <Typography variant="h2" component="h2">
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {action}
    </Stack>
  )
}
