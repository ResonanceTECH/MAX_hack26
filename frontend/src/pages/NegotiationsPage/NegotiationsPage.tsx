import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import { useDeals } from '@/entities/deal/api/queries'
import { BentoGrid, BentoTile, EmptyState, ErrorState, LoadingState, PageHeader } from '@/shared/ui'
import { DealCard } from '@/widgets/DealCard/DealCard'

export function NegotiationsPage() {
  const { data, isLoading, isError, refetch } = useDeals()

  return (
    <Box>
      <PageHeader
        title="Переговоры"
        subtitle="Активные сделки и согласование условий с контрагентами"
      />
      <BentoGrid>
        <BentoTile span={12}>
          {isLoading ? <LoadingState variant="page" /> : null}
          {isError ? <ErrorState onRetry={() => void refetch()} /> : null}
          {!isLoading && !isError && (data?.length ?? 0) === 0 ? (
            <EmptyState
              title="Переговоров пока нет"
              description="Когда вы перейдёте к обсуждению условий с исполнителем, сделки появятся здесь."
            />
          ) : null}
          {!isLoading && !isError ? (
            <Stack spacing={2}>
              {(data ?? []).map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </Stack>
          ) : null}
        </BentoTile>
      </BentoGrid>
    </Box>
  )
}
