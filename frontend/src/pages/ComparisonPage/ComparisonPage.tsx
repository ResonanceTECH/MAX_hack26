import { useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { useOpportunity } from '@/entities/opportunity/api/queries'
import { useProposals } from '@/entities/proposal/api/queries'
import { useMatches } from '@/entities/match/api/queries'
import { formatCurrency } from '@/shared/lib/format'
import { ErrorState, LoadingState, PageHeader } from '@/shared/ui'

export function ComparisonPage() {
  const { id = '' } = useParams()
  const opportunity = useOpportunity(id)
  const proposals = useProposals(id)
  const matches = useMatches(id)

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

  const rows = proposals.data ?? []

  const getMatch = (companyId: string) =>
    matches.data?.find((m) => m.companyId === companyId)?.score ?? '—'

  return (
    <Box>
      <PageHeader title="Сравнение предложений" subtitle={opportunity.data?.title} />
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
                {rows.map((p) => (
                  <TableCell key={p.id} align="center">
                    {getMatch(p.company.id)}
                    {typeof getMatch(p.company.id) === 'number' ? '%' : ''}
                  </TableCell>
                ))}
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
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}
