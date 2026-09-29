import { Link as RouterLink, useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Rating from '@mui/material/Rating'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useOpportunity } from '@/entities/opportunity/api/queries'
import { useMatch } from '@/entities/match/api/queries'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { Permission } from '@/features/permissions/model/permissions'
import { useCompanyPermission } from '@/features/permissions/hooks/useCompanyPermission'
import { EntityActionsMenu } from '@/features/reports'
import { NeedsChangesBanner } from '@/features/moderation/ui/NeedsChangesBanner'
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
  BentoGrid,
  BentoTile,
  CompanyAvatar,
  DeadlineLabel,
  ErrorState,
  LoadingState,
  MatchExplanation,
  PageHeader,
  StatusChip,
  Tag,
  VerifiedBadge,
} from '@/shared/ui'
import { CheckmarkCircle01Icon, AlertCircleIcon, Location01Icon, Globe02Icon } from '@/shared/ui/icons'

export function OpportunityDetailsPage() {
  const { id = '' } = useParams()
  const sessionCompany = useSessionStore((s) => s.company)
  const companyId = sessionCompany?.id
  const canCreateProposal = useCompanyPermission(Permission.CREATE_PROPOSAL)
  const { data, isLoading, isError, refetch } = useOpportunity(id)
  const matchQuery = useMatch(id, companyId ?? '')

  if (isLoading) return <LoadingState variant="page" />
  if (isError || !data) return <ErrorState onRetry={() => void refetch()} />

  const isOwn = Boolean(companyId) && String(data.company.id) === String(companyId)
  const isExpired = data.status === 'expired'
  const isClosed = data.status === 'closed'
  const canPropose = canCreateProposal && !isOwn && !isExpired && !isClosed
  const match = matchQuery.data

  const displayCompany =
    isOwn && sessionCompany && String(sessionCompany.id) === String(data.company.id)
      ? {
          ...data.company,
          ...sessionCompany,
          name: sessionCompany.name || data.company.name,
          shortName: sessionCompany.shortName || data.company.shortName,
        }
      : data.company

  const hasRating = displayCompany.rating > 0 || displayCompany.reviewsCount > 0

  const isSameRequirement = (label: string, pool: string[]) =>
    pool.some((item) => item.toLowerCase() === label.toLowerCase())

  const requiredMatched = data.requiredRequirements.map((req) => ({
    label: req,
    matched: (match?.reasons.some(
      (r) => r.matched && r.label.toLowerCase().includes(req.toLowerCase().split(' ')[0] ?? ''),
    ) ??
      data.technologies.some((t) => req.toLowerCase().includes(t.toLowerCase()))) as boolean,
  }))

  const desiredOnly = data.desiredRequirements.filter(
    (item) => !isSameRequirement(item, data.requiredRequirements),
  )
  const techTags = [
    ...data.technologies
      .filter((t) => !isSameRequirement(t, data.requiredRequirements))
      .map((t) => ({ key: `tech:${t}`, label: t, color: 'secondary' as const })),
    ...data.skills
      .filter(
        (s) =>
          !isSameRequirement(s, data.requiredRequirements) &&
          !data.technologies.some((t) => t.toLowerCase() === s.toLowerCase()),
      )
      .map((s) => ({ key: `skill:${s}`, label: s, color: undefined })),
  ]

  return (
    <Box sx={{ pb: { xs: 12, md: 2 } }}>
      {isOwn ? <NeedsChangesBanner entityType="opportunity" entityId={data.id} /> : null}
      <PageHeader
        title={data.title}
        subtitle={`Опубликовано ${formatDate(data.createdAt)}`}
        actions={
          <Stack direction="row" spacing={0.5} alignItems="center">
            <StatusChip status={data.status} />
            {!isOwn ? (
              <EntityActionsMenu
                targetType="opportunity"
                targetId={data.id}
                targetName={data.title}
                shareTitle={data.title}
                shareText={data.description}
                favoriteType="opportunity"
              />
            ) : null}
          </Stack>
        }
      />

      <BentoGrid>
        <BentoTile span={8} variant="emphasis">
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            <CompanyAvatar
              name={displayCompany.shortName}
              logoUrl={displayCompany.logoUrl}
              size={40}
            />
            <Box>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Typography variant="body1" fontWeight={600}>
                  {displayCompany.shortName}
                </Typography>
                <VerifiedBadge verified={displayCompany.verified} compact />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {[displayCompany.region, displayCompany.industries.join(', ')]
                  .filter(Boolean)
                  .join(' · ')}
              </Typography>
            </Box>
          </Stack>
          <Typography variant="body1">{data.description}</Typography>
        </BentoTile>

        <BentoTile span={4}>
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
        </BentoTile>

        {match && !isOwn ? (
          <BentoTile span={12}>
            <MatchExplanation
              score={match.score}
              reasons={match.reasons}
              missingRequirements={match.missingRequirements}
              title="Почему подходит вам"
            />
          </BentoTile>
        ) : null}

        <BentoTile span={6}>
          <Typography variant="h3" sx={{ mb: 1 }}>
            Требования
          </Typography>
          <Typography variant="h4" sx={{ mb: 0.25 }}>
            Обязательные
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
            Без них отклик слабо подходит под запрос
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
          <Typography variant="h4" sx={{ mb: 0.25 }}>
            Желательные
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
            Плюс к обязательным: не блокируют отклик, но повышают шанс совпадения
          </Typography>
          <Stack spacing={0.75}>
            {desiredOnly.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Не указаны
              </Typography>
            ) : (
              desiredOnly.map((item) => (
                <Stack key={item} direction="row" spacing={1} alignItems="center">
                  <AppIcon icon={AlertCircleIcon} size={18} color="#C47F17" />
                  <Typography variant="body2">△ {item}</Typography>
                </Stack>
              ))
            )}
          </Stack>
        </BentoTile>

        <BentoTile span={6}>
          {techTags.length > 0 ? (
            <>
              <Typography variant="h3" sx={{ mb: 0.25 }}>
                Доп. технологии
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Не входят в обязательные требования
              </Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                {techTags.map((t) => (
                  <Tag key={t.key} label={t.label} color={t.color} />
                ))}
              </Stack>
            </>
          ) : null}

          <Typography variant="h3" sx={{ mb: 1 }}>
            {isOwn ? 'Ваша компания' : 'Компания-заказчик'}
          </Typography>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
            <CompanyAvatar name={displayCompany.shortName} logoUrl={displayCompany.logoUrl} />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="body1" fontWeight={600}>
                  {displayCompany.name}
                </Typography>
                <VerifiedBadge verified={displayCompany.verified} compact />
              </Stack>
              {hasRating ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Rating value={displayCompany.rating} readOnly size="small" precision={0.1} />
                  <Typography variant="body2" color="text.secondary">
                    {displayCompany.rating.toFixed(1)}
                    {displayCompany.reviewsCount > 0
                      ? ` · ${displayCompany.reviewsCount} отзывов`
                      : ''}
                    {displayCompany.casesCount > 0
                      ? ` · ${displayCompany.casesCount} проектов`
                      : ''}
                    {displayCompany.region ? ` · ${displayCompany.region}` : ''}
                  </Typography>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Пока нет оценок
                  {displayCompany.casesCount > 0
                    ? ` · ${displayCompany.casesCount} проектов`
                    : ''}
                  {displayCompany.region ? ` · ${displayCompany.region}` : ''}
                </Typography>
              )}
              {displayCompany.website ? (
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                  <AppIcon icon={Globe02Icon} size={16} aria-hidden />
                  <Typography
                    component="a"
                    href={displayCompany.website}
                    target="_blank"
                    rel="noreferrer"
                    variant="body2"
                    color="secondary"
                  >
                    {displayCompany.website.replace(/^https?:\/\//, '')}
                  </Typography>
                </Stack>
              ) : null}
            </Box>
          </Stack>
          <AppButton
            component={RouterLink}
            to={isOwn ? ROUTES.PROFILE_COMPANY : companyDetailsPath(displayCompany.id)}
            variant="outlined"
            size="small"
          >
            {isOwn ? 'К профилю компании' : 'Посмотреть компанию'}
          </AppButton>
        </BentoTile>

        <BentoTile
          span={12}
          sx={{
            position: { xs: 'fixed', md: 'static' },
            left: 0,
            right: 0,
            bottom: { xs: 'calc(64px + env(safe-area-inset-bottom))', md: 'auto' },
            borderRadius: { xs: 0, md: 1 },
            zIndex: 10,
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            flexWrap="wrap"
            useFlexGap
          >
            {isOwn ? (
              <>
                <AppButton
                  component={RouterLink}
                  to={opportunityProposalsPath(data.id)}
                  variant="contained"
                  sx={{
                    width: { xs: '100%', sm: 'auto' },
                    flex: { sm: '1 1 auto' },
                    whiteSpace: 'nowrap',
                  }}
                >
                  Управлять запросом
                </AppButton>
                <AppButton
                  component={RouterLink}
                  to={opportunityProposalsPath(data.id)}
                  variant="outlined"
                  sx={{
                    width: { xs: '100%', sm: 'auto' },
                    flex: { sm: '1 1 auto' },
                    whiteSpace: 'nowrap',
                  }}
                >
                  Предложения ({data.proposalsCount})
                </AppButton>
                <AppButton
                  component={RouterLink}
                  to={opportunityComparePath(data.id)}
                  variant="outlined"
                  sx={{
                    width: { xs: '100%', sm: 'auto' },
                    flex: { sm: '1 1 auto' },
                    whiteSpace: 'nowrap',
                  }}
                >
                  Сравнить
                </AppButton>
              </>
            ) : canPropose ? (
              <AppButton
                component={RouterLink}
                to={opportunityProposePath(data.id)}
                variant="contained"
                sx={{ width: { xs: '100%', sm: 'auto' }, flex: { sm: '1 1 auto' } }}
              >
                Предложить решение
              </AppButton>
            ) : (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: 'action.hover',
                  width: { xs: '100%', sm: 'auto' },
                  flex: { sm: '1 1 auto' },
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
              sx={{
                display: { xs: 'none', md: 'inline-flex' },
                flexShrink: 0,
                whiteSpace: 'nowrap',
                ml: { md: 'auto' },
              }}
            >
              К витрине
            </AppButton>
          </Stack>
        </BentoTile>
      </BentoGrid>
    </Box>
  )
}
