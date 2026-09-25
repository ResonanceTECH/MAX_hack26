import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { useState } from 'react'
import {
  COMPANY_MEMBER_ROLE_LABELS,
  COMPANY_MEMBER_ROLES,
  type CompanyMemberRole,
} from '@/entities/company-member'

type Cell = 'full' | 'limited' | 'none'

interface MatrixRow {
  permission: string
  admin: Cell
  manager: Cell
  viewer: Cell
}

const MATRIX: MatrixRow[] = [
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

const ROLE_KEYS: { role: CompanyMemberRole; key: keyof Pick<MatrixRow, 'admin' | 'manager' | 'viewer'> }[] =
  [
    { role: COMPANY_MEMBER_ROLES.COMPANY_ADMIN, key: 'admin' },
    { role: COMPANY_MEMBER_ROLES.MANAGER, key: 'manager' },
    { role: COMPANY_MEMBER_ROLES.VIEWER, key: 'viewer' },
  ]

export function PermissionMatrix() {
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
  const [roleTab, setRoleTab] = useState(0)

  if (isDesktop) {
    return (
      <Box>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Право</TableCell>
              <TableCell>{COMPANY_MEMBER_ROLE_LABELS.COMPANY_ADMIN}</TableCell>
              <TableCell>{COMPANY_MEMBER_ROLE_LABELS.MANAGER}</TableCell>
              <TableCell>{COMPANY_MEMBER_ROLE_LABELS.VIEWER}</TableCell>
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
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Полный — все действия · Ограниченный — только просмотр или частичные действия · Нет —
          запрещено
        </Typography>
      </Box>
    )
  }

  const active = ROLE_KEYS[roleTab]!

  return (
    <Box>
      <Tabs
        value={roleTab}
        onChange={(_, v: number) => setRoleTab(v)}
        variant="fullWidth"
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        {ROLE_KEYS.map((r) => (
          <Tab key={r.role} label={COMPANY_MEMBER_ROLE_LABELS[r.role]} />
        ))}
      </Tabs>
      <Stack spacing={1}>
        {MATRIX.map((row) => (
          <Box
            key={row.permission}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 1,
              py: 1,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="body2">{row.permission}</Typography>
            <Typography variant="body2" fontWeight={600} color="text.secondary">
              {CELL_LABEL[row[active.key]]}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  )
}
