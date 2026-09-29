import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { useMyOpportunities } from '@/entities/opportunity/api/queries'
import { useMyProposals } from '@/entities/proposal/api/queries'
import { useDeals } from '@/entities/deal/api/queries'
import { useShortlist } from '@/entities/shortlist/api/queries'
import { ROUTES } from '@/shared/constants/routes'
import { BentoGrid, BentoTile, ErrorState, LoadingState, PageHeader } from '@/shared/ui'
import { OpportunityCard } from '@/widgets/OpportunityCard/OpportunityCard'
import { ProposalCard } from '@/widgets/ProposalCard/ProposalCard'
import { DealCard } from '@/widgets/DealCard/DealCard'
import { ShortlistPage } from '@/pages/ShortlistPage/ShortlistPage'

export function MyProcessesPage() {
  const [tab, setTab] = useState(0)
  const companyId = useSessionStore((s) => s.company?.id)
  const requests = useMyOpportunities(companyId)
  const proposals = useMyProposals(companyId)
  const deals = useDeals()
  const shortlist = useShortlist()

  if (requests.isLoading || proposals.isLoading || deals.isLoading || shortlist.isLoading) {
    return <LoadingState variant="page" />
  }
  if (requests.isError || proposals.isError || deals.isError || shortlist.isError) {
    return (
      <ErrorState
        onRetry={() => {
          void requests.refetch()
          void proposals.refetch()
          void deals.refetch()
          void shortlist.refetch()
        }}
      />
    )
  }

  const activeRequests = (requests.data ?? []).filter((o) =>
    ['published', 'collecting_proposals', 'shortlisting', 'negotiation'].includes(o.status),
  )
  const newProposals = (proposals.data ?? []).filter((p) =>
    ['submitted', 'viewed'].includes(p.status),
  ).length
  const negotiationDeals = (deals.data ?? []).filter((d) => d.status === 'negotiation')
  const proposalsCount = (proposals.data ?? []).length
  const shortlistCount = shortlist.data?.length ?? 0

  const summary = [
    {
      title: 'Активные запросы',
      count: activeRequests.length,
      to: ROUTES.MY_REQUESTS,
      span: 4 as const,
    },
    {
      title: 'Новые предложения',
      count: newProposals,
      to: ROUTES.MY_REQUESTS,
      span: 4 as const,
    },
    {
      title: 'Мои отклики',
      count: proposalsCount,
      to: ROUTES.MY_PROPOSALS,
      span: 4 as const,
    },
    {
      title: 'Шортлист',
      count: shortlistCount,
      to: ROUTES.MY_SHORTLIST,
      span: 6 as const,
    },
    {
      title: 'Переговоры',
      count: negotiationDeals.length,
      to: ROUTES.MY_NEGOTIATIONS,
      span: 6 as const,
    },
  ]

  return (
    <Box>
      <PageHeader title="Мои процессы" subtitle="Запросы, отклики, шортлист и переговоры" />

      <BentoGrid>
        <BentoTile span={12} variant="emphasis">
          <Typography variant="h2" component="h2" sx={{ mb: 0.5 }}>
            Сводка
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {activeRequests.length} активных запросов · {newProposals} новых предложений ·{' '}
            {negotiationDeals.length} переговоров
          </Typography>
        </BentoTile>

        {summary.map((card) => (
          <BentoTile key={card.title} span={card.span} to={card.to} variant="action">
            <Typography variant="h1" color="secondary" sx={{ fontSize: '1.75rem', lineHeight: 1.2 }}>
              {card.count}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {card.title}
            </Typography>
          </BentoTile>
        ))}

        <BentoTile span={12} noPadding>
          <Tabs
            value={tab}
            onChange={(_, v: number) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 1, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label={`Запросы (${activeRequests.length})`} />
            <Tab label={`Отклики (${proposalsCount})`} />
            <Tab label={`Шортлист (${shortlistCount})`} />
            <Tab label={`Переговоры (${negotiationDeals.length})`} />
          </Tabs>
          <Box sx={{ p: 2 }}>
            {tab === 0 ? (
              <Stack spacing={2}>
                {activeRequests.map((opp) => (
                  <OpportunityCard key={opp.id} opportunity={opp} />
                ))}
              </Stack>
            ) : null}
            {tab === 1 ? (
              <Stack spacing={2}>
                {(proposals.data ?? []).map((p) => (
                  <ProposalCard key={p.id} proposal={p} />
                ))}
              </Stack>
            ) : null}
            {tab === 2 ? <ShortlistPage embedded /> : null}
            {tab === 3 ? (
              <Stack spacing={2}>
                {negotiationDeals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} />
                ))}
              </Stack>
            ) : null}
          </Box>
        </BentoTile>
      </BentoGrid>
    </Box>
  )
}
