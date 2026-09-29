import { Link as RouterLink } from 'react-router-dom'
import Typography from '@mui/material/Typography'
import { ROUTES } from '@/shared/constants/routes'
import { AppButton, BentoGrid, BentoTile } from '@/shared/ui'

export function NotFoundPage() {
  return (
    <BentoGrid sx={{ maxWidth: 560, mx: 'auto', py: 4 }}>
      <BentoTile span={12} variant="emphasis" sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h1" sx={{ mb: 1 }}>
          404
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Страница не найдена
        </Typography>
        <AppButton component={RouterLink} to={ROUTES.HOME} variant="contained">
          На главную
        </AppButton>
      </BentoTile>
    </BentoGrid>
  )
}
