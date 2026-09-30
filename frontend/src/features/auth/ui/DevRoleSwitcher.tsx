import { useNavigate } from 'react-router-dom'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { COMPANY_MEMBER_ROLE_LABELS } from '@/entities/company-member'
import { SYSTEM_ROLES } from '@/entities/user'
import { DEV_PERSONAS, type DevPersonaId } from '@/features/auth/model/devPersonas'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { getHomePathForPersona } from '@/shared/mocks/user'
import { USE_MOCK_API } from '@/shared/config/env'

const isDev = import.meta.env.DEV || USE_MOCK_API

function systemRoleLabel(systemRole: (typeof DEV_PERSONAS)[number]['systemRole']): string {
  switch (systemRole) {
    case SYSTEM_ROLES.BUSINESS_USER:
      return 'Business User'
    case SYSTEM_ROLES.COMPANY_ADMIN:
      return 'Company Admin'
    case SYSTEM_ROLES.MODERATOR:
      return 'Moderator'
    case SYSTEM_ROLES.PLATFORM_ADMIN:
      return 'Platform Admin'
    default:
      return systemRole
  }
}

function companyRoleLabel(
  memberRole: (typeof DEV_PERSONAS)[number]['companyMemberRole'],
): string | null {
  if (!memberRole) return null
  if (memberRole === 'COMPANY_ADMIN') return 'Admin'
  if (memberRole === 'MANAGER') return 'Manager'
  if (memberRole === 'VIEWER') return 'Viewer'
  return COMPANY_MEMBER_ROLE_LABELS[memberRole]
}

export function DevRoleSwitcher() {
  const activePersonaId = useSessionStore((s) => s.activePersonaId)
  const company = useSessionStore((s) => s.company)
  const role = useSessionStore((s) => s.role)
  const switchPersona = useSessionStore((s) => s.switchPersona)
  const isLoading = useSessionStore((s) => s.isLoading)
  const navigate = useNavigate()

  if (!isDev || !activePersonaId) return null

  // Desktop company sidebar already has persona switcher — keep overlay for mobile / staff only
  const hasSidebarSwitcher =
    Boolean(company) &&
    role !== SYSTEM_ROLES.MODERATOR &&
    role !== SYSTEM_ROLES.PLATFORM_ADMIN

  return (
    <Paper
      elevation={4}
      sx={{
        position: 'fixed',
        right: 12,
        bottom: { xs: 'calc(72px + env(safe-area-inset-bottom))', md: 16 },
        zIndex: (t) => t.zIndex.tooltip,
        p: 1.25,
        minWidth: 280,
        maxWidth: 340,
        bgcolor: 'background.paper',
        border: '1px dashed',
        borderColor: 'warning.main',
        display: hasSidebarSwitcher ? { xs: 'block', md: 'none' } : 'block',
      }}
    >
      <Typography variant="caption" color="warning.dark" fontWeight={700} display="block" mb={0.5}>
        Demo mode
      </Typography>
      <FormControl size="small" fullWidth>
        <InputLabel id="dev-persona-label">Персона</InputLabel>
        <Select
          labelId="dev-persona-label"
          label="Персона"
          value={activePersonaId}
          disabled={isLoading}
          onChange={(e) => {
            const next = e.target.value as DevPersonaId
            void switchPersona(next).then(() => {
              navigate(getHomePathForPersona(next), { replace: true })
            })
          }}
          renderValue={(selected) => {
            const persona = DEV_PERSONAS.find((p) => p.id === selected)
            if (!persona) return selected
            const cr = companyRoleLabel(persona.companyMemberRole)
            return cr ? `${persona.name} · ${cr}` : `${persona.name} · ${systemRoleLabel(persona.systemRole)}`
          }}
        >
          {DEV_PERSONAS.map((persona) => {
            const cr = companyRoleLabel(persona.companyMemberRole)
            return (
              <MenuItem key={persona.id} value={persona.id} sx={{ py: 1.25, alignItems: 'flex-start' }}>
                <Stack spacing={0.15}>
                  <Typography variant="body2" fontWeight={700} lineHeight={1.2}>
                    {persona.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" lineHeight={1.2}>
                    {persona.companyName ?? '—'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" lineHeight={1.2}>
                    {systemRoleLabel(persona.systemRole)}
                  </Typography>
                  {cr ? (
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="warning.dark"
                      lineHeight={1.2}
                    >
                      {cr}
                    </Typography>
                  ) : null}
                </Stack>
              </MenuItem>
            )
          })}
        </Select>
      </FormControl>
    </Paper>
  )
}
