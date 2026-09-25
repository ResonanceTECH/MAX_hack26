import Box from '@mui/material/Box'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { ProfileCompletionResult } from '../model/businessRules'

export interface ProfileCompletionProps {
  completion: ProfileCompletionResult
  compact?: boolean
}

export function ProfileCompletion({ completion, compact }: ProfileCompletionProps) {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 0.75 }}>
        <Typography variant="body2" fontWeight={600}>
          Заполненность профиля
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {completion.percent}%
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={completion.percent}
        aria-label={`Заполненность профиля ${completion.percent} процентов`}
        sx={{ height: 8, borderRadius: 1, mb: compact ? 0 : 1.5 }}
      />
      {!compact && completion.missing.length > 0 ? (
        <Typography variant="caption" color="text.secondary">
          Не хватает: {completion.missing.slice(0, 4).join(', ')}
          {completion.missing.length > 4 ? '…' : ''}
        </Typography>
      ) : null}
    </Box>
  )
}
