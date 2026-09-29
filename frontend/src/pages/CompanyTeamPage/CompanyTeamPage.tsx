import { useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import {
  COMPANY_MEMBER_ROLES,
  COMPANY_MEMBER_STATUS,
  type CompanyMember,
  type CompanyMemberRole,
  type CompanyMemberStatus,
} from '@/entities/company-member'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import {
  BaseUiMenu,
  MemberRoleChip,
  MemberStatusChip,
  useActivateMember,
  useCompanyMembers,
  useRemoveMember,
  useSuspendMember,
  useUpdateMemberRole,
} from '@/features/company-management'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { TeamApiError } from '@/shared/api/teamApi'
import { companyTeamMemberPath, ROUTES } from '@/shared/constants/routes'
import {
  AppButton,
  AppSelect,
  BentoGrid,
  BentoTile,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  SearchInput,
} from '@/shared/ui'

type ConfirmAction = { type: 'suspend' | 'remove'; member: CompanyMember }
type StatusFilter = 'all' | CompanyMemberStatus | 'hide_deactivated'
type SortKey = 'name' | 'role' | 'status'

export function CompanyTeamPage() {
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
  const companyId = useSessionStore((s) => s.company?.id)
  const { data, isLoading, isError, refetch } = useCompanyMembers(companyId)
  const updateRole = useUpdateMemberRole(companyId)
  const suspend = useSuspendMember(companyId)
  const activate = useActivateMember(companyId)
  const remove = useRemoveMember(companyId)
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)

  const [confirm, setConfirm] = useState<ConfirmAction | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('hide_deactivated')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [sort, setSort] = useState<SortKey>('name')

  const summary = useMemo(() => {
    const list = data ?? []
    return {
      total: list.filter((m) => m.status !== COMPANY_MEMBER_STATUS.DEACTIVATED).length,
      active: list.filter((m) => m.status === COMPANY_MEMBER_STATUS.ACTIVE).length,
      invited: list.filter((m) => m.status === COMPANY_MEMBER_STATUS.INVITED).length,
      suspended: list.filter((m) => m.status === COMPANY_MEMBER_STATUS.SUSPENDED).length,
      admins: list.filter(
        (m) =>
          m.role === COMPANY_MEMBER_ROLES.COMPANY_ADMIN &&
          m.status !== COMPANY_MEMBER_STATUS.SUSPENDED &&
          m.status !== COMPANY_MEMBER_STATUS.DEACTIVATED,
      ).length,
    }
  }, [data])

  const filtered = useMemo(() => {
    let list = [...(data ?? [])]
    if (statusFilter === 'hide_deactivated') {
      list = list.filter((m) => m.status !== COMPANY_MEMBER_STATUS.DEACTIVATED)
    } else if (statusFilter !== 'all') {
      list = list.filter((m) => m.status === statusFilter)
    }
    if (roleFilter !== 'all') {
      list = list.filter((m) => m.role === roleFilter)
    }
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (m) =>
          m.email.toLowerCase().includes(q) ||
          `${m.firstName} ${m.lastName}`.toLowerCase().includes(q),
      )
    }
    list.sort((a, b) => {
      if (sort === 'role') return a.role.localeCompare(b.role)
      if (sort === 'status') return a.status.localeCompare(b.status)
      return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, 'ru')
    })
    return list
  }, [data, search, statusFilter, roleFilter, sort])

  const handleRoleChange = async (member: CompanyMember, role: CompanyMemberRole) => {
    try {
      await updateRole.mutateAsync({ memberId: member.id, role })
      showSuccess('Роль обновлена')
    } catch (err) {
      showError(err instanceof TeamApiError ? err.message : 'Не удалось сменить роль')
    }
  }

  const runConfirm = async () => {
    if (!confirm) return
    try {
      if (confirm.type === 'suspend') {
        await suspend.mutateAsync(confirm.member.id)
        showSuccess('Доступ сотрудника приостановлен')
      } else {
        await remove.mutateAsync(confirm.member.id)
        showSuccess('Сотрудник удалён')
      }
      setConfirm(null)
    } catch (err) {
      showError(err instanceof TeamApiError ? err.message : 'Операция не выполнена')
      setConfirm(null)
    }
  }

  const renderActions = (member: CompanyMember) => {
    const isLastAdmin =
      member.role === COMPANY_MEMBER_ROLES.COMPANY_ADMIN &&
      member.status !== COMPANY_MEMBER_STATUS.SUSPENDED &&
      member.status !== COMPANY_MEMBER_STATUS.DEACTIVATED &&
      summary.admins <= 1
    const items: import('@/features/company-management').BaseUiMenuItem[] = [
      {
        key: 'open',
        label: 'Открыть',
        onClick: () => {
          window.location.assign(companyTeamMemberPath(member.id))
        },
      },
    ]
    if (member.status === COMPANY_MEMBER_STATUS.SUSPENDED) {
      items.push({
        key: 'activate',
        label: 'Восстановить',
        onClick: () => {
          void activate.mutateAsync(member.id).then(() => showSuccess('Доступ восстановлен'))
        },
      })
    } else if (member.status !== COMPANY_MEMBER_STATUS.DEACTIVATED) {
      items.push({
        key: 'suspend',
        label: 'Приостановить',
        onClick: () => {
          if (!isLastAdmin) setConfirm({ type: 'suspend', member })
          else showError('В компании должен оставаться минимум один администратор.')
        },
      })
    }
    if (member.status !== COMPANY_MEMBER_STATUS.DEACTIVATED) {
      items.push({
        key: 'remove',
        label: 'Удалить',
        destructive: true,
        separatorBefore: true,
        disabled: isLastAdmin,
        onClick: () => {
          if (!isLastAdmin) setConfirm({ type: 'remove', member })
          else showError('В компании должен оставаться минимум один администратор.')
        },
      })
    }
    return <BaseUiMenu items={items} aria-label={`Действия: ${member.firstName}`} />
  }

  return (
    <Box>
      <PageHeader
        title="Сотрудники"
        subtitle="Команда и роли в компании"
        actions={
          <AppButton
            component={RouterLink}
            to={ROUTES.PROFILE_COMPANY_TEAM_INVITE}
            variant="contained"
          >
            Пригласить
          </AppButton>
        }
      />


      <BentoGrid>
        <BentoTile span={12}>
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Всего: {summary.total}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Активны: {summary.active}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Приглашены: {summary.invited}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Приостановлены: {summary.suspended}
        </Typography>
      </Stack>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ mb: 2 }}
        alignItems={{ sm: 'center' }}
      >
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Поиск по имени или email"
          />
        </Box>
        <AppSelect
          label="Статус"
          size="small"
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as StatusFilter)}
          options={[
            { value: 'hide_deactivated', label: 'Без удалённых' },
            { value: 'all', label: 'Все статусы' },
            { value: COMPANY_MEMBER_STATUS.ACTIVE, label: 'Активен' },
            { value: COMPANY_MEMBER_STATUS.INVITED, label: 'Приглашён' },
            { value: COMPANY_MEMBER_STATUS.SUSPENDED, label: 'Приостановлен' },
            { value: COMPANY_MEMBER_STATUS.DEACTIVATED, label: 'Удалён' },
          ]}
          sx={{ minWidth: 160 }}
        />
        <AppSelect
          label="Роль"
          size="small"
          value={roleFilter}
          onChange={setRoleFilter}
          options={[
            { value: 'all', label: 'Все роли' },
            ...Object.values(COMPANY_MEMBER_ROLES).map((r) => ({
              value: r,
              label: r === 'COMPANY_ADMIN' ? 'Администратор' : r === 'MANAGER' ? 'Менеджер' : 'Наблюдатель',
            })),
          ]}
          sx={{ minWidth: 140 }}
        />
        <AppSelect
          label="Сортировка"
          size="small"
          value={sort}
          onChange={(v) => setSort(v as SortKey)}
          options={[
            { value: 'name', label: 'По имени' },
            { value: 'role', label: 'По роли' },
            { value: 'status', label: 'По статусу' },
          ]}
          sx={{ minWidth: 140 }}
        />
      </Stack>

      {isLoading ? <LoadingState variant="list" /> : null}
      {isError ? <ErrorState onRetry={() => void refetch()} /> : null}
      {!isLoading && !isError && filtered.length === 0 ? (
        <EmptyState
          title="Сотрудники не найдены"
          description="Измените фильтры или пригласите коллег."
          actionLabel="Пригласить"
          onAction={() => {
            window.location.assign(ROUTES.PROFILE_COMPANY_TEAM_INVITE)
          }}
        />
      ) : null}

      {!isLoading && !isError && filtered.length > 0 && isDesktop ? (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Сотрудник</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Роль</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((member) => (
              <TableRow key={member.id} hover>
                <TableCell>
                  <Typography
                    component={RouterLink}
                    to={companyTeamMemberPath(member.id)}
                    variant="body2"
                    fontWeight={600}
                    color="inherit"
                    sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
                  >
                    {member.firstName} {member.lastName}
                  </Typography>
                </TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>
                  <AppSelect
                    label="Роль"
                    size="small"
                    options={Object.values(COMPANY_MEMBER_ROLES).map((role) => ({
                      value: role,
                      label:
                        role === 'COMPANY_ADMIN'
                          ? 'Администратор'
                          : role === 'MANAGER'
                            ? 'Менеджер'
                            : 'Наблюдатель',
                    }))}
                    value={member.role}
                    onChange={(value) => void handleRoleChange(member, value as CompanyMemberRole)}
                    disabled={member.status === COMPANY_MEMBER_STATUS.DEACTIVATED}
                    sx={{ minWidth: 150 }}
                  />
                </TableCell>
                <TableCell>
                  <MemberStatusChip status={member.status} />
                </TableCell>
                <TableCell align="right">{renderActions(member)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}

      {!isLoading && !isError && filtered.length > 0 && !isDesktop ? (
        <Stack spacing={1.5}>
          {filtered.map((member) => (
            <Box
              key={member.id}
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography
                    component={RouterLink}
                    to={companyTeamMemberPath(member.id)}
                    variant="subtitle1"
                    fontWeight={600}
                    color="inherit"
                    sx={{ textDecoration: 'none' }}
                  >
                    {member.firstName} {member.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {member.email}
                  </Typography>
                  <Stack direction="row" spacing={0.75} sx={{ mt: 1 }}>
                    <MemberRoleChip role={member.role} />
                    <MemberStatusChip status={member.status} />
                  </Stack>
                </Box>
                {renderActions(member)}
              </Stack>
            </Box>
          ))}
        </Stack>
      ) : null}

        </BentoTile>
      </BentoGrid>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.type === 'remove' ? 'Удалить сотрудника?' : 'Приостановить доступ?'}
        description={
          confirm
            ? `${confirm.member.firstName} ${confirm.member.lastName} (${confirm.member.email})`
            : undefined
        }
        confirmLabel={confirm?.type === 'remove' ? 'Удалить' : 'Приостановить'}
        destructive
        loading={suspend.isPending || remove.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={() => void runConfirm()}
      />
    </Box>
  )
}
