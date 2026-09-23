import { Link as RouterLink } from 'react-router-dom'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import Rating from '@mui/material/Rating'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { Company } from '@/entities/company'
import type { Match } from '@/entities/match'
import { companyDetailsPath } from '@/shared/constants/routes'
import { formatCurrency, pluralRu } from '@/shared/lib/format'
import {
  AppButton,
  CompanyAvatar,
  FavoriteButton,
  MatchScore,
  Tag,
  VerifiedBadge,
} from '@/shared/ui'

export interface CompanyCardProps {
  company: Company
  match?: Match | null
  opportunityId?: string
}

export function CompanyCard({ company, match, opportunityId }: CompanyCardProps) {
  const detailsTo = opportunityId
    ? `${companyDetailsPath(company.id)}?fromOpportunity=${opportunityId}`
    : companyDetailsPath(company.id)

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1 }}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CompanyAvatar name={company.shortName} logoUrl={company.logoUrl} />
            <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Typography variant="h3" noWrap>
                  {company.shortName}
                </Typography>
                <VerifiedBadge verified={company.verified} compact />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {company.region}
              </Typography>
            </Stack>
            <FavoriteButton type="company" targetId={company.id} size="small" />
            {match ? (
              <MatchScore
                score={match.score}
                companyName={company.shortName}
                reasons={match.reasons}
                missingRequirements={match.missingRequirements}
              />
            ) : null}
          </Stack>

          {match ? (
            <Typography variant="body2" fontWeight={600} color="secondary.dark">
              {match.score}% подходит под ваш запрос
            </Typography>
          ) : null}

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {company.description}
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center">
            <Rating value={company.rating} precision={0.1} readOnly size="small" />
            <Typography variant="body2" color="text.secondary">
              {company.rating.toFixed(1)} · {company.reviewsCount} отзывов · {company.casesCount}{' '}
              {pluralRu(company.casesCount, 'проект', 'проекта', 'проектов')}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {company.industries.slice(0, 2).map((i) => (
              <Tag key={i} label={i} />
            ))}
            {company.services.slice(0, 2).map((s) => (
              <Tag key={s} label={s} />
            ))}
            {company.technologies.slice(0, 3).map((t) => (
              <Tag key={t} label={t} color="secondary" />
            ))}
          </Stack>

          {company.priceFrom != null ? (
            <Typography variant="body2" fontWeight={600}>
              от {formatCurrency(company.priceFrom)}
            </Typography>
          ) : null}
        </Stack>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2 }}>
        <AppButton component={RouterLink} to={detailsTo} variant="contained" fullWidth>
          Подробнее
        </AppButton>
      </CardActions>
    </Card>
  )
}
