import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
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

function isWideTile(reason: MatchReason): boolean {
  if (reason.type === 'industry' || reason.type === 'region' || reason.type === 'cases') return true
  return reason.description.length > 72
}

function CriterionTile({
  matched,
  label,
  description,
  wide,
}: {
  matched: boolean
  label: string
  description: string
  wide?: boolean
}) {
  const accent = matched ? '#2E7D4F' : '#C47F17'
  const tint = matched ? 'rgba(46, 125, 79, 0.08)' : 'rgba(196, 127, 23, 0.1)'

  return (
    <Box
      component="article"
      sx={{
        gridColumn: { xs: 'span 1', sm: wide ? 'span 2' : 'span 1' },
        p: 1.5,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: matched ? 'success.light' : 'warning.light',
        bgcolor: tint,
        minHeight: 88,
        transition: 'transform 160ms ease, box-shadow 160ms ease',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: 1,
        },
      }}
    >
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <AppIcon
          icon={matched ? CheckmarkCircle01Icon : AlertCircleIcon}
          size={20}
          color={accent}
          aria-hidden
        />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body2" fontWeight={700} sx={{ mb: 0.35, color: 'text.primary' }}>
            {label}
          </Typography>
          <Tooltip title={description} enterDelay={400}>
            <Typography
              variant="body2"
              color="text.secondary"
              title={description}
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.45,
              }}
            >
              {description}
            </Typography>
          </Tooltip>
        </Box>
      </Stack>
    </Box>
  )
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
  const heading = title ?? (companyName ? `Почему подходит ${companyName}` : 'Почему подходит вам')

  return (
    <Box
      component="section"
      aria-label={heading}
      sx={{
        display: 'grid',
        gap: 1.25,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          md: 'repeat(4, minmax(0, 1fr))',
        },
      }}
    >
      <Box
        sx={{
          gridColumn: '1 / -1',
          p: { xs: 2, md: 2.5 },
          borderRadius: 3,
          bgcolor: 'match.light',
          border: '1px solid',
          borderColor: 'secondary.light',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { sm: 'flex-end' },
          justifyContent: 'space-between',
          gap: 1.5,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h3" component="h2" sx={{ mb: 0.5 }}>
            {heading}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {total > 0
              ? `совпало ${matched} из ${total} параметров`
              : 'параметры совпадения'}
          </Typography>
        </Box>
        <Typography
          component="p"
          sx={{
            m: 0,
            fontSize: { xs: '2.25rem', sm: '2.75rem' },
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: '-0.03em',
            color: 'secondary.dark',
          }}
          aria-label={`${score}% соответствия`}
        >
          {score}
          <Typography
            component="span"
            sx={{ fontSize: '1.1rem', fontWeight: 700, ml: 0.25, color: 'secondary.main' }}
          >
            %
          </Typography>
        </Typography>
      </Box>

      {reasons.map((reason, index) => (
        <CriterionTile
          key={`${reason.type}-${reason.label}-${index}`}
          matched={reason.matched}
          label={reason.label}
          description={reason.description}
          wide={isWideTile(reason)}
        />
      ))}

      {missingRequirements.length > 0 ? (
        <Box
          component="article"
          sx={{
            gridColumn: {
              xs: 'span 1',
              sm: missingRequirements.length > 1 ? 'span 2' : 'span 1',
              md: missingRequirements.length > 1 ? 'span 2' : 'span 1',
            },
            p: 1.5,
            borderRadius: 2.5,
            border: '1px solid',
            borderColor: 'warning.light',
            bgcolor: 'rgba(196, 127, 23, 0.1)',
            minHeight: 88,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <AppIcon icon={AlertCircleIcon} size={20} color="#C47F17" aria-hidden />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                Не хватает
              </Typography>
              <Stack component="ul" spacing={0.35} sx={{ m: 0, pl: 2 }}>
                {missingRequirements.map((item) => (
                  <Typography
                    key={item}
                    component="li"
                    variant="body2"
                    color="text.secondary"
                  >
                    {item}
                  </Typography>
                ))}
              </Stack>
            </Box>
          </Stack>
        </Box>
      ) : null}
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
