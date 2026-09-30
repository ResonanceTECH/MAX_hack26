import { Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
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
import { ErrorState, LoadingState, PageHeader } from '@/shared/ui'
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

  const summary = [
    {
      title: 'Активные запросы',
      count: activeRequests.length,
      to: ROUTES.MY_REQUESTS,
    },
    {
      title: 'Новые предложения',
      count: newProposals,
      to: ROUTES.MY_REQUESTS,
    },
    {
      title: 'Мои отклики',
      count: (proposals.data ?? []).length,
      to: ROUTES.MY_PROPOSALS,
    },
    {
      title: 'Шортлист',
      count: shortlist.data?.length ?? 0,
      to: ROUTES.MY_SHORTLIST,
    },
    {
      title: 'Переговоры',
      count: negotiationDeals.length,
      to: ROUTES.MY_NEGOTIATIONS,
    },
  ]

  return (
    <Box>
      <PageHeader title="Мои процессы" subtitle="Запросы, отклики, шортлист и переговоры" />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {summary.map((card) => (
          <Grid key={card.title} item xs={6} sm={4} md={2}>
            <Card sx={{ height: '100%' }}>
              <CardActionArea component={RouterLink} to={card.to} sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h1" color="secondary" sx={{ fontSize: '1.75rem' }}>
                    {card.count}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {card.title}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Tabs
        value={tab}
        onChange={(_, v: number) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label={`Запросы (${activeRequests.length})`} />
        <Tab label={`Отклики (${(proposals.data ?? []).length})`} />
        <Tab label={`Шортлист (${shortlist.data?.length ?? 0})`} />
        <Tab label={`Переговоры (${negotiationDeals.length})`} />
      </Tabs>

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
  )
}
