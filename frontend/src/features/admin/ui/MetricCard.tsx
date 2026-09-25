import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { PeriodDelta } from '@/shared/mocks/analytics'

function formatDelta(delta?: PeriodDelta | null): { text: string; color: string } | null {
  if (!delta) return null
  const sign = delta.changePercent > 0 ? '+' : ''
  const color =
    delta.changePercent > 0
      ? 'success.main'
      : delta.changePercent < 0
        ? 'error.main'
        : 'text.secondary'
  return {
    text: `${sign}${delta.changePercent}% к пред. периоду`,
    color,
  }
}

export function MetricCard({
  label,
  value,
  delta,
  hint,
}: {
  label: string
  value: string | number
  delta?: PeriodDelta | null
  hint?: string
}) {
  const d = formatDelta(delta)
  return (
    <Card variant="outlined" sx={{ height: '100%', minHeight: 88 }}>
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h2" sx={{ mt: 0.5, fontSize: { xs: '1.5rem', md: '1.75rem' } }}>
          {value}
        </Typography>
        <Stack spacing={0.25} sx={{ mt: 0.5 }}>
          {d ? (
            <Typography variant="caption" sx={{ color: d.color }}>
              {d.text}
            </Typography>
          ) : null}
          {hint ? (
            <Typography variant="caption" color="text.secondary">
              {hint}
            </Typography>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  )
}
