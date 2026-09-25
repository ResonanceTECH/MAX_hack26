import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import { useSnackbarStore } from '../model/snackbarStore'

export function AppSnackbar() {
  const open = useSnackbarStore((s) => s.open)
  const message = useSnackbarStore((s) => s.message)
  const severity = useSnackbarStore((s) => s.severity)
  const actionLabel = useSnackbarStore((s) => s.actionLabel)
  const onAction = useSnackbarStore((s) => s.onAction)
  const hide = useSnackbarStore((s) => s.hide)

  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={hide}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ bottom: { xs: 'calc(72px + env(safe-area-inset-bottom))', md: 24 } }}
    >
      <Alert
        onClose={hide}
        severity={severity}
        variant="filled"
        sx={{ width: '100%' }}
        action={
          actionLabel && onAction ? (
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                onAction()
                hide()
              }}
            >
              {actionLabel}
            </Button>
          ) : undefined
        }
      >
        {message}
      </Alert>
    </Snackbar>
  )
}
