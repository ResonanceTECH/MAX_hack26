import { useNavigate, useSearchParams } from 'react-router-dom'
import Typography from '@mui/material/Typography'
import { ROUTES } from '@/shared/constants/routes'
import { AppButton, BentoGrid, BentoTile } from '@/shared/ui'

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
    company_activity: {
      title: 'Нет доступа',
      description: 'У вас недостаточно прав для просмотра истории компании.',
      cta: 'Вернуться к компании',
      href: ROUTES.PROFILE_COMPANY,
    },
    platform_admin: {
      title: 'Нет доступа',
      description: 'Этот раздел доступен только Platform Admin.',
      cta: 'Вернуться',
      href: ROUTES.HOME,
    },
    moderation: {
      title: 'Нет доступа',
      description: 'У вас недостаточно прав для этого раздела.',
      cta: 'Вернуться к модерации',
      href: ROUTES.MODERATION,
    },
    marketplace: {
      title: 'Нет доступа',
      description:
        'Раздел marketplace недоступен для модераторов и администраторов платформы.',
      cta: 'Вернуться в профиль',
      href: ROUTES.PROFILE,
    },
  }

export function AccessDeniedPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const reason = params.get('reason') ?? ''
  const copy = REASON_COPY[reason]

  return (
    <BentoGrid sx={{ maxWidth: 560, mx: 'auto', py: 4 }}>
      <BentoTile span={12} variant="emphasis" sx={{ textAlign: 'center', py: 4 }}>
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
      </BentoTile>
    </BentoGrid>
  )
}
