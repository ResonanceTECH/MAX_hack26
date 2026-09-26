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
import {
  COMPANY_PERMISSION_MATRIX_ROWS,
  COMPANY_ROLE_PERMISSIONS,
} from '@/features/permissions/model/companyRolePermissions'

type Cell = 'full' | 'none'

const CELL_LABEL: Record<Cell, string> = {
  full: 'Полный',
  none: 'Нет',
}

const ROLE_ORDER: CompanyMemberRole[] = [
  COMPANY_MEMBER_ROLES.COMPANY_ADMIN,
  COMPANY_MEMBER_ROLES.MANAGER,
  COMPANY_MEMBER_ROLES.VIEWER,
]

function cellFor(role: CompanyMemberRole, permission: (typeof COMPANY_PERMISSION_MATRIX_ROWS)[number]['permission']): Cell {
  return COMPANY_ROLE_PERMISSIONS[role].includes(permission) ? 'full' : 'none'
}

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
              {ROLE_ORDER.map((role) => (
                <TableCell key={role}>{COMPANY_MEMBER_ROLE_LABELS[role]}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {COMPANY_PERMISSION_MATRIX_ROWS.map((row) => (
              <TableRow key={row.permission}>
                <TableCell>{row.label}</TableCell>
                {ROLE_ORDER.map((role) => (
                  <TableCell key={role}>{CELL_LABEL[cellFor(role, row.permission)]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Полный — право есть · Нет — запрещено
        </Typography>
      </Box>
    )
  }

  const activeRole = ROLE_ORDER[roleTab]!

  return (
    <Box>
      <Tabs
        value={roleTab}
        onChange={(_, v: number) => setRoleTab(v)}
        variant="fullWidth"
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        {ROLE_ORDER.map((role) => (
          <Tab key={role} label={COMPANY_MEMBER_ROLE_LABELS[role]} />
        ))}
      </Tabs>
      <Stack spacing={1}>
        {COMPANY_PERMISSION_MATRIX_ROWS.map((row) => (
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
            <Typography variant="body2">{row.label}</Typography>
            <Typography variant="body2" fontWeight={600} color="text.secondary">
              {CELL_LABEL[cellFor(activeRole, row.permission)]}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  )
}
