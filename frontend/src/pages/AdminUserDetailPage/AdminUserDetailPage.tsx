import { useMemo, useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { SYSTEM_ROLES, USER_STATUS, type SystemRole } from '@/entities/user'
import {
  useAdminUser,
  useAdminUsers,
  useAuditLog,
  useBlockAdminUser,
  useUnblockAdminUser,
  useSuspendUser,
  useActivateUser,
  useChangeUserRole,
  canBlockUser,
  canSuspendUser,
  canChangeSystemRole,
  isLastPlatformAdmin,
  isCurrentUser,
  blockUserSchema,
  changeUserRoleSchema,
  type BlockUserFormValues,
  type ChangeUserRoleFormValues,
  BLOCK_USER_REASON_OPTIONS,
  SYSTEM_ROLE_LABELS,
  AUDIT_ACTION_LABELS,
  SystemRoleChip,
  PlatformStatusChip,
  DangerActionDialog,
  AuditDiffViewer,
} from '@/features/admin'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { adminCompanyPath, ROUTES } from '@/shared/constants/routes'
import { formatDate } from '@/shared/lib/format'
import {
  AppButton,
  AppInput,
  AppSelect,
  AppTextarea,
  ErrorState,
  LoadingState,
  PageHeader,
} from '@/shared/ui'

const REASON_LABELS_RU: Record<string, string> = {
  SECURITY_ISSUE: 'Проблема безопасности',
  FRAUD_ABUSE: 'Мошенничество / abuse',
  TERMS_VIOLATION: 'Нарушение правил',
  DUPLICATE_ACCOUNT: 'Дублирующий аккаунт',
  ADMINISTRATIVE_DECISION: 'Административное решение',
  OTHER: 'Другое',
}

type ActionKind = 'block' | 'unblock' | 'suspend' | 'activate' | 'role' | null

export function AdminUserDetailPage() {
  const { id = '' } = useParams()
  const userQuery = useAdminUser(id)
  const allUsersQuery = useAdminUsers()
  const auditQuery = useAuditLog({ entityType: 'user', query: id })
  const currentUserId = useSessionStore((s) => s.user?.id ?? 'user-platform-admin')
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)

  const blockUser = useBlockAdminUser()
  const unblockUser = useUnblockAdminUser()
  const suspendUser = useSuspendUser()
  const activateUser = useActivateUser()
  const changeRole = useChangeUserRole()

  const [tab, setTab] = useState(0)
  const [action, setAction] = useState<ActionKind>(null)

  const blockForm = useForm<BlockUserFormValues>({
    resolver: zodResolver(blockUserSchema),
    defaultValues: { reasonCode: 'ADMINISTRATIVE_DECISION', reason: '' },
  })
  const roleForm = useForm<ChangeUserRoleFormValues>({
    resolver: zodResolver(changeUserRoleSchema),
    defaultValues: {
      newRole: SYSTEM_ROLES.BUSINESS_USER,
      reason: '',
      confirmPlatformAdmin: false,
    },
  })

  const allUsers = allUsersQuery.data ?? []
  const user = userQuery.data

  const protections = useMemo(() => {
    if (!user) return { self: false, lastAdmin: false, block: { allowed: true }, suspend: { allowed: true } }
    return {
      self: isCurrentUser(user.id, currentUserId),
      lastAdmin: isLastPlatformAdmin(allUsers, user.id),
      block: canBlockUser({ target: user, currentUserId, allUsers }),
      suspend: canSuspendUser({ target: user, currentUserId, allUsers }),
    }
  }, [user, currentUserId, allUsers])

  if (userQuery.isLoading) return <LoadingState variant="page" />
  if (userQuery.isError || !user) {
    return <ErrorState onRetry={() => void userQuery.refetch()} />
  }

  const openAction = (kind: Exclude<ActionKind, null>) => {
    blockForm.reset({ reasonCode: 'ADMINISTRATIVE_DECISION', reason: '' })
    roleForm.reset({
      newRole: user.systemRole ?? user.role,
      reason: '',
      confirmPlatformAdmin: false,
    })
    setAction(kind)
  }

  const submitBlockLike = blockForm.handleSubmit(async (values) => {
    const reason = `${REASON_LABELS_RU[values.reasonCode] ?? values.reasonCode}: ${values.reason}`
    try {
      if (action === 'block') {
        if (!protections.block.allowed) {
          showError(protections.block.reason ?? 'Недоступно')
          return
        }
        await blockUser.mutateAsync({ id: user.id, reason })
        showSuccess('Пользователь заблокирован')
      } else if (action === 'suspend') {
        if (!protections.suspend.allowed) {
          showError(protections.suspend.reason ?? 'Недоступно')
          return
        }
        await suspendUser.mutateAsync({ id: user.id, reason })
        showSuccess('Доступ приостановлен')
      }
      setAction(null)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Ошибка')
    }
  })

  const submitUnblockActivate = async () => {
    const reason = blockForm.getValues('reason') || undefined
    try {
      if (action === 'unblock') {
        await unblockUser.mutateAsync({ id: user.id, reason })
        showSuccess('Пользователь разблокирован')
      } else if (action === 'activate') {
        await activateUser.mutateAsync({ id: user.id, reason })
        showSuccess('Пользователь активирован')
      }
      setAction(null)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  const submitRole = roleForm.handleSubmit(async (values) => {
    const check = canChangeSystemRole({
      target: user,
      newRole: values.newRole as SystemRole,
      currentUserId,
      allUsers,
    })
    if (!check.allowed) {
      showError(check.reason ?? 'Смена роли недоступна')
      return
    }
    if (
      values.newRole === SYSTEM_ROLES.PLATFORM_ADMIN &&
      !values.confirmPlatformAdmin
    ) {
      showError('Подтвердите назначение Platform Admin')
      return
    }
    try {
      await changeRole.mutateAsync({
        id: user.id,
        newRole: values.newRole as SystemRole,
        reason: values.reason,
      })
      showSuccess('Роль обновлена')
      setAction(null)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Ошибка')
    }
  })

  const auditEvents = (auditQuery.data ?? []).filter(
    (e) => e.entityId === user.id || e.entityType === 'user',
  )

  return (
    <Box>
      <PageHeader
        title={`${user.firstName} ${user.lastName}`}
        subtitle={user.email}
        actions={
          <AppButton component={RouterLink} to={ROUTES.ADMIN_USERS} variant="text" sx={{ minHeight: 44 }}>
            К списку
          </AppButton>
        }
      />

      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <SystemRoleChip role={user.systemRole ?? user.role} />
        <PlatformStatusChip status={user.status} kind="user" />
      </Stack>

      {protections.self ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          Это ваша учётная запись. Самоблокировка недоступна.
        </Alert>
      ) : null}
      {protections.lastAdmin ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Это последний активный Platform Admin. Блокировка и понижение роли запрещены.
        </Alert>
      ) : null}
      {!protections.block.allowed && protections.block.reason ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {protections.block.reason}
        </Alert>
      ) : null}

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
        {user.status === USER_STATUS.BLOCKED ? (
          <AppButton variant="contained" onClick={() => openAction('unblock')} sx={{ minHeight: 44 }}>
            Разблокировать
          </AppButton>
        ) : (
          <AppButton
            variant="outlined"
            color="error"
            disabled={!protections.block.allowed}
            onClick={() => openAction('block')}
            sx={{ minHeight: 44 }}
          >
            Заблокировать
          </AppButton>
        )}
        {user.status === USER_STATUS.SUSPENDED ? (
          <AppButton variant="outlined" onClick={() => openAction('activate')} sx={{ minHeight: 44 }}>
            Активировать
          </AppButton>
        ) : user.status !== USER_STATUS.BLOCKED ? (
          <AppButton
            variant="outlined"
            color="warning"
            disabled={!protections.suspend.allowed}
            onClick={() => openAction('suspend')}
            sx={{ minHeight: 44 }}
          >
            Приостановить
          </AppButton>
        ) : null}
        <AppButton variant="outlined" onClick={() => openAction('role')} sx={{ minHeight: 44 }}>
          Сменить роль
        </AppButton>
      </Stack>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{ mb: 2 }}
      >
        <Tab label="Обзор" />
        <Tab label="Компания" />
        <Tab label="Активность" />
        <Tab label="Модерация" />
        <Tab label="Audit" />
      </Tabs>

      {tab === 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={1.25}>
              <Typography variant="body2" color="text.secondary">
                MAX user id
              </Typography>
              <Typography>{user.maxUserId}</Typography>
              <Typography variant="body2" color="text.secondary">
                Создан
              </Typography>
              <Typography>{formatDate(user.createdAt)}</Typography>
              <Typography variant="body2" color="text.secondary">
                Последняя активность
              </Typography>
              <Typography>
                {user.lastActiveAt ? formatDate(user.lastActiveAt) : 'Ещё не входил'}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      ) : null}

      {tab === 1 ? (
        <Card variant="outlined">
          <CardContent>
            {user.companyId ? (
              <Stack spacing={1}>
                <Typography variant="h4">{user.companyName}</Typography>
                <AppButton
                  component={RouterLink}
                  to={adminCompanyPath(user.companyId)}
                  variant="outlined"
                  sx={{ alignSelf: 'flex-start', minHeight: 44 }}
                >
                  Открыть компанию
                </AppButton>
              </Stack>
            ) : (
              <Typography color="text.secondary">Не привязан к компании</Typography>
            )}
          </CardContent>
        </Card>
      ) : null}

      {tab === 2 ? (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Последний вход / активность:{' '}
              {user.lastLoginAt || user.lastActiveAt
                ? formatDate((user.lastLoginAt ?? user.lastActiveAt)!)
                : 'нет данных'}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Детальная лента активности собирается из audit log (вкладка Audit).
            </Typography>
          </CardContent>
        </Card>
      ) : null}

      {tab === 3 ? (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="body1">
              Модерационные решения, связанные с пользователем, отображаются в общей очереди
              модерации.
            </Typography>
            <AppButton
              component={RouterLink}
              to={ROUTES.ADMIN_MODERATION}
              sx={{ mt: 1.5, minHeight: 44 }}
              variant="outlined"
            >
              К модерации
            </AppButton>
          </CardContent>
        </Card>
      ) : null}

      {tab === 4 ? (
        <Stack spacing={1}>
          {auditQuery.isLoading ? <LoadingState rows={2} /> : null}
          {auditEvents.length === 0 && !auditQuery.isLoading ? (
            <Typography color="text.secondary">Событий audit пока нет</Typography>
          ) : null}
          {auditEvents.map((ev) => (
            <Card key={ev.id} variant="outlined">
              <CardContent>
                <Typography variant="subtitle2">
                  {AUDIT_ACTION_LABELS[ev.action] ?? ev.action}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {ev.actorName} · {formatDate(ev.timestamp)}
                </Typography>
                {ev.reason ? (
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    Причина: {ev.reason}
                  </Typography>
                ) : null}
                <AuditDiffViewer
                  before={ev.before}
                  after={ev.after}
                  previousValue={ev.previousValue}
                  newValue={ev.newValue}
                />
              </CardContent>
            </Card>
          ))}
        </Stack>
      ) : null}

      <DangerActionDialog
        open={action === 'block' || action === 'suspend'}
        title={action === 'block' ? 'Заблокировать пользователя?' : 'Приостановить доступ?'}
        description="Причина обязательна и будет записана в audit log."
        confirmLabel={action === 'block' ? 'Заблокировать' : 'Приостановить'}
        loading={blockUser.isPending || suspendUser.isPending}
        onClose={() => setAction(null)}
        onConfirm={() => void submitBlockLike()}
      >
        <Controller
          name="reasonCode"
          control={blockForm.control}
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
        <Controller
          name="reason"
          control={blockForm.control}
          render={({ field, fieldState }) => (
            <AppTextarea
              {...field}
              label="Причина"
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
              minRows={3}
            />
          )}
        />
      </DangerActionDialog>

      <DangerActionDialog
        open={action === 'unblock' || action === 'activate'}
        title={action === 'unblock' ? 'Разблокировать?' : 'Активировать?'}
        description="Можно указать комментарий для audit log."
        confirmLabel={action === 'unblock' ? 'Разблокировать' : 'Активировать'}
        loading={unblockUser.isPending || activateUser.isPending}
        onClose={() => setAction(null)}
        onConfirm={() => void submitUnblockActivate()}
      >
        <Controller
          name="reason"
          control={blockForm.control}
          render={({ field }) => (
            <AppInput {...field} label="Комментарий (опционально)" sx={{ mt: 1 }} />
          )}
        />
      </DangerActionDialog>

      <DangerActionDialog
        open={action === 'role'}
        title="Сменить системную роль"
        description="Смена роли Platform Admin требует явного подтверждения."
        confirmLabel="Сохранить роль"
        loading={changeRole.isPending}
        onClose={() => setAction(null)}
        onConfirm={() => void submitRole()}
      >
        <Controller
          name="newRole"
          control={roleForm.control}
          render={({ field, fieldState }) => (
            <AppSelect
              label="Новая роль"
              value={field.value}
              onChange={field.onChange}
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
              options={Object.values(SYSTEM_ROLES).map((r) => ({
                value: r,
                label: SYSTEM_ROLE_LABELS[r] ?? r,
              }))}
              sx={{ mb: 2, mt: 1 }}
            />
          )}
        />
        <Controller
          name="reason"
          control={roleForm.control}
          render={({ field, fieldState }) => (
            <AppTextarea
              {...field}
              label="Причина"
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
              minRows={3}
              sx={{ mb: 2 }}
            />
          )}
        />
        <Controller
          name="confirmPlatformAdmin"
          control={roleForm.control}
          render={({ field }) =>
            roleForm.watch('newRole') === SYSTEM_ROLES.PLATFORM_ADMIN ? (
              <AppSelect
                label="Подтверждение Platform Admin"
                value={field.value ? 'yes' : 'no'}
                onChange={(v) => field.onChange(v === 'yes')}
                options={[
                  { value: 'no', label: 'Не подтверждаю' },
                  { value: 'yes', label: 'Подтверждаю назначение Platform Admin' },
                ]}
              />
            ) : (
              <span />
            )
          }
        />
      </DangerActionDialog>
    </Box>
  )
}
