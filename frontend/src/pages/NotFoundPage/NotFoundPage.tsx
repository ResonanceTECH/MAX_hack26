import { Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { ROUTES } from '@/shared/constants/routes'
import { AppButton } from '@/shared/ui'

export function NotFoundPage() {
  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h1" sx={{ mb: 1 }}>
        404
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Страница не найдена
      </Typography>
      <AppButton component={RouterLink} to={ROUTES.HOME} variant="contained">
        На главную
      </AppButton>
    </Box>
  )
}
