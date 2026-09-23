import { Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { Match } from '@/entities/match'
import type { Opportunity } from '@/entities/opportunity'
import { opportunityDetailsPath } from '@/shared/constants/routes'
import { formatBudgetRange, pluralRu } from '@/shared/lib/format'
import {
  AppButton,
  DeadlineLabel,
  FavoriteButton,
  MatchScore,
  StatusChip,
  Tag,
  VerifiedBadge,
} from '@/shared/ui'

export interface OpportunityCardProps {
  opportunity: Opportunity
  match?: Match | null
  onDismiss?: () => void
}

export function OpportunityCard({ opportunity, match, onDismiss }: OpportunityCardProps) {
  const topReasons = (match?.reasons ?? []).filter((r) => r.matched).slice(0, 3)

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1 }}>
        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
            {match ? (
              <MatchScore
                score={match.score}
                companyName={opportunity.company.shortName}
                reasons={match.reasons}
                missingRequirements={match.missingRequirements}
                variant="full"
              />
            ) : (
              <Box />
            )}
            <Stack direction="row" spacing={0.5} alignItems="center">
              <StatusChip status={opportunity.status} />
              <FavoriteButton type="opportunity" targetId={opportunity.id} size="small" />
            </Stack>
          </Stack>

          <Typography variant="h3" component="h3">
            {opportunity.title}
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="body2" color="text.secondary">
              {opportunity.company.shortName}
            </Typography>
            <VerifiedBadge verified={opportunity.company.verified} compact />
          </Stack>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {opportunity.description}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {opportunity.category} · {opportunity.industries.join(', ')}
          </Typography>

          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {opportunity.technologies.slice(0, 4).map((tech) => (
              <Tag key={tech} label={tech} />
            ))}
            {opportunity.industries.slice(0, 2).map((ind) => (
              <Tag key={ind} label={ind} color="secondary" />
            ))}
          </Stack>

          <Box>
            <Typography variant="body2" fontWeight={600}>
              {formatBudgetRange(
                opportunity.budgetMin,
                opportunity.budgetMax,
                opportunity.currency,
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {opportunity.region}
              {opportunity.remoteAllowed ? ' · удалённо' : ''}
            </Typography>
            <DeadlineLabel date={opportunity.proposalDeadline} label="Приём предложений до" />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {opportunity.proposalsCount}{' '}
              {pluralRu(opportunity.proposalsCount, 'предложение', 'предложения', 'предложений')}
              {opportunity.newProposalsCount
                ? ` · ${opportunity.newProposalsCount} новых`
                : ''}
            </Typography>
          </Box>

          {topReasons.length > 0 ? (
            <Box>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                Почему подходит:
              </Typography>
              <Stack spacing={0.25}>
                {topReasons.map((r) => (
                  <Typography key={r.label} variant="body2" color="text.secondary">
                    ✓ {r.label}
                  </Typography>
                ))}
              </Stack>
            </Box>
          ) : null}
        </Stack>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2, gap: 1, flexWrap: 'wrap' }}>
        <AppButton
          component={RouterLink}
          to={opportunityDetailsPath(opportunity.id)}
          variant="contained"
          fullWidth
        >
          Подробнее
        </AppButton>
        {onDismiss ? (
          <AppButton variant="text" color="inherit" onClick={onDismiss}>
            Не интересно
          </AppButton>
        ) : null}
      </CardActions>
    </Card>
  )
}
