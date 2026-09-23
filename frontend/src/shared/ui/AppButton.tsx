import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import type { ButtonProps } from '@mui/material/Button'

export type AppButtonProps = ButtonProps & {
  loading?: boolean
  // allow react-router Link props when component={RouterLink}
  to?: string
}

export function AppButton({ loading, disabled, children, startIcon, ...props }: AppButtonProps) {
  return (
    <Button
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : startIcon}
      {...props}
    >
      {children}
    </Button>
  )
}
