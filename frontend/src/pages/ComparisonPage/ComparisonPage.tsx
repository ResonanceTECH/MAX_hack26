import { useMemo, useState } from 'react'
import { Link as RouterLink, useParams, useSearchParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { useOpportunity } from '@/entities/opportunity/api/queries'
import { useProposals, useShortlistProposal } from '@/entities/proposal/api/queries'
import { useMatches } from '@/entities/match/api/queries'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { proposalDetailsPath } from '@/shared/constants/routes'
import { formatCurrency } from '@/shared/lib/format'
import { AppButton, ErrorState, LoadingState, PageHeader } from '@/shared/ui'

export function ComparisonPage() {
  const { id = '' } = useParams()
  const [searchParams] = useSearchParams()
  const opportunity = useOpportunity(id)
  const proposals = useProposals(id)
  const matches = useMatches(id)
  const shortlistMutation = useShortlistProposal()
  const showSuccess = useSnackbarStore((s) => s.showSuccess)

  const all = proposals.data ?? []
  const preselected = searchParams.getAll('p')
  const [selected, setSelected] = useState<string[]>(
    preselected.length ? preselected : all.slice(0, 3).map((p) => p.id),
  )
  const [removed, setRemoved] = useState<string[]>([])

  const selectedIds = useMemo(() => {
    const base = selected.length ? selected : all.slice(0, 3).map((p) => p.id)
    return base.filter((pid) => !removed.includes(pid))
  }, [selected, removed, all])

  if (opportunity.isLoading || proposals.isLoading) return <LoadingState variant="page" />
  if (opportunity.isError || proposals.isError) {
    return (
      <ErrorState
        onRetry={() => {
          void opportunity.refetch()
          void proposals.refetch()
        }}
      />
    )
  }

  const rows = all.filter((p) => selectedIds.includes(p.id))
  const required = opportunity.data?.requiredRequirements ?? []

  const getMatch = (companyId: string) => matches.data?.find((m) => m.companyId === companyId)

  const toggleSelect = (proposalId: string) => {
    setSelected((prev) => {
      const current = prev.length ? prev : all.slice(0, 3).map((p) => p.id)
      if (current.includes(proposalId)) {
        return current.filter((x) => x !== proposalId)
      }
      if (current.length >= 3) return current
      return [...current, proposalId]
    })
    setRemoved((r) => r.filter((x) => x !== proposalId))
  }

  return (
    <Box>
      <PageHeader title="Сравнение предложений" subtitle={opportunity.data?.title} />

      <Stack spacing={1} sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Выберите 2–3 предложения для сравнения
        </Typography>
        <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1}>
          {all.map((p) => (
            <FormControlLabel
              key={p.id}
              control={
                <Checkbox
                  checked={selectedIds.includes(p.id)}
                  onChange={() => toggleSelect(p.id)}
                  inputProps={{ 'aria-label': `Выбрать ${p.company.shortName}` }}
                />
              }
              label={p.company.shortName}
            />
          ))}
        </Stack>
      </Stack>

      {rows.length === 0 ? (
        <Typography color="text.secondary">Нет предложений для сравнения</Typography>
      ) : (
        <TableContainer
          sx={{
            overflowX: 'auto',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'background.paper',
          }}
        >
          <Table sx={{ minWidth: 720 }} aria-label="Сравнение предложений">
            <TableHead>
              <TableRow>
                <TableCell>Параметр</TableCell>
                {rows.map((p) => (
                  <TableCell key={p.id} align="center">
                    {p.company.shortName}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Match Score</TableCell>
                {rows.map((p) => {
                  const score = getMatch(p.company.id)?.score
                  return (
                    <TableCell key={p.id} align="center">
                      {score != null ? `${score}%` : '—'}
                    </TableCell>
                  )
                })}
              </TableRow>
              <TableRow>
                <TableCell>Цена</TableCell>
                {rows.map((p) => (
                  <TableCell key={p.id} align="center">
                    {formatCurrency(p.price, p.currency)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>Срок</TableCell>
                {rows.map((p) => (
                  <TableCell key={p.id} align="center">
                    {p.durationDays} дн.
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>Рейтинг</TableCell>
                {rows.map((p) => (
                  <TableCell key={p.id} align="center">
                    {p.company.rating.toFixed(1)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>Похожие кейсы</TableCell>
                {rows.map((p) => (
                  <TableCell key={p.id} align="center">
                    {p.cases.length || p.company.casesCount}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>Опыт</TableCell>
                {rows.map((p) => (
                  <TableCell key={p.id} align="center">
                    {p.company.industries.join(', ')}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>Технологии</TableCell>
                {rows.map((p) => (
                  <TableCell key={p.id} align="center">
                    {p.company.technologies.slice(0, 4).join(', ')}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>Регион</TableCell>
                {rows.map((p) => (
                  <TableCell key={p.id} align="center">
                    {p.company.region}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>Требования</TableCell>
                {rows.map((p) => {
                  const match = getMatch(p.company.id)
                  const missing = match?.missingRequirements ?? []
                  const covered = required.filter(
                    (req) =>
                      !missing.some((m) => m.toLowerCase().includes(req.toLowerCase().slice(0, 4))),
                  )
                  return (
                    <TableCell key={p.id} align="center">
                      <Typography variant="body2">
                        ✓ {covered.length || required.length - missing.length}/{required.length || '—'}
                      </Typography>
                      {missing.length ? (
                        <Typography variant="caption" color="text.secondary" display="block">
                          △ {missing.join(', ')}
                        </Typography>
                      ) : null}
                    </TableCell>
                  )
                })}
              </TableRow>
              <TableRow>
                <TableCell>Действия</TableCell>
                {rows.map((p) => (
                  <TableCell key={p.id} align="center">
                    <Stack spacing={1} alignItems="center">
                      <AppButton
                        size="small"
                        variant="contained"
                        loading={shortlistMutation.isPending}
                        onClick={() =>
                          shortlistMutation.mutate(p.id, {
                            onSuccess: () => showSuccess('Добавлено в shortlist'),
                          })
                        }
                      >
                        В shortlist
                      </AppButton>
                      <AppButton
                        size="small"
                        component={RouterLink}
                        to={proposalDetailsPath(p.id)}
                        variant="outlined"
                      >
                        Открыть предложение
                      </AppButton>
                      <AppButton
                        size="small"
                        variant="text"
                        color="inherit"
                        aria-label={`Убрать из сравнения ${p.company.shortName}`}
                        onClick={() => setRemoved((r) => [...r, p.id])}
                      >
                        Убрать из сравнения
                      </AppButton>
                    </Stack>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}
