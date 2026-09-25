import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import type { ModerationPayloadValue } from '@/entities/moderation'

export function DiffViewer({
  before,
  after,
}: {
  before: Record<string, ModerationPayloadValue> | null
  after: Record<string, ModerationPayloadValue> | null
}) {
  if (!before || !after) return null
  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]))
  const changed = keys.filter((k) => String(before[k] ?? '') !== String(after[k] ?? ''))
  if (!changed.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        Изменений в ключевых полях не зафиксировано.
      </Typography>
    )
  }
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1.5 }}>
        Что изменилось
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Повторная проверка · сравнение до / после
      </Typography>
      {changed.map((key) => (
        <Paper key={key} variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {key}
          </Typography>
          <Grid container spacing={1.5}>
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary">
                До
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {String(before[key] ?? '—')}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary">
                После
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {String(after[key] ?? '—')}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      ))}
    </Box>
  )
}
