import { useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { useMyOpportunities, useRecommendedOpportunities } from '@/entities/opportunity/api/queries'
import { useMyProposals } from '@/entities/proposal/api/queries'
import { useDeals } from '@/entities/deal/api/queries'
import { useAllMatches } from '@/entities/match/api/queries'
import { useShortlist } from '@/entities/shortlist/api/queries'
import { Permission } from '@/features/permissions/model/permissions'
import { useCompanyPermission } from '@/features/permissions/hooks/useCompanyPermission'
import { useDismissedRecommendationsStore } from '@/features/recommendations/model/dismissedStore'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { isReal } from '@/shared/api/apiCapabilities'
import {
  opportunityComparePath,
  opportunityProposalsPath,
  ROUTES,
} from '@/shared/constants/routes'
import {
  AppButton,
  AppIcon,
  AppInput,
  EmptyState,
  ErrorState,
  LoadingState,
  Section,
  StatusChip,
} from '@/shared/ui'
import {
  AddCircleIcon,
  Briefcase02Icon,
  Building02Icon,
  Layers01Icon,
  Search01Icon,
} from '@/shared/ui/icons'
import { OpportunityCard } from '@/widgets/OpportunityCard/OpportunityCard'
import { ProposalCard } from '@/widgets/ProposalCard/ProposalCard'

const QUICK_ACTIONS = [
  {
    label: 'Найти исполнителя',
    to: ROUTES.COMPANIES,
    icon: Building02Icon,
  },
  {
    label: 'Найти поставщика',
    to: `${ROUTES.COMPANIES}?focus=supply`,
    icon: Layers01Icon,
  },
  {
    label: 'Найти заказ',
    to: ROUTES.OPPORTUNITIES,
    icon: Briefcase02Icon,
  },
  {
    label: 'Создать запрос',
    to: ROUTES.OPPORTUNITY_CREATE,
    icon: AddCircleIcon,
  },
]

export function HomePage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const dismissedIds = useDismissedRecommendationsStore((s) => s.ids)
  const dismiss = useDismissedRecommendationsStore((s) => s.dismiss)
  const restore = useDismissedRecommendationsStore((s) => s.restore)
  const showInfo = useSnackbarStore((s) => s.showInfo)
  const companyId = useSessionStore((s) => s.company?.id)
  const canCreateOpportunity = useCompanyPermission(Permission.CREATE_OPPORTUNITY)
  const recommended = useRecommendedOpportunities(companyId)
  const mineQuery = useMyOpportunities(companyId)
  const proposalsQuery = useMyProposals(companyId)
  const dealsQuery = useDeals()
  const matchesQuery = useAllMatches()
  const shortlistQuery = useShortlist()

  const quickActions = useMemo(
    () =>
      QUICK_ACTIONS.filter(
        (a) => a.to !== ROUTES.OPPORTUNITY_CREATE || canCreateOpportunity,
      ),
    [canCreateOpportunity],
  )

  const forYou = useMemo(() => {
    const items = recommended.data ?? []
    const matches = matchesQuery.data ?? []
    const realMode = isReal('matching') || isReal('opportunities')

    const rows = items
      .filter((opp) => opp.company.id !== companyId && !dismissedIds.includes(opp.id))
      .map((opp) => {
        const match = matches.find((m) => {
          if (m.opportunityId !== opp.id) return false
          // Feed matches may omit/zero company_id — treat as current company in real mode
          if (realMode) {
            return !m.companyId || m.companyId === '0' || m.companyId === companyId
          }
          return m.companyId === companyId
        })

        if (realMode) {
          if (!match) return null
          return { opportunity: opp, match }
        }

        return {
          opportunity: opp,
          match: match ?? {
            id: `synth-${opp.id}`,
            opportunityId: opp.id,
            companyId: companyId ?? '',
            score: 88 + (opp.title.length % 10),
            reasons: [
              {
                label: 'Подходит отрасль',
                type: 'industry' as const,
                matched: true,
                description: 'Отрасль совпадает с профилем компании',
              },
              {
                label: 'Совпадает стек',
                type: 'technology' as const,
                matched: true,
                description: 'Есть пересечение по технологиям',
              },
              {
                label: 'Бюджет соответствует',
                type: 'budget' as const,
                matched: true,
                description: 'Бюджет в диапазоне проектов компании',
              },
            ],
            missingRequirements: [],
            status: 'suggested' as const,
          },
        }
      })
      .filter((row): row is NonNullable<typeof row> => row != null)

    return rows.slice(0, 3)
  }, [recommended.data, companyId, dismissedIds, matchesQuery.data])

  const myActive = (mineQuery.data ?? [])
    .filter((o) =>
      ['published', 'collecting_proposals', 'shortlisting', 'negotiation'].includes(o.status),
    )
    .slice(0, 3)

  const isLoading =
    recommended.isLoading ||
    mineQuery.isLoading ||
    proposalsQuery.isLoading ||
    ((isReal('matching') || isReal('opportunities')) && matchesQuery.isLoading)
  const isError = recommended.isError || mineQuery.isError || proposalsQuery.isError

  if (isLoading) return <LoadingState variant="page" rows={4} />
  if (isError) {
    return (
      <ErrorState
        onRetry={() => {
          void recommended.refetch()
          void mineQuery.refetch()
          void proposalsQuery.refetch()
        }}
      />
    )
  }

  return (
    <Box>
      <Typography variant="h1" component="h1" sx={{ mb: 0.5 }}>
        Что нужно вашему бизнесу?
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Найдите исполнителя, поставщика или подходящий заказ.
      </Typography>

      <Stack spacing={1.5} sx={{ mb: 2 }}>
        <AppInput
          label="Опишите задачу своими словами"
          placeholder="Например, нужен подрядчик на разработку CRM для сети клиник"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <AppButton
          component={RouterLink}
          to={
            query
              ? `${ROUTES.OPPORTUNITIES}?q=${encodeURIComponent(query)}`
              : ROUTES.OPPORTUNITIES
          }
          variant="contained"
          size="large"
          startIcon={<AppIcon icon={Search01Icon} size={18} />}
        >
          Найти
        </AppButton>
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 4 }}>
        {quickActions.map((action) => (
          <Chip
            key={action.label}
            component={RouterLink}
            to={action.to}
            clickable
            icon={<AppIcon icon={action.icon} size={16} />}
            label={action.label}
            variant="outlined"
            sx={{ borderRadius: 2, textDecoration: 'none', height: 40, px: 0.5 }}
          />
        ))}
      </Stack>

      <Section
        title="Для вас"
        subtitle="Возможности, которые подходят вашей компании."
        action={
          <AppButton component={RouterLink} to={ROUTES.OPPORTUNITIES} size="small">
            Все
          </AppButton>
        }
      >
        {forYou.length === 0 ? (
          <EmptyState
            title="Пока нет подходящих заказов"
            description="Попробуйте изменить фильтры или дополнить профиль компании."
          />
        ) : (
          <Stack spacing={2}>
            {forYou.map(({ opportunity, match }) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                match={match}
                onDismiss={() => {
                  dismiss(opportunity.id)
                  showInfo('Рекомендация скрыта', {
                    actionLabel: 'Отменить',
                    onAction: () => restore(opportunity.id),
                  })
                }}
              />
            ))}
          </Stack>
        )}
      </Section>

      <Section
        title="Ваши запросы"
        action={
          <AppButton component={RouterLink} to={ROUTES.MY_REQUESTS} size="small">
            Все запросы
          </AppButton>
        }
      >
        {myActive.length === 0 ? (
          <EmptyState
            title="У вас пока нет запросов"
            description="Создайте первый запрос — и начните собирать предложения."
            actionLabel={canCreateOpportunity ? 'Создать' : undefined}
            onAction={
              canCreateOpportunity
                ? () => {
                    void navigate(ROUTES.OPPORTUNITY_CREATE)
                  }
                : undefined
            }
          />
        ) : (
          <Stack spacing={2}>
            {myActive.map((opp) => (
              <Card key={opp.id}>
                <CardContent>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Typography variant="h3">{opp.title}</Typography>
                      <StatusChip status={opp.status} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      Получено: {opp.proposalsCount} предложений
                      {opp.newProposalsCount ? ` · Новых: ${opp.newProposalsCount}` : ''}
                    </Typography>
                    <AppButton
                      component={RouterLink}
                      to={opportunityProposalsPath(opp.id)}
                      variant="contained"
                      size="small"
                    >
                      Посмотреть предложения
                    </AppButton>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Section>

      <Section title="Новые предложения">
        {(proposalsQuery.data ?? []).length === 0 ? (
          <EmptyState title="Нет новых предложений" />
        ) : (
          <Stack spacing={2}>
            {(proposalsQuery.data ?? []).slice(0, 3).map((p) => (
              <ProposalCard
                key={p.id}
                proposal={p}
                match={matchesQuery.data?.find(
                  (m) => m.opportunityId === p.opportunityId && m.companyId === p.company.id,
                )}
                compact
              />
            ))}
          </Stack>
        )}
      </Section>

      <Section title="Продолжить работу">
        <Stack spacing={1.5}>
          {myActive[0] ? (
            <Card>
              <CardActionArea
                component={RouterLink}
                to={opportunityComparePath(myActive[0].id)}
              >
                <CardContent>
                  <Typography variant="h4">Сравнить предложения</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {myActive[0].proposalsCount} компаний по «{myActive[0].title}»
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ) : null}
          <Card>
            <CardActionArea component={RouterLink} to={ROUTES.MY_SHORTLIST}>
              <CardContent>
                <Typography variant="h4">Shortlist</Typography>
                <Typography variant="body2" color="text.secondary">
                  {shortlistQuery.data?.length ?? 0} компаний
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
          {(dealsQuery.data ?? [])
            .filter((d) => d.status === 'negotiation')
            .slice(0, 1)
            .map((deal) => (
              <Card key={deal.id}>
                <CardActionArea component={RouterLink} to={`/deals/${deal.id}`}>
                  <CardContent>
                    <Typography variant="h4">Переговоры с {deal.companyName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {deal.opportunityTitle}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
        </Stack>
      </Section>
    </Box>
  )
}
