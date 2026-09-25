import { useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { SYSTEM_ROLES, USER_STATUS, type SystemRole, type UserStatus } from '@/entities/user'
import {
  useAdminUsers,
  useBlockAdminUser,
  useUnblockAdminUser,
  useSuspendUser,
  useActivateUser,
  canBlockUser,
  canSuspendUser,
  blockUserSchema,
  type BlockUserFormValues,
  BLOCK_USER_REASON_OPTIONS,
  SYSTEM_ROLE_LABELS,
  USER_STATUS_LABELS,
  SystemRoleChip,
  PlatformStatusChip,
  DangerActionDialog,
} from '@/features/admin'
import { BaseUiMenu, type BaseUiMenuItem } from '@/features/company-management/ui/BaseUiMenu'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { adminUserPath, ROUTES } from '@/shared/constants/routes'
import { formatDate } from '@/shared/lib/format'
import type { AdminUser } from '@/shared/mocks/adminUsers'
import {
  AppButton,
  AppInput,
  AppSelect,
  AppTextarea,
  EmptyState,
  ErrorState,
  FilterDrawer,
  LoadingState,
  PageHeader,
  SearchInput,
} from '@/shared/ui'

const REASON_LABELS_RU: Record<string, string> = {
  SECURITY_ISSUE: 'Проблема безопасности',
  FRAUD_ABUSE: 'Мошенничество / abuse',
  TERMS_VIOLATION: 'Нарушение правил',
  DUPLICATE_ACCOUNT: 'Дублирующий аккаунт',
  ADMINISTRATIVE_DECISION: 'Административное решение',
  OTHER: 'Другое',
}

type DialogKind = 'block' | 'unblock' | 'suspend' | 'activate' | null

export function AdminUsersPage() {
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
  const navigate = useNavigate()
  const currentUserId = useSessionStore((s) => s.user?.id ?? 'user-platform-admin')
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)

  const [query, setQuery] = useState('')
  const [role, setRole] = useState<SystemRole | 'all'>('all')
  const [status, setStatus] = useState<UserStatus | 'all'>('all')
  const [sort, setSort] = useState<'name' | 'created' | 'activity' | 'role' | 'status'>('created')
  const [drawerOpen, setDrawerOpen] = useState(false)

  const [dialog, setDialog] = useState<{ kind: DialogKind; user: AdminUser } | null>(null)

  const filters = useMemo(
    () => ({
      query: query || undefined,
      role,
      status,
      sort,
    }),
    [query, role, status, sort],
  )

  const usersQuery = useAdminUsers(filters)
  const allUsersQuery = useAdminUsers()
  const blockUser = useBlockAdminUser()
  const unblockUser = useUnblockAdminUser()
  const suspendUser = useSuspendUser()
  const activateUser = useActivateUser()

  const form = useForm<BlockUserFormValues>({
    resolver: zodResolver(blockUserSchema),
    defaultValues: { reasonCode: 'ADMINISTRATIVE_DECISION', reason: '' },
  })

  const items = usersQuery.data ?? []
  const allUsers = allUsersQuery.data ?? items

  const openDialog = (kind: Exclude<DialogKind, null>, user: AdminUser) => {
    form.reset({ reasonCode: 'ADMINISTRATIVE_DECISION', reason: '' })
    setDialog({ kind, user })
  }

  const runDialog = async () => {
    if (!dialog) return
    const { kind, user } = dialog
    try {
      if (kind === 'block' || kind === 'suspend') {
        const ok = await form.trigger()
        if (!ok) return
        const values = form.getValues()
        const reason = `${REASON_LABELS_RU[values.reasonCode] ?? values.reasonCode}: ${values.reason}`
        if (kind === 'block') {
          const check = canBlockUser({ target: user, currentUserId, allUsers })
          if (!check.allowed) {
            showError(check.reason ?? 'Действие недоступно')
            return
          }
          await blockUser.mutateAsync({ id: user.id, reason })
          showSuccess('Пользователь заблокирован')
        } else {
          const check = canSuspendUser({ target: user, currentUserId, allUsers })
          if (!check.allowed) {
            showError(check.reason ?? 'Действие недоступно')
            return
          }
          await suspendUser.mutateAsync({ id: user.id, reason })
          showSuccess('Доступ приостановлен')
        }
      } else if (kind === 'unblock') {
        await unblockUser.mutateAsync({
          id: user.id,
          reason: form.getValues('reason') || undefined,
        })
        showSuccess('Пользователь разблокирован')
      } else if (kind === 'activate') {
        await activateUser.mutateAsync({
          id: user.id,
          reason: form.getValues('reason') || undefined,
        })
        showSuccess('Пользователь активирован')
      }
      setDialog(null)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Операция не выполнена')
    }
  }
  const menuFor = (user: AdminUser) => {
    const blockCheck = canBlockUser({ target: user, currentUserId, allUsers })
    const suspendCheck = canSuspendUser({ target: user, currentUserId, allUsers })
    const items: BaseUiMenuItem[] = [
      {
        key: 'open',
        label: 'Открыть',
        onClick: () => navigate(adminUserPath(user.id)),
      },
    ]
    if (user.status === USER_STATUS.BLOCKED) {
      items.push({
        key: 'unblock',
        label: 'Разблокировать',
        onClick: () => openDialog('unblock', user),
      })
    } else if (user.status === USER_STATUS.SUSPENDED) {
      items.push({
        key: 'activate',
        label: 'Активировать',
        onClick: () => openDialog('activate', user),
      })
      items.push({
        key: 'block',
        label: 'Заблокировать',
        onClick: () => {
          if (!blockCheck.allowed) showError(blockCheck.reason ?? 'Недоступно')
          else openDialog('block', user)
        },
        disabled: !blockCheck.allowed,
        destructive: true,
        separatorBefore: true,
      })
    } else {
      items.push({
        key: 'suspend',
        label: 'Приостановить',
        onClick: () => {
          if (!suspendCheck.allowed) showError(suspendCheck.reason ?? 'Недоступно')
          else openDialog('suspend', user)
        },
        disabled: !suspendCheck.allowed,
      })
      items.push({
        key: 'block',
        label: 'Заблокировать',
        onClick: () => {
          if (!blockCheck.allowed) showError(blockCheck.reason ?? 'Недоступно')
          else openDialog('block', user)
        },
        disabled: !blockCheck.allowed,
        destructive: true,
        separatorBefore: true,
      })
    }
    return <BaseUiMenu items={items} aria-label={`Действия: ${user.firstName}`} />
  }

  const filtersUi = (
    <>
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
      <AppSelect
        label="Сортировка"
        value={sort}
        onChange={(v) => setSort(v as typeof sort)}
        options={[
          { value: 'created', label: 'По дате создания' },
          { value: 'name', label: 'По имени' },
          { value: 'activity', label: 'По активности' },
          { value: 'role', label: 'По роли' },
          { value: 'status', label: 'По статусу' },
        ]}
      />
    </>
  )

  return (
    <Box>
      <PageHeader
        title="Пользователи платформы"
        subtitle="Поиск, роли, блокировка и приостановка"
        actions={
          <AppButton component={RouterLink} to={ROUTES.ADMIN} variant="text" sx={{ minHeight: 44 }}>
            К сводке
          </AppButton>
        }
      />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        sx={{ mb: 2 }}
        alignItems={{ md: 'center' }}
      >
        <Box sx={{ flex: 1 }}>
          <SearchInput value={query} onChange={setQuery} placeholder="Имя, email, компания" />
        </Box>
        {isDesktop ? (
          <Stack direction="row" spacing={1.5} sx={{ minWidth: { md: 480 } }}>
            {filtersUi}
          </Stack>
        ) : (
          <AppButton variant="outlined" onClick={() => setDrawerOpen(true)} sx={{ minHeight: 44 }}>
            Фильтры
          </AppButton>
        )}
      </Stack>

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onReset={() => {
          setRole('all')
          setStatus('all')
          setSort('created')
        }}
      >
        {filtersUi}
      </FilterDrawer>

      {usersQuery.isLoading ? <LoadingState rows={4} variant="list" /> : null}
      {usersQuery.isError ? <ErrorState onRetry={() => void usersQuery.refetch()} /> : null}
      {!usersQuery.isLoading && !usersQuery.isError && items.length === 0 ? (
        <EmptyState title="Пользователи не найдены" />
      ) : null}

      {!isDesktop ? (
        <Stack spacing={1.5}>
          {items.map((user) => (
            <Card key={user.id} variant="outlined">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ minWidth: 0, pr: 1 }}>
                    <Stack direction="row" spacing={1} sx={{ mb: 0.75 }} flexWrap="wrap" useFlexGap>
                      <SystemRoleChip role={user.systemRole ?? user.role} />
                      <PlatformStatusChip status={user.status} kind="user" />
                    </Stack>
                    <Typography
                      variant="h4"
                      component={RouterLink}
                      to={adminUserPath(user.id)}
                      sx={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      {user.firstName} {user.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.email}
                      {user.companyName ? ` · ${user.companyName}` : ''}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Создан: {formatDate(user.createdAt)}
                      {user.lastActiveAt ? ` · активность ${formatDate(user.lastActiveAt)}` : ''}
                    </Typography>
                  </Box>
                  {menuFor(user)}
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      ) : items.length > 0 ? (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Имя</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Роль</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Компания</TableCell>
              <TableCell>Активность</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>
                  <Typography
                    component={RouterLink}
                    to={adminUserPath(user.id)}
                    variant="body2"
                    fontWeight={600}
                    sx={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    {user.firstName} {user.lastName}
                  </Typography>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <SystemRoleChip role={user.systemRole ?? user.role} />
                </TableCell>
                <TableCell>
                  <PlatformStatusChip status={user.status} kind="user" />
                </TableCell>
                <TableCell>{user.companyName ?? '—'}</TableCell>
                <TableCell>
                  {user.lastActiveAt ? formatDate(user.lastActiveAt) : '—'}
                </TableCell>
                <TableCell align="right">{menuFor(user)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}

      <DangerActionDialog
        open={Boolean(dialog)}
        title={
          dialog?.kind === 'block'
            ? `Заблокировать ${dialog.user.firstName}?`
            : dialog?.kind === 'unblock'
              ? `Разблокировать ${dialog.user.firstName}?`
              : dialog?.kind === 'suspend'
                ? `Приостановить доступ ${dialog.user.firstName}?`
                : dialog?.kind === 'activate'
                  ? `Активировать ${dialog.user.firstName}?`
                  : ''
        }
        description={
          dialog?.kind === 'block'
            ? 'Пользователь потеряет доступ к платформе. Действие попадёт в audit log.'
            : dialog?.kind === 'suspend'
              ? 'Временная приостановка доступа. Требуется причина.'
              : 'Укажите причину для audit log.'
        }
        confirmLabel={
          dialog?.kind === 'block'
            ? 'Заблокировать'
            : dialog?.kind === 'unblock'
              ? 'Разблокировать'
              : dialog?.kind === 'suspend'
                ? 'Приостановить'
                : 'Активировать'
        }
        loading={
          blockUser.isPending ||
          unblockUser.isPending ||
          suspendUser.isPending ||
          activateUser.isPending
        }
        onClose={() => setDialog(null)}
        onConfirm={() => void runDialog()}
      >
        {dialog?.kind === 'block' || dialog?.kind === 'suspend' ? (
          <Controller
            name="reasonCode"
            control={form.control}
            render={({ field }) => (
              <AppSelect
                label="Код причины"
                value={field.value}
                onChange={field.onChange}
                options={BLOCK_USER_REASON_OPTIONS.map((o) => ({
                  value: o.value,
                  label: REASON_LABELS_RU[o.value] ?? o.label,
                }))}
                sx={{ mb: 2, mt: 1 }}
              />
            )}
          />
        ) : null}
        <Controller
          name="reason"
          control={form.control}
          render={({ field, fieldState }) =>
            dialog?.kind === 'block' || dialog?.kind === 'suspend' ? (
              <AppTextarea
                {...field}
                label="Причина"
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                minRows={3}
              />
            ) : (
              <AppInput
                {...field}
                label="Комментарий (опционально)"
                sx={{ mt: 1 }}
              />
            )
          }
        />
      </DangerActionDialog>
    </Box>
  )
}
