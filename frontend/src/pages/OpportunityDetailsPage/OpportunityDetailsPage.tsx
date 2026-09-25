import { Link as RouterLink, useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Rating from '@mui/material/Rating'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useOpportunity } from '@/entities/opportunity/api/queries'
import { useMatch } from '@/entities/match/api/queries'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import {
  companyDetailsPath,
  opportunityProposePath,
  opportunityProposalsPath,
  opportunityComparePath,
  ROUTES,
} from '@/shared/constants/routes'
import { formatBudgetRange, formatDate } from '@/shared/lib/format'
import {
  AppButton,
  AppIcon,
  CompanyAvatar,
  DeadlineLabel,
  ErrorState,
  FavoriteButton,
  LoadingState,
  MatchExplanation,
  PageHeader,
  ShareButton,
  StatusChip,
  Tag,
  VerifiedBadge,
} from '@/shared/ui'
import { CheckmarkCircle01Icon, AlertCircleIcon, Location01Icon } from '@/shared/ui/icons'

export function OpportunityDetailsPage() {
  const { id = '' } = useParams()
  const companyId = useSessionStore((s) => s.company?.id)
  const { data, isLoading, isError, refetch } = useOpportunity(id)
  const matchQuery = useMatch(id, companyId ?? '')

  if (isLoading) return <LoadingState variant="page" />
  if (isError || !data) return <ErrorState onRetry={() => void refetch()} />

  const isOwn = data.company.id === companyId
  const isExpired = data.status === 'expired'
  const isClosed = data.status === 'closed'
  const canPropose = !isOwn && !isExpired && !isClosed
  const match = matchQuery.data

  const requiredMatched = data.requiredRequirements.map((req) => ({
    label: req,
    matched: (match?.reasons.some(
      (r) => r.matched && r.label.toLowerCase().includes(req.toLowerCase().split(' ')[0] ?? ''),
    ) ??
      data.technologies.some((t) => req.toLowerCase().includes(t.toLowerCase()))) as boolean,
  }))

  return (
    <Box sx={{ pb: { xs: 12, md: 2 } }}>
      <PageHeader
        title={data.title}
        subtitle={`Опубликовано ${formatDate(data.createdAt)}`}
        actions={
          <Stack direction="row" spacing={0.5} alignItems="center">
            <StatusChip status={data.status} />
            <FavoriteButton type="opportunity" targetId={data.id} />
            <ShareButton title={data.title} text={data.description} />
          </Stack>
        }
      />

      <Stack spacing={2} sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CompanyAvatar name={data.company.shortName} logoUrl={data.company.logoUrl} size={40} />
          <Box>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Typography variant="body1" fontWeight={600}>
                {data.company.shortName}
              </Typography>
              <VerifiedBadge verified={data.company.verified} compact />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {data.company.region} · {data.company.industries.join(', ')}
            </Typography>
          </Box>
        </Stack>

        {match && !isOwn ? (
          <MatchExplanation
            score={match.score}
            reasons={match.reasons}
            missingRequirements={match.missingRequirements}
            title="Почему подходит вам"
          />
        ) : null}

        <Typography variant="body1">{data.description}</Typography>

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="h3" sx={{ mb: 1.5 }}>
            Основная информация
          </Typography>
          <Stack spacing={1}>
            <Typography variant="body2">
              <strong>Бюджет:</strong>{' '}
              {formatBudgetRange(data.budgetMin, data.budgetMax, data.currency)}
            </Typography>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <AppIcon icon={Location01Icon} size={16} aria-hidden />
              <Typography variant="body2">{data.region}</Typography>
            </Stack>
            <Typography variant="body2">
              <strong>Срок выполнения:</strong>{' '}
              {data.executionDeadline ? formatDate(data.executionDeadline) : 'не указан'}
            </Typography>
            <DeadlineLabel date={data.proposalDeadline} label="Дедлайн отклика" />
            <Typography variant="body2">
              <strong>Формат:</strong> {data.remoteAllowed ? 'Удалённо / гибрид' : 'На месте'}
            </Typography>
            <Typography variant="body2">
              <strong>Категория:</strong> {data.category}
              {data.subcategory ? ` / ${data.subcategory}` : ''}
            </Typography>
            <Typography variant="body2">
              <strong>Отрасль:</strong> {data.industries.join(', ')}
            </Typography>
          </Stack>
        </Box>

        <Box>
          <Typography variant="h3" sx={{ mb: 1 }}>
            Требования
          </Typography>
          <Typography variant="h4" sx={{ mb: 0.75 }}>
            Обязательные
          </Typography>
          <Stack spacing={0.75} sx={{ mb: 2 }}>
            {(requiredMatched.length
              ? requiredMatched
              : data.requiredRequirements.map((r) => ({ label: r, matched: true }))
            ).map((item) => (
              <Stack key={item.label} direction="row" spacing={1} alignItems="center">
                <AppIcon
                  icon={item.matched ? CheckmarkCircle01Icon : AlertCircleIcon}
                  size={18}
                  color={item.matched ? '#2E7D4F' : '#C47F17'}
                />
                <Typography variant="body2">
                  {item.matched ? '✓' : '△'} {item.label}
                </Typography>
              </Stack>
            ))}
          </Stack>
          <Typography variant="h4" sx={{ mb: 0.75 }}>
            Желательные
          </Typography>
          <Stack spacing={0.75}>
            {data.desiredRequirements.map((item) => (
              <Stack key={item} direction="row" spacing={1} alignItems="center">
                <AppIcon icon={AlertCircleIcon} size={18} color="#C47F17" />
                <Typography variant="body2">△ {item}</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>

        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          {data.technologies.map((t) => (
            <Tag key={t} label={t} color="secondary" />
          ))}
          {data.skills.map((s) => (
            <Tag key={s} label={s} />
          ))}
        </Stack>

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h3" sx={{ mb: 1 }}>
            Компания-заказчик
          </Typography>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
            <CompanyAvatar name={data.company.shortName} logoUrl={data.company.logoUrl} />
            <Box>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Typography variant="body1" fontWeight={600}>
                  {data.company.name}
                </Typography>
                <VerifiedBadge verified={data.company.verified} compact />
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Rating value={data.company.rating} readOnly size="small" precision={0.1} />
                <Typography variant="body2" color="text.secondary">
                  {data.company.rating.toFixed(1)} · {data.company.casesCount} проектов ·{' '}
                  {data.company.region}
                </Typography>
              </Stack>
            </Box>
          </Stack>
          <AppButton
            component={RouterLink}
            to={companyDetailsPath(data.company.id)}
            variant="outlined"
            size="small"
          >
            Посмотреть компанию
          </AppButton>
        </Box>
      </Stack>

      <Box
        sx={{
          position: { xs: 'fixed', md: 'static' },
          left: 0,
          right: 0,
          bottom: { xs: 'calc(64px + env(safe-area-inset-bottom))', md: 'auto' },
          p: { xs: 2, md: 0 },
          bgcolor: { xs: 'background.paper', md: 'transparent' },
          borderTop: { xs: '1px solid', md: 'none' },
          borderColor: 'divider',
          zIndex: 10,
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          {isOwn ? (
            <>
              <AppButton
                component={RouterLink}
                to={opportunityProposalsPath(data.id)}
                variant="contained"
                fullWidth
              >
                Управлять запросом
              </AppButton>
              <AppButton
                component={RouterLink}
                to={opportunityProposalsPath(data.id)}
                variant="outlined"
                fullWidth
              >
                Предложения ({data.proposalsCount})
              </AppButton>
              <AppButton
                component={RouterLink}
                to={opportunityComparePath(data.id)}
                variant="outlined"
                fullWidth
              >
                Сравнить
              </AppButton>
            </>
          ) : canPropose ? (
            <AppButton
              component={RouterLink}
              to={opportunityProposePath(data.id)}
              variant="contained"
              fullWidth
            >
              Предложить решение
            </AppButton>
          ) : (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'action.hover',
                width: '100%',
              }}
            >
              <Typography variant="body2" fontWeight={600}>
                {isExpired
                  ? 'Приём предложений завершён'
                  : isClosed
                    ? 'Запрос закрыт'
                    : 'Отклик недоступен'}
              </Typography>
            </Box>
          )}
          <AppButton
            component={RouterLink}
            to={ROUTES.OPPORTUNITIES}
            variant="text"
            sx={{ display: { xs: 'none', md: 'inline-flex' } }}
          >
            К витрине
          </AppButton>
        </Stack>
      </Box>
    </Box>
  )
}
