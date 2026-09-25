import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { ROUTES } from '@/shared/constants/routes'
import { AppButton } from '@/shared/ui'

export function AccessDeniedPage() {
  const navigate = useNavigate()

  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h1" sx={{ mb: 1 }}>
        Нет доступа
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 420, mx: 'auto' }}>
        У вас недостаточно прав для просмотра этого раздела.
      </Typography>
      <AppButton
        variant="contained"
        onClick={() => {
          if (window.history.length > 1) navigate(-1)
          else navigate(ROUTES.HOME)
        }}
      >
        Вернуться
      </AppButton>
    </Box>
  )
}
