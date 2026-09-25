import { Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { Permission } from '@/features/permissions'
import { usePermission } from '@/features/permissions/hooks/usePermission'
import { ROUTES } from '@/shared/constants/routes'
import { AppButton, EmptyState, PageHeader } from '@/shared/ui'

type Cell = 'full' | 'limited' | 'none'

const MATRIX: { permission: string; admin: Cell; manager: Cell; viewer: Cell }[] = [
  { permission: 'Просмотр профиля компании', admin: 'full', manager: 'full', viewer: 'full' },
  { permission: 'Редактирование профиля', admin: 'full', manager: 'limited', viewer: 'none' },
  { permission: 'Управление командой', admin: 'full', manager: 'none', viewer: 'none' },
  { permission: 'Управление услугами', admin: 'full', manager: 'full', viewer: 'none' },
  { permission: 'Управление кейсами', admin: 'full', manager: 'full', viewer: 'none' },
  { permission: 'Управление документами', admin: 'full', manager: 'limited', viewer: 'none' },
  { permission: 'Настройка прав доступа', admin: 'full', manager: 'none', viewer: 'none' },
  { permission: 'Публикация запросов', admin: 'full', manager: 'full', viewer: 'none' },
  { permission: 'Отклики и shortlist', admin: 'full', manager: 'full', viewer: 'limited' },
  { permission: 'Старт переговоров', admin: 'full', manager: 'full', viewer: 'none' },
]

const CELL_LABEL: Record<Cell, string> = {
  full: 'Полный',
  limited: 'Ограниченный',
  none: 'Нет',
}

export function CompanyPermissionsPage() {
  const canManage = usePermission(Permission.MANAGE_COMPANY_PERMISSIONS)

  if (!canManage) {
    return <EmptyState title="Нет доступа" description="Матрица прав недоступна." />
  }

  return (
    <Box>
      <PageHeader
        title="Права доступа"
        subtitle="Фиксированная матрица ролей компании"
        actions={
          <AppButton component={RouterLink} to={ROUTES.COMPANY_ADMIN} variant="outlined">
            Назад
          </AppButton>
        }
      />

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Роли внутри компании: Company Admin, Manager, Viewer. Изменение матрицы на платформе пока
        недоступно — отображается эталонная схема.
      </Typography>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Право</TableCell>
            <TableCell>Admin</TableCell>
            <TableCell>Manager</TableCell>
            <TableCell>Viewer</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {MATRIX.map((row) => (
            <TableRow key={row.permission}>
              <TableCell>{row.permission}</TableCell>
              <TableCell>{CELL_LABEL[row.admin]}</TableCell>
              <TableCell>{CELL_LABEL[row.manager]}</TableCell>
              <TableCell>{CELL_LABEL[row.viewer]}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Stack sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Полный — все действия · Ограниченный — только просмотр или частичные действия · Нет —
          запрещено
        </Typography>
      </Stack>
    </Box>
  )
}
