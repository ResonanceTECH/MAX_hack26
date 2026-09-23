import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { formatDate } from '@/shared/lib/format'
import { AppIcon } from './AppIcon'
import { Calendar03Icon } from './icons'

export interface DeadlineLabelProps {
  date: string
  label?: string
}

export function DeadlineLabel({ date, label = 'До' }: DeadlineLabelProps) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      <AppIcon icon={Calendar03Icon} size={16} aria-hidden />
      <Typography variant="body2" color="text.secondary">
        {label} {formatDate(date)}
      </Typography>
    </Stack>
  )
}
