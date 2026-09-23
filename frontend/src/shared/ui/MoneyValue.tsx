import Typography from '@mui/material/Typography'
import { formatCurrency } from '@/shared/lib/format'

export interface MoneyValueProps {
  amount: number | null | undefined
  currency?: string
  prefix?: string
  variant?: 'body1' | 'body2' | 'h3' | 'h4'
}

export function MoneyValue({
  amount,
  currency = 'RUB',
  prefix,
  variant = 'body1',
}: MoneyValueProps) {
  if (amount == null) {
    return (
      <Typography variant={variant} color="text.secondary">
        не указано
      </Typography>
    )
  }
  return (
    <Typography variant={variant} fontWeight={700} component="span">
      {prefix}
      {formatCurrency(amount, currency)}
    </Typography>
  )
}
