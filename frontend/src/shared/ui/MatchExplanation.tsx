import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { Match, MatchReason } from '@/entities/match'
import { AppIcon } from './AppIcon'
import { AlertCircleIcon, CheckmarkCircle01Icon } from './icons'

export interface MatchExplanationProps {
  score: number
  companyName?: string
  reasons?: MatchReason[]
  missingRequirements?: string[]
  title?: string
}

export function MatchExplanation({
  score,
  companyName,
  reasons = [],
  missingRequirements = [],
  title,
}: MatchExplanationProps) {
  const matched = reasons.filter((r) => r.matched).length
  const total = reasons.length + missingRequirements.length

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: 'match.light',
        border: '1px solid',
        borderColor: 'secondary.light',
      }}
    >
      <Typography variant="h3" sx={{ mb: 0.5 }}>
        {title ?? (companyName ? `Почему подходит ${companyName}` : 'Почему подходит вам')}
      </Typography>
      <Typography variant="body1" fontWeight={700} color="secondary.dark" sx={{ mb: 1.5 }}>
        {score}% соответствия
        {total > 0 ? ` · совпало ${matched} из ${total || matched} параметров` : ''}
      </Typography>
      <Stack spacing={1}>
        {reasons.map((reason) => (
          <Stack key={reason.label} direction="row" spacing={1} alignItems="flex-start">
            <AppIcon
              icon={reason.matched ? CheckmarkCircle01Icon : AlertCircleIcon}
              size={18}
              color={reason.matched ? '#2E7D4F' : '#C47F17'}
              aria-hidden
            />
            <Box>
              <Typography variant="body2" fontWeight={600}>
                {reason.matched ? '✓' : '△'} {reason.label}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {reason.description}
              </Typography>
            </Box>
          </Stack>
        ))}
        {missingRequirements.map((item) => (
          <Stack key={item} direction="row" spacing={1} alignItems="flex-start">
            <AppIcon icon={AlertCircleIcon} size={18} color="#C47F17" aria-hidden />
            <Typography variant="body2">△ {item}</Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  )
}

export function MatchExplanationFromMatch({
  match,
  companyName,
}: {
  match: Match
  companyName?: string
}) {
  return (
    <MatchExplanation
      score={match.score}
      companyName={companyName}
      reasons={match.reasons}
      missingRequirements={match.missingRequirements}
    />
  )
}
