import { useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCompanies } from '@/entities/company/api/queries'
import { dealKeys } from '@/entities/deal/api/queries'
import { useOpportunities } from '@/entities/opportunity/api/queries'
import type { ShortlistItem } from '@/entities/shortlist'
import {
  useRemoveFromShortlist,
  useShortlist,
  useUpdateShortlistNote,
} from '@/entities/shortlist/api/queries'
import { dealApi } from '@/shared/api/dealApi'
import { companyDetailsPath, dealDetailsPath, ROUTES } from '@/shared/constants/routes'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import {
  AppButton,
  EmptyState,
  ErrorState,
  LoadingState,
  MatchScore,
  MoneyValue,
  PageHeader,
  VerifiedBadge,
} from '@/shared/ui'

export interface ShortlistPageProps {
  embedded?: boolean
}

export function ShortlistPage({ embedded }: ShortlistPageProps) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const shortlistQuery = useShortlist()
  const companiesQuery = useCompanies()
  const opportunitiesQuery = useOpportunities()
  const removeMutation = useRemoveFromShortlist()
  const noteMutation = useUpdateShortlistNote()
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({})

  const items = shortlistQuery.data ?? []

  const grouped = useMemo(() => {
    const map = new Map<string, ShortlistItem[]>()
    for (const item of items) {
      const list = map.get(item.opportunityId) ?? []
      list.push(item)
      map.set(item.opportunityId, list)
    }
    return [...map.entries()]
  }, [items])

  const startDeal = useMutation({
    mutationFn: dealApi.startFromShortlist,
    onSuccess: (deal) => {
      void qc.invalidateQueries({ queryKey: dealKeys.all })
      showSuccess('Переговоры начаты')
      void navigate(dealDetailsPath(deal.id))
    },
  })

  if (shortlistQuery.isLoading || companiesQuery.isLoading || opportunitiesQuery.isLoading) {
    return <LoadingState variant="page" />
  }
  if (shortlistQuery.isError) {
    return <ErrorState onRetry={() => void shortlistQuery.refetch()} />
  }

  const content = (
    <>
      {grouped.length === 0 ? (
        <EmptyState
          title="В shortlist пока никого нет"
          description="Добавляйте наиболее интересные предложения, чтобы сравнить финалистов."
          actionLabel="К возможностям"
          onAction={() => {
            void navigate(ROUTES.OPPORTUNITIES)
          }}
        />
      ) : (
        <Stack spacing={4}>
          {grouped.map(([opportunityId, group]) => {
            const opp = opportunitiesQuery.data?.find((o) => o.id === opportunityId)
            return (
              <Box key={opportunityId}>
                <Typography variant="h2" sx={{ mb: 0.5 }}>
                  {opp?.title ?? opportunityId}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Финалисты: {group.length}
                </Typography>
                <Stack spacing={2}>
                  {group.map((item) => {
                    const company = companiesQuery.data?.find((c) => c.id === item.companyId)
                    if (!company) return null
                    const noteValue = localNotes[item.id] ?? item.note
                    return (
                      <Card key={item.id}>
                        <CardContent>
                          <Stack spacing={1.25}>
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="flex-start"
                            >
                              <Stack direction="row" spacing={0.75} alignItems="center">
                                <Typography variant="h3">{company.shortName}</Typography>
                                <VerifiedBadge verified={company.verified} compact />
                              </Stack>
                              <MatchScore score={item.matchScore} companyName={company.shortName} />
                            </Stack>
                            <Stack direction="row" spacing={2} alignItems="baseline">
                              <MoneyValue amount={item.price} currency={item.currency} />
                              {item.durationDays != null ? (
                                <Typography variant="body2" color="text.secondary">
                                  {item.durationDays} дн.
                                </Typography>
                              ) : null}
                            </Stack>
                            <TextField
                              label="Заметка"
                              fullWidth
                              size="small"
                              value={noteValue}
                              onChange={(e) => {
                                const note = e.target.value
                                setLocalNotes((n) => ({ ...n, [item.id]: note }))
                                noteMutation.mutate({ id: item.id, note })
                              }}
                            />
                          </Stack>
                        </CardContent>
                        <CardActions sx={{ px: 2, pb: 2, gap: 1, flexWrap: 'wrap' }}>
                          <AppButton
                            variant="contained"
                            size="small"
                            loading={startDeal.isPending}
                            onClick={() =>
                              startDeal.mutate({
                                opportunityId: item.opportunityId,
                                opportunityTitle: opp?.title ?? 'Запрос',
                                companyId: item.companyId,
                                companyName: company.shortName,
                                proposalId: item.proposalId,
                                price: item.price,
                                currency: item.currency,
                                durationDays: item.durationDays,
                              })
                            }
                          >
                            Начать переговоры
                          </AppButton>
                          <AppButton
                            component={RouterLink}
                            to={companyDetailsPath(company.id)}
                            variant="outlined"
                            size="small"
                          >
                            Открыть компанию
                          </AppButton>
                          <AppButton
                            variant="text"
                            color="error"
                            size="small"
                            loading={removeMutation.isPending}
                            onClick={() => {
                              removeMutation.mutate(item.id, {
                                onSuccess: () => showSuccess('Удалено из shortlist'),
                              })
                            }}
                          >
                            Удалить
                          </AppButton>
                        </CardActions>
                      </Card>
                    )
                  })}
                </Stack>
              </Box>
            )
          })}
        </Stack>
      )}
    </>
  )

  if (embedded) return content

  return (
    <Box>
      <PageHeader title="Shortlist" subtitle="Финалисты по выбранным запросам" />
      {content}
    </Box>
  )
}
