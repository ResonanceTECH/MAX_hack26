import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { CompanyActivityEvent } from '@/entities/company-activity'
import { formatDate, formatRelativeDate } from '@/shared/lib/format'

export interface CompanyActivityItemProps {
  event: CompanyActivityEvent
  dense?: boolean
}

export function CompanyActivityItem({ event, dense }: CompanyActivityItemProps) {
  return (
    <Box
      sx={{
        py: dense ? 1 : 1.25,
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:last-child': { borderBottom: 'none' },
      }}
    >
      <Typography variant="body2">
        <Box component="span" fontWeight={600}>
          {event.actorName}
        </Box>{' '}
        {event.action}
        {event.entityLabel ? (
          <>
            {' '}
            <Box component="span" color="text.secondary">
              «{event.entityLabel}»
            </Box>
          </>
        ) : null}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {formatRelativeDate(event.createdAt)} · {formatDate(event.createdAt)}
      </Typography>
    </Box>
  )
}
