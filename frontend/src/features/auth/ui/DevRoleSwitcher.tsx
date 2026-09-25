import { useNavigate } from 'react-router-dom'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { SYSTEM_ROLES, type SystemRole } from '@/entities/user'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { getHomePathForRole } from '@/shared/mocks/user'
import { USE_MOCK_API } from '@/shared/config/env'

const ROLE_OPTIONS: { value: SystemRole; label: string }[] = [
  { value: SYSTEM_ROLES.BUSINESS_USER, label: 'DEV: Business User' },
  { value: SYSTEM_ROLES.COMPANY_ADMIN, label: 'DEV: Company Admin' },
  { value: SYSTEM_ROLES.MODERATOR, label: 'DEV: Moderator' },
  { value: SYSTEM_ROLES.PLATFORM_ADMIN, label: 'DEV: Platform Admin' },
]

const isDev = import.meta.env.DEV || USE_MOCK_API

export function DevRoleSwitcher() {
  const role = useSessionStore((s) => s.role)
  const switchRole = useSessionStore((s) => s.switchRole)
  const isLoading = useSessionStore((s) => s.isLoading)
  const navigate = useNavigate()

  if (!isDev || !role) return null

  return (
    <Paper
      elevation={4}
      sx={{
        position: 'fixed',
        right: 12,
        bottom: { xs: 'calc(72px + env(safe-area-inset-bottom))', md: 16 },
        zIndex: (t) => t.zIndex.tooltip,
        p: 1.25,
        minWidth: 200,
        bgcolor: 'background.paper',
        border: '1px dashed',
        borderColor: 'warning.main',
      }}
    >
      <Typography variant="caption" color="warning.dark" fontWeight={700} display="block" mb={0.5}>
        Demo mode
      </Typography>
      <FormControl size="small" fullWidth>
        <InputLabel id="dev-role-label">Роль</InputLabel>
        <Select
          labelId="dev-role-label"
          label="Роль"
          value={role}
          disabled={isLoading}
          onChange={(e) => {
            const next = e.target.value as SystemRole
            void switchRole(next).then(() => {
              navigate(getHomePathForRole(next), { replace: true })
            })
          }}
        >
          {ROLE_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Paper>
  )
}
