import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid2'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value == null) return null
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return { value }
}

function stringify(v: unknown): string {
  if (v == null) return '—'
  if (typeof v === 'string') return v
  try {
    return JSON.stringify(v, null, 2)
  } catch {
    return String(v)
  }
}

export function AuditDiffViewer({
  before,
  after,
  previousValue,
  newValue,
}: {
  before?: unknown
  after?: unknown
  previousValue?: unknown
  newValue?: unknown
}) {
  const beforeObj = asRecord(before ?? previousValue)
  const afterObj = asRecord(after ?? newValue)

  if (!beforeObj && !afterObj) return null

  const keys = Array.from(
    new Set([...Object.keys(beforeObj ?? {}), ...Object.keys(afterObj ?? {})]),
  )

  if (keys.length === 0) return null

  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
        До / после
      </Typography>
      {keys.map((key) => (
        <Paper key={key} variant="outlined" sx={{ p: 1.25, mb: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
            {key}
          </Typography>
          <Grid container spacing={1}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">
                До
              </Typography>
              <Typography
                variant="body2"
                sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
              >
                {stringify(beforeObj?.[key])}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">
                После
              </Typography>
              <Typography
                variant="body2"
                sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
              >
                {stringify(afterObj?.[key])}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      ))}
    </Box>
  )
}
