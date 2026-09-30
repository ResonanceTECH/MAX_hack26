import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'

export interface SectionProps {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  /** Drop outer margin when section sits inside a bento tile. */
  disableGutter?: boolean
  /** Tighten header→body gap (useful inside compact tiles). */
  dense?: boolean
}

export function Section({
  title,
  subtitle,
  action,
  children,
  disableGutter,
  dense,
}: SectionProps) {
  return (
    <Box component="section" sx={{ mb: disableGutter ? 0 : 4, height: '100%' }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        spacing={2}
        sx={{ mb: dense ? 1.25 : 2 }}
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
