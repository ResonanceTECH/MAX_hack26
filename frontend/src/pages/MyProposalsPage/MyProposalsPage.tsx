import { useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { useMyProposals } from '@/entities/proposal/api/queries'
import { getOpportunityById, mockMatches } from '@/shared/mocks'
import { proposalDetailsPath } from '@/shared/constants/routes'
import {
  AppButton,
  EmptyState,
  ErrorState,
  LoadingState,
  MatchScore,
  MoneyValue,
  PageHeader,
  StatusChip,
} from '@/shared/ui'

export function MyProposalsPage() {
  const [tab, setTab] = useState(0)
  const companyId = useSessionStore((s) => s.company?.id)
  const { data, isLoading, isError, refetch } = useMyProposals(companyId)

  const all = data ?? []
  const buckets = useMemo(() => {
    return {
      all,
      review: all.filter((p) => ['submitted', 'viewed'].includes(p.status)),
      shortlist: all.filter((p) => p.status === 'shortlisted'),
      negotiation: all.filter((p) => p.status === 'negotiation'),
      done: all.filter((p) => ['accepted', 'rejected', 'withdrawn'].includes(p.status)),
    }
  }, [all])

  const list =
    tab === 0
      ? buckets.all
      : tab === 1
        ? buckets.review
        : tab === 2
          ? buckets.shortlist
          : tab === 3
            ? buckets.negotiation
            : buckets.done

  return (
    <Box>
      <PageHeader title="Мои отклики" subtitle="Предложения, отправленные вашей компанией" />
      <Tabs
        value={tab}
        onChange={(_, v: number) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label={`Все (${buckets.all.length})`} />
        <Tab label={`На рассмотрении (${buckets.review.length})`} />
        <Tab label={`Shortlist (${buckets.shortlist.length})`} />
        <Tab label={`Переговоры (${buckets.negotiation.length})`} />
        <Tab label={`Завершённые (${buckets.done.length})`} />
      </Tabs>
      {isLoading ? <LoadingState rows={3} /> : null}
      {isError ? <ErrorState onRetry={() => void refetch()} /> : null}
      {!isLoading && !isError && list.length === 0 ? (
        <EmptyState title="Откликов пока нет" description="Найдите подходящий заказ и откликнитесь." />
      ) : null}
      <Stack spacing={2}>
        {list.map((p) => {
          const opp = getOpportunityById(p.opportunityId)
          const match = mockMatches.find(
            (m) => m.opportunityId === p.opportunityId && m.companyId === p.company.id,
          )
          return (
            <Card key={p.id}>
              <CardContent>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="h3">
                        {opp?.title ?? p.opportunityId}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {opp?.company.shortName}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {match ? <MatchScore score={match.score} /> : null}
                      <StatusChip status={p.status} kind="proposal" />
                    </Stack>
                  </Stack>
                  <MoneyValue amount={p.price} currency={p.currency} />
                  <AppButton
                    component={RouterLink}
                    to={proposalDetailsPath(p.id)}
                    variant="contained"
                    size="small"
                  >
                    Открыть
                  </AppButton>
                </Stack>
              </CardContent>
            </Card>
          )
        })}
      </Stack>
    </Box>
  )
}
