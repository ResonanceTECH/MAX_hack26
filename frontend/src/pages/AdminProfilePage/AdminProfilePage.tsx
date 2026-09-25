import { Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { SystemRoleChip, PlatformStatusChip } from '@/features/admin'
import { adminUserPath, ROUTES } from '@/shared/constants/routes'
import { AppButton, PageHeader } from '@/shared/ui'

export function AdminProfilePage() {
  const user = useSessionStore((s) => s.user)
  const role = useSessionStore((s) => s.role)

  const id = user?.id ?? 'user-platform-admin'
  const firstName = user?.firstName ?? 'Александр'
  const lastName = user?.lastName ?? 'Иванов'

  return (
    <Box>
      <PageHeader
        title="Профиль администратора"
        subtitle="Текущая сессия Platform Admin"
        actions={
          <AppButton component={RouterLink} to={ROUTES.ADMIN} variant="text" sx={{ minHeight: 44 }}>
            К сводке
          </AppButton>
        }
      />

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={1.5}>
            <Typography variant="h3">
              {firstName} {lastName}
            </Typography>
            <Stack direction="row" spacing={1}>
              <SystemRoleChip role={role ?? user?.role ?? 'PLATFORM_ADMIN'} />
              <PlatformStatusChip status={user?.status ?? 'active'} kind="user" />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              ID: {id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              MAX: {user?.maxUserId ?? 'max-30001'}
            </Typography>
            <AppButton
              component={RouterLink}
              to={adminUserPath(id)}
              variant="outlined"
              sx={{ alignSelf: 'flex-start', minHeight: 44 }}
            >
              Открыть карточку пользователя
            </AppButton>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
