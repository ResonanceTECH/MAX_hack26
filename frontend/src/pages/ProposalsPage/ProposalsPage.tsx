import { useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import { useOpportunity } from '@/entities/opportunity/api/queries'
import { useProposals, useRejectProposal, useShortlistProposal } from '@/entities/proposal/api/queries'
import { useMatches } from '@/entities/match/api/queries'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { EmptyState, ErrorState, LoadingState, PageHeader } from '@/shared/ui'
import { ProposalCard } from '@/widgets/ProposalCard/ProposalCard'

export function ProposalsPage() {
  const { id = '' } = useParams()
  const opportunity = useOpportunity(id)
  const proposals = useProposals(id)
  const matches = useMatches(id)
  const shortlistMutation = useShortlistProposal()
  const rejectMutation = useRejectProposal()
  const showSuccess = useSnackbarStore((s) => s.showSuccess)

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

  return (
    <Box>
      <PageHeader title="Предложения" subtitle={opportunity.data?.title} />
      {(proposals.data?.length ?? 0) === 0 ? (
        <EmptyState
          title="Пока нет предложений"
          description="Когда исполнители откликнутся, они появятся здесь."
        />
      ) : (
        <Stack spacing={2}>
          {(proposals.data ?? []).map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              match={matches.data?.find((m) => m.companyId === proposal.company.id)}
              onShortlist={async (pid) => {
                await shortlistMutation.mutateAsync(pid)
                showSuccess('Добавлено в shortlist')
              }}
              onReject={async (pid) => {
                await rejectMutation.mutateAsync(pid)
              }}
            />
          ))}
        </Stack>
      )}
    </Box>
  )
}
