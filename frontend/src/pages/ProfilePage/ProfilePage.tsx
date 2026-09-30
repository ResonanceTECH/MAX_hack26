import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { SYSTEM_ROLE_LABELS } from '@/features/moderation/model/labels'
import { BentoGrid, BentoTile, LoadingState, PageHeader } from '@/shared/ui'

export function ProfilePage() {
  const user = useSessionStore((s) => s.user)
  const role = useSessionStore((s) => s.role)
  const company = useSessionStore((s) => s.company)

  if (!user || !role) return <LoadingState variant="page" />

  return (
    <Box>
      <PageHeader title="Профиль" subtitle="Текущая demo-сессия" />
      <BentoGrid>
        <BentoTile span={8} variant="emphasis">
          <Typography variant="h3" sx={{ mb: 1 }}>
            {user.firstName} {user.lastName}
          </Typography>
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              Роль: {SYSTEM_ROLE_LABELS[role] ?? role}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              MAX ID: {user.maxUserId}
            </Typography>
          </Stack>
        </BentoTile>
        <BentoTile span={4}>
          <Typography variant="h4" sx={{ mb: 1 }}>
            Компания
          </Typography>
          {company ? (
            <Typography variant="body2" color="text.secondary">
              {company.shortName}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Без привязки к компании (сотрудник платформы)
            </Typography>
          )}
        </BentoTile>
      </BentoGrid>
    </Box>
  )
}
