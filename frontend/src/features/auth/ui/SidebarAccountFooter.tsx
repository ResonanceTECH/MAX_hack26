import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { COMPANY_MEMBER_ROLE_LABELS, type CompanyMemberRole } from '@/entities/company-member'
import { SYSTEM_ROLES } from '@/entities/user'
import { BaseUiMenu } from '@/features/company-management/ui/BaseUiMenu'
import { DEV_PERSONAS, type DevPersonaId } from '@/features/auth/model/devPersonas'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { USE_MOCK_API } from '@/shared/config/env'
import { ROUTES } from '@/shared/constants/routes'
import { getHomePathForPersona } from '@/shared/mocks/user'
import { AppIcon, CompanyAvatar, VerifiedBadge } from '@/shared/ui'
import { ArrowLeft01Icon, Building02Icon, UserCircleIcon } from '@/shared/ui/icons'

const canSwitchPersona = import.meta.env.DEV || USE_MOCK_API

const rowSx = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  borderRadius: 2,
  minHeight: 48,
  px: 2,
  py: 0.5,
  cursor: 'pointer',
  '&:hover': { bgcolor: 'action.hover' },
} as const

function memberRoleLabel(role: CompanyMemberRole | null | undefined): string | null {
  if (!role) return null
  if (role === 'COMPANY_ADMIN') return 'Admin'
  if (role === 'MANAGER') return 'Manager'
  if (role === 'VIEWER') return 'Viewer'
  return COMPANY_MEMBER_ROLE_LABELS[role]
}

function personaMenuLabel(persona: (typeof DEV_PERSONAS)[number]): string {
  const cr = memberRoleLabel(persona.companyMemberRole)
  const parts = [persona.name]
  if (persona.companyName) parts.push(persona.companyName)
  if (cr) parts.push(cr)
  return parts.join(' · ')
}

function UserRowContent({
  userName,
  roleSecondary,
  avatarUrl,
  showChevron,
}: {
  userName: string
  roleSecondary: string
  avatarUrl?: string | null
  showChevron?: boolean
}) {
  return (
    <>
      <Box sx={{ minWidth: 40, display: 'inline-flex', alignItems: 'center' }}>
        {userName ? (
          <CompanyAvatar name={userName} logoUrl={avatarUrl} size={28} />
        ) : (
          <AppIcon icon={UserCircleIcon} size={22} />
        )}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, py: 0.5 }}>
        <Typography fontSize={14} fontWeight={600} noWrap>
          {userName}
        </Typography>
        <Typography fontSize={12} color="text.secondary" noWrap>
          {roleSecondary}
        </Typography>
      </Box>
      {showChevron ? (
        <AppIcon
          icon={ArrowLeft01Icon}
          size={16}
          aria-hidden
          sx={{ transform: 'rotate(-90deg)', opacity: 0.55 }}
        />
      ) : null}
    </>
  )
}

export function SidebarAccountFooter() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useSessionStore((s) => s.user)
  const company = useSessionStore((s) => s.company)
  const role = useSessionStore((s) => s.role)
  const companyMemberRole = useSessionStore((s) => s.companyMemberRole)
  const activePersonaId = useSessionStore((s) => s.activePersonaId)
  const isLoading = useSessionStore((s) => s.isLoading)
  const switchPersona = useSessionStore((s) => s.switchPersona)

  const isStaff = role === SYSTEM_ROLES.MODERATOR || role === SYSTEM_ROLES.PLATFORM_ADMIN
  if (!company || isStaff) return null

  const userName = user ? `${user.firstName} ${user.lastName}` : 'Пользователь'
  const roleSecondary = memberRoleLabel(companyMemberRole) ?? 'Участник'

  const handleSwitch = (personaId: DevPersonaId) => {
    if (personaId === activePersonaId || isLoading) return
    void switchPersona(personaId).then(() => {
      queryClient.clear()
      navigate(getHomePathForPersona(personaId), { replace: true })
    })
  }

  return (
    <>
      <Divider />
      <List sx={{ px: 1, py: 1 }}>
        <ListItemButton
          onClick={() => void navigate(ROUTES.PROFILE_COMPANY)}
          sx={{ borderRadius: 2, minHeight: 48 }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            {company.logoUrl || company.shortName ? (
              <CompanyAvatar name={company.shortName} logoUrl={company.logoUrl} size={28} />
            ) : (
              <AppIcon icon={Building02Icon} size={22} />
            )}
          </ListItemIcon>
          <ListItemText
            primary={
              <Stack direction="row" alignItems="center" spacing={0.5} component="span">
                <Typography component="span" fontSize={14} fontWeight={600} noWrap>
                  {company.shortName}
                </Typography>
                <VerifiedBadge verified={company.verified} compact />
              </Stack>
            }
            secondary="Профиль компании"
            secondaryTypographyProps={{ fontSize: 12 }}
          />
        </ListItemButton>

        {canSwitchPersona && activePersonaId ? (
          <Box
            sx={{
              opacity: isLoading ? 0.6 : 1,
              pointerEvents: isLoading ? 'none' : 'auto',
              '& > span': { display: 'block', width: '100%' },
            }}
          >
            <BaseUiMenu
              aria-label="Переключить пользователя"
              trigger={
                <Box sx={rowSx}>
                  <UserRowContent
                    userName={userName}
                    roleSecondary={roleSecondary}
                    avatarUrl={user?.avatarUrl}
                    showChevron
                  />
                </Box>
              }
              items={DEV_PERSONAS.map((persona, index) => {
                const prev = DEV_PERSONAS[index - 1]
                const separatorBefore =
                  index > 0 && !persona.companyName && Boolean(prev?.companyName)
                return {
                  key: persona.id,
                  label:
                    persona.id === activePersonaId
                      ? `✓ ${personaMenuLabel(persona)}`
                      : personaMenuLabel(persona),
                  disabled: isLoading || persona.id === activePersonaId,
                  separatorBefore,
                  onClick: () => handleSwitch(persona.id),
                }
              })}
            />
          </Box>
        ) : (
          <Box sx={{ ...rowSx, cursor: 'default', '&:hover': { bgcolor: 'transparent' } }}>
            <UserRowContent
              userName={userName}
              roleSecondary={roleSecondary}
              avatarUrl={user?.avatarUrl}
            />
          </Box>
        )}
      </List>
    </>
  )
}
