import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'

export interface SectionProps {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
}

export function Section({ title, subtitle, action, children }: SectionProps) {
  return (
    <Box component="section" sx={{ mb: 4 }}>
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
      {children}
    </Box>
  )
}
