import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { useMyOpportunities } from '@/entities/opportunity/api/queries'
import { opportunityDetailsPath, ROUTES } from '@/shared/constants/routes'
import { EmptyState, ErrorState, LoadingState, PageHeader } from '@/shared/ui'
import { AppButton, StatusChip } from '@/shared/ui'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

export function MyRequestsPage() {
  const [tab, setTab] = useState(0)
  const companyId = useSessionStore((s) => s.company?.id)
  const { data, isLoading, isError, refetch } = useMyOpportunities(companyId)

  const all = data ?? []
  const active = all.filter((o) =>
    ['published', 'collecting_proposals', 'shortlisting', 'negotiation'].includes(o.status),
  )
  const drafts = all.filter((o) => o.status === 'draft')
  const done = all.filter((o) => ['closed', 'cancelled', 'expired'].includes(o.status))
  const list = tab === 0 ? active : tab === 1 ? drafts : done

  return (
    <Box>
      <PageHeader title="Мои запросы" subtitle="Запросы вашей компании" />
      <Tabs
        value={tab}
        onChange={(_, v: number) => setTab(v)}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label={`Активные (${active.length})`} />
        <Tab label={`Черновики (${drafts.length})`} />
        <Tab label={`Завершённые (${done.length})`} />
      </Tabs>
      {isLoading ? <LoadingState rows={3} /> : null}
      {isError ? <ErrorState onRetry={() => void refetch()} /> : null}
      {!isLoading && !isError && list.length === 0 ? (
        <EmptyState
          title="Запросов пока нет"
          description="Создайте первый запрос."
          actionLabel="Создать"
          onAction={() => {
            window.location.href = ROUTES.OPPORTUNITY_CREATE
          }}
        />
      ) : null}
      <Stack spacing={2}>
        {list.map((opp) => (
          <Card key={opp.id}>
            <CardContent>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Typography variant="h3">{opp.title}</Typography>
                  <StatusChip status={opp.status} />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {opp.proposalsCount} предложений
                  {opp.newProposalsCount ? ` · ${opp.newProposalsCount} новых` : ''}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <AppButton
                    component={RouterLink}
                    to={opportunityDetailsPath(opp.id)}
                    variant="contained"
                    size="small"
                  >
                    Открыть
                  </AppButton>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  )
}
