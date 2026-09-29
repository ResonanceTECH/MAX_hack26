import { Link as RouterLink } from 'react-router-dom'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import Rating from '@mui/material/Rating'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { Match } from '@/entities/match'
import type { Proposal } from '@/entities/proposal'
import { proposalDetailsPath } from '@/shared/constants/routes'
import { pluralRu } from '@/shared/lib/format'
import {
  AppButton,
  MatchScore,
  MoneyValue,
  StatusChip,
  VerifiedBadge,
} from '@/shared/ui'

export interface ProposalCardProps {
  proposal: Proposal
  match?: Match | null
  onShortlist?: (id: string) => void | Promise<void>
  onReject?: (id: string) => void | Promise<void>
  compact?: boolean
}

export function ProposalCard({
  proposal,
  match,
  onShortlist,
  onReject,
  compact,
}: ProposalCardProps) {
  return (
    <Card>
      <CardContent>
        <Stack spacing={1.25}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
            <Stack spacing={0.5}>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Typography variant="h3">{proposal.company.shortName}</Typography>
                <VerifiedBadge verified={proposal.company.verified} compact />
              </Stack>
              <StatusChip status={proposal.status} kind="proposal" />
            </Stack>
            {match ? (
              <MatchScore
                score={match.score}
                companyName={proposal.company.shortName}
                reasons={match.reasons}
                missingRequirements={match.missingRequirements}
              />
            ) : null}
          </Stack>

          <Stack direction="row" spacing={2} alignItems="baseline">
            <MoneyValue amount={proposal.price} currency={proposal.currency} />
            <Typography variant="body2" color="text.secondary">
              {proposal.durationDays} дн.
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Rating value={proposal.company.rating} precision={0.1} readOnly size="small" />
            <Typography variant="body2" color="text.secondary">
              {proposal.company.rating.toFixed(1)} · {proposal.company.casesCount}{' '}
              {pluralRu(
                proposal.company.casesCount,
                'похожий кейс',
                'похожих кейса',
                'похожих кейсов',
              )}
            </Typography>
          </Stack>

          {!compact ? (
            <Typography variant="body2" color="text.secondary">
              {proposal.description}
            </Typography>
          ) : null}
        </Stack>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2, gap: 1, flexWrap: 'wrap' }}>
        <AppButton
          component={RouterLink}
          to={proposalDetailsPath(proposal.id)}
          variant="outlined"
          size="small"
        >
          Подробнее
        </AppButton>
        {onShortlist ? (
          <AppButton
            variant="contained"
            size="small"
            onClick={() => onShortlist(proposal.id)}
          >
            В шортлист
          </AppButton>
        ) : null}
        {onReject ? (
          <AppButton
            variant="text"
            color="error"
            size="small"
            onClick={() => onReject(proposal.id)}
          >
            Отклонить
          </AppButton>
        ) : null}
      </CardActions>
    </Card>
  )
}
