import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { AppButton } from './AppButton'
import { AppIcon } from './AppIcon'
import { AlertCircleIcon } from './icons'

export interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
}

export function ErrorState({
  title = 'Не удалось загрузить данные',
  description = 'Проверьте соединение и попробуйте ещё раз.',
  onRetry,
}: ErrorStateProps) {
  return (
    <Box
      role="alert"
      sx={{
        py: 6,
        px: 2,
        textAlign: 'center',
        border: '1px solid',
        borderColor: 'error.light',
        borderRadius: 2,
        bgcolor: 'background.paper',
      }}
    >
      <Stack spacing={1.5} alignItems="center">
        <AppIcon icon={AlertCircleIcon} size={40} color="#C62828" aria-hidden />
        <Typography variant="h3">{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
        {onRetry ? (
          <AppButton variant="outlined" color="error" onClick={onRetry}>
            Повторить
          </AppButton>
        ) : null}
      </Stack>
    </Box>
  )
}
