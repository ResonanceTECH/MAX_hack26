import { Link as RouterLink } from 'react-router-dom'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { Deal } from '@/entities/deal'
import { dealDetailsPath } from '@/shared/constants/routes'
import { formatRelativeDate } from '@/shared/lib/format'
import { AppButton, MoneyValue, StatusChip } from '@/shared/ui'

export interface DealCardProps {
  deal: Deal
}

export function DealCard({ deal }: DealCardProps) {
  return (
    <Card>
      <CardContent>
        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Typography variant="h3">{deal.companyName}</Typography>
            <StatusChip status={deal.status} kind="deal" />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {deal.opportunityTitle}
          </Typography>
          <MoneyValue amount={deal.price} currency={deal.currency} />
          <Typography variant="body2" color="text.secondary">
            Последнее действие: {deal.lastAction}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Обновлено {formatRelativeDate(deal.updatedAt)}
          </Typography>
        </Stack>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2 }}>
        <AppButton
          component={RouterLink}
          to={dealDetailsPath(deal.id)}
          variant="contained"
          size="small"
        >
          Открыть
        </AppButton>
      </CardActions>
    </Card>
  )
}
