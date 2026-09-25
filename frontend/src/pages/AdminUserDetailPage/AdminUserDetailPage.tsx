import { Link as RouterLink, useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { USER_STATUS } from '@/entities/user'
import {
  useAdminUser,
  useBlockAdminUser,
  useUnblockAdminUser,
} from '@/features/admin/api/queries'
import {
  SYSTEM_ROLE_LABELS,
  USER_STATUS_LABELS,
} from '@/features/moderation/model/labels'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { ROUTES } from '@/shared/constants/routes'
import { formatDate } from '@/shared/lib/format'
import {
  AppButton,
  ConfirmDialog,
  ErrorState,
  LoadingState,
  PageHeader,
} from '@/shared/ui'
import { useState } from 'react'

export function AdminUserDetailPage() {
  const { id = '' } = useParams()
  const userQuery = useAdminUser(id)
  const currentUserId = useSessionStore((s) => s.user?.id ?? 'user-admin')
  const blockUser = useBlockAdminUser()
  const unblockUser = useUnblockAdminUser()
  const [confirmBlock, setConfirmBlock] = useState(false)

  if (userQuery.isLoading) return <LoadingState variant="page" />
  if (userQuery.isError || !userQuery.data) {
    return <ErrorState onRetry={() => void userQuery.refetch()} />
  }

  const user = userQuery.data

  return (
    <Box>
      <PageHeader
        title={`${user.firstName} ${user.lastName}`}
        subtitle={user.email}
        actions={
          <AppButton component={RouterLink} to={ROUTES.ADMIN_USERS} variant="text">
            К списку
          </AppButton>
        }
      />

      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <Chip label={SYSTEM_ROLE_LABELS[user.role] ?? user.role} size="small" />
        <Chip
          label={USER_STATUS_LABELS[user.status] ?? user.status}
          size="small"
          color={user.status === USER_STATUS.BLOCKED ? 'error' : 'default'}
        />
      </Stack>

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              Компания
            </Typography>
            <Typography variant="body1">{user.companyName ?? '—'}</Typography>
            <Typography variant="body2" color="text.secondary">
              Создан
            </Typography>
            <Typography variant="body1">{formatDate(user.createdAt)}</Typography>
            <Typography variant="body2" color="text.secondary">
              Последний вход
            </Typography>
            <Typography variant="body1">
              {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Ещё не входил'}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {user.status === USER_STATUS.BLOCKED ? (
        <AppButton
          variant="contained"
          loading={unblockUser.isPending}
          onClick={() => void unblockUser.mutateAsync(user.id)}
        >
          Разблокировать
        </AppButton>
      ) : (
        <AppButton
          variant="outlined"
          color="error"
          disabled={user.id === currentUserId}
          onClick={() => setConfirmBlock(true)}
        >
          Заблокировать
        </AppButton>
      )}

      <ConfirmDialog
        open={confirmBlock}
        title="Заблокировать пользователя?"
        description="Пользователь потеряет доступ к платформе."
        confirmLabel="Заблокировать"
        confirmColor="error"
        loading={blockUser.isPending}
        onClose={() => setConfirmBlock(false)}
        onConfirm={() => {
          void blockUser.mutateAsync(user.id).then(() => setConfirmBlock(false))
        }}
        onCancel={() => setConfirmBlock(false)}
      />
    </Box>
  )
}
