import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { Match } from '@/entities/match'
import { getCompanyById } from '@/shared/mocks'
import { MatchScore } from '@/shared/ui'

export interface MatchCardProps {
  match: Match
}

export function MatchCard({ match }: MatchCardProps) {
  const company = getCompanyById(match.companyId)

  return (
    <Card>
      <CardContent>
        <Stack spacing={1.25}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h3">{company?.shortName ?? match.companyId}</Typography>
            <MatchScore
              score={match.score}
              companyName={company?.shortName}
              reasons={match.reasons}
              missingRequirements={match.missingRequirements}
            />
          </Stack>
          <Stack spacing={0.25}>
            {match.reasons
              .filter((r) => r.matched)
              .slice(0, 3)
              .map((r) => (
                <Typography key={r.label} variant="body2" color="text.secondary">
                  ✓ {r.label}
                </Typography>
              ))}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}
