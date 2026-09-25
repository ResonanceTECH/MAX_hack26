import type { ReactNode } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import { AppButton } from '@/shared/ui'

export function DangerActionDialog({
  open,
  title,
  description,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  loading = false,
  confirmDisabled = false,
  destructive = true,
  onConfirm,
  onClose,
  children,
}: {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  confirmDisabled?: boolean
  destructive?: boolean
  onConfirm: () => void
  onClose: () => void
  children?: ReactNode
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {description ? (
          <DialogContentText sx={{ mb: children ? 2 : 0 }}>{description}</DialogContentText>
        ) : null}
        {children}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <AppButton onClick={onClose} disabled={loading} sx={{ minHeight: 44 }}>
          {cancelLabel}
        </AppButton>
        <AppButton
          variant="contained"
          color={destructive ? 'error' : 'primary'}
          loading={loading}
          disabled={confirmDisabled}
          onClick={onConfirm}
          sx={{ minHeight: 44 }}
        >
          {confirmLabel}
        </AppButton>
      </DialogActions>
    </Dialog>
  )
}
