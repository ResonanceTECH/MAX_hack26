import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'
import { getQueueAgeHours } from '../model/businessRules'
import { formatRelativeDate } from '@/shared/lib/format'

export function QueueAgeLabel({ submittedAt }: { submittedAt: string }) {
  const hours = getQueueAgeHours(submittedAt)
  const warn = hours >= 12
  return (
    <Typography
      variant="body2"
      color={warn ? 'warning.main' : 'text.secondary'}
      component="span"
      aria-label={`Время в очереди: ${formatRelativeDate(submittedAt)}`}
    >
      Время в очереди: {formatRelativeDate(submittedAt)}
      {warn ? ' · долгое ожидание' : ''}
    </Typography>
  )
}

export function LongWaitAlert({ submittedAt }: { submittedAt: string }) {
  if (getQueueAgeHours(submittedAt) < 12) return null
  return (
    <Alert severity="warning" sx={{ mb: 2 }}>
      Объект долго ждёт проверки ({formatRelativeDate(submittedAt)}).
    </Alert>
  )
}
