import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { SYSTEM_ROLE_LABELS } from '@/features/moderation/model/labels'
import { LoadingState, PageHeader } from '@/shared/ui'

export function ProfilePage() {
  const user = useSessionStore((s) => s.user)
  const role = useSessionStore((s) => s.role)
  const company = useSessionStore((s) => s.company)

  if (!user || !role) return <LoadingState variant="page" />

  return (
    <Box>
      <PageHeader title="Профиль" subtitle="Текущая demo-сессия" />
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="h3">
              {user.firstName} {user.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Роль: {SYSTEM_ROLE_LABELS[role] ?? role}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              MAX ID: {user.maxUserId}
            </Typography>
            {company ? (
              <Typography variant="body2" color="text.secondary">
                Компания: {company.shortName}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Без привязки к компании (сотрудник платформы)
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
