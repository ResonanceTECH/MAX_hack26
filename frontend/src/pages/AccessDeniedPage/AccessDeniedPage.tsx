import { useNavigate, useSearchParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { ROUTES } from '@/shared/constants/routes'
import { AppButton } from '@/shared/ui'

const REASON_COPY: Record<string, { title: string; description: string; cta: string; href: string }> =
  {
    company_members: {
      title: 'Нет доступа',
      description: 'У вас недостаточно прав для управления сотрудниками компании.',
      cta: 'Вернуться к компании',
      href: ROUTES.PROFILE_COMPANY,
    },
    company_settings: {
      title: 'Нет доступа',
      description: 'У вас недостаточно прав для изменения настроек компании.',
      cta: 'Вернуться к компании',
      href: ROUTES.PROFILE_COMPANY,
    },
  }

export function AccessDeniedPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const reason = params.get('reason') ?? ''
  const copy = REASON_COPY[reason]

  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h1" sx={{ mb: 1 }}>
        {copy?.title ?? 'Нет доступа'}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 420, mx: 'auto' }}>
        {copy?.description ?? 'У вас недостаточно прав для просмотра этого раздела.'}
      </Typography>
      <AppButton
        variant="contained"
        onClick={() => {
          if (copy) {
            navigate(copy.href)
            return
          }
          if (window.history.length > 1) navigate(-1)
          else navigate(ROUTES.HOME)
        }}
      >
        {copy?.cta ?? 'Вернуться'}
      </AppButton>
    </Box>
  )
}
