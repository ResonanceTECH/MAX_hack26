import { useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { SYSTEM_ROLES, USER_STATUS, type SystemRole, type UserStatus } from '@/entities/user'
import {
  useAdminUsers,
  useBlockAdminUser,
  useUnblockAdminUser,
} from '@/features/admin/api/queries'
import {
  SYSTEM_ROLE_LABELS,
  USER_STATUS_LABELS,
} from '@/features/moderation/model/labels'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { adminUserPath, ROUTES } from '@/shared/constants/routes'
import { formatDate } from '@/shared/lib/format'
import {
  AppButton,
  AppSelect,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  SearchInput,
} from '@/shared/ui'

export function AdminUsersPage() {
  const [query, setQuery] = useState('')
  const [role, setRole] = useState<SystemRole | 'all'>('all')
  const [status, setStatus] = useState<UserStatus | 'all'>('all')
  const currentUserId = useSessionStore((s) => s.user?.id ?? 'user-admin')

  const filters = useMemo(
    () => ({
      query: query || undefined,
      role,
      status,
    }),
    [query, role, status],
  )

  const usersQuery = useAdminUsers(filters)
  const blockUser = useBlockAdminUser()
  const unblockUser = useUnblockAdminUser()
  const [blockId, setBlockId] = useState<string | null>(null)

  const items = usersQuery.data ?? []

  return (
    <Box>
      <PageHeader
        title="Пользователи платформы"
        subtitle="Поиск, роли и блокировка"
        actions={
          <AppButton component={RouterLink} to={ROUTES.ADMIN} variant="text">
            К сводке
          </AppButton>
        }
      />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <SearchInput value={query} onChange={setQuery} placeholder="Имя, email, компания" />
        </Box>
        <Box sx={{ minWidth: 200 }}>
          <AppSelect
            label="Роль"
            value={role}
            onChange={(v) => setRole(v as SystemRole | 'all')}
            options={[
              { value: 'all', label: 'Все роли' },
              ...Object.values(SYSTEM_ROLES).map((r) => ({
                value: r,
                label: SYSTEM_ROLE_LABELS[r] ?? r,
              })),
            ]}
          />
        </Box>
        <Box sx={{ minWidth: 180 }}>
          <AppSelect
            label="Статус"
            value={status}
            onChange={(v) => setStatus(v as UserStatus | 'all')}
            options={[
              { value: 'all', label: 'Все статусы' },
              ...Object.values(USER_STATUS).map((s) => ({
                value: s,
                label: USER_STATUS_LABELS[s] ?? s,
              })),
            ]}
          />
        </Box>
      </Stack>

      {usersQuery.isLoading ? <LoadingState rows={4} variant="list" /> : null}
      {usersQuery.isError ? <ErrorState onRetry={() => void usersQuery.refetch()} /> : null}
      {!usersQuery.isLoading && !usersQuery.isError && items.length === 0 ? (
        <EmptyState title="Пользователи не найдены" />
      ) : null}

      <Stack spacing={1.5}>
        {items.map((user) => (
          <Card key={user.id} variant="outlined">
            <CardContent>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                spacing={1.5}
                alignItems={{ sm: 'center' }}
              >
                <Box>
                  <Stack direction="row" spacing={1} sx={{ mb: 0.5 }} flexWrap="wrap" useFlexGap>
                    <Chip size="small" label={SYSTEM_ROLE_LABELS[user.role] ?? user.role} />
                    <Chip
                      size="small"
                      label={USER_STATUS_LABELS[user.status] ?? user.status}
                      color={user.status === USER_STATUS.BLOCKED ? 'error' : 'default'}
                    />
                  </Stack>
                  <Typography variant="h4">
                    {user.firstName} {user.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user.email}
                    {user.companyName ? ` · ${user.companyName}` : ''}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Создан: {formatDate(user.createdAt)}
                    {user.lastLoginAt ? ` · вход ${formatDate(user.lastLoginAt)}` : ''}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <AppButton
                    component={RouterLink}
                    to={adminUserPath(user.id)}
                    size="small"
                    variant="outlined"
                  >
                    Открыть
                  </AppButton>
                  {user.status === USER_STATUS.BLOCKED ? (
                    <AppButton
                      size="small"
                      variant="contained"
                      loading={unblockUser.isPending}
                      onClick={() => void unblockUser.mutateAsync(user.id)}
                    >
                      Разблокировать
                    </AppButton>
                  ) : (
                    <AppButton
                      size="small"
                      color="error"
                      variant="outlined"
                      disabled={user.id === currentUserId}
                      onClick={() => setBlockId(user.id)}
                    >
                      Заблокировать
                    </AppButton>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <ConfirmDialog
        open={blockId !== null}
        title="Заблокировать пользователя?"
        description="Пользователь потеряет доступ к платформе до разблокировки."
        confirmLabel="Заблокировать"
        confirmColor="error"
        loading={blockUser.isPending}
        onClose={() => setBlockId(null)}
        onConfirm={() => {
          if (!blockId) return
          void blockUser.mutateAsync(blockId).then(() => setBlockId(null))
        }}
        onCancel={() => setBlockId(null)}
      />
    </Box>
  )
}
