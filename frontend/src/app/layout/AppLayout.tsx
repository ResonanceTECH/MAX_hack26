import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import { Outlet } from 'react-router-dom'
import { DevRoleSwitcher } from '@/features/auth/ui/DevRoleSwitcher'
import { AppSnackbar } from '@/features/ui/ui/AppSnackbar'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { getNavConfig } from '@/shared/config/navigation'
import { AppHeader } from '@/widgets/AppHeader/AppHeader'
import { AppBottomNavigation } from '@/widgets/BottomNavigation/BottomNavigation'
import { Sidebar } from '@/widgets/Sidebar/Sidebar'
import { LoadingState } from '@/shared/ui'

export function AppLayout() {
  const isInitialized = useSessionStore((s) => s.isInitialized)
  const isLoading = useSessionStore((s) => s.isLoading)
  const role = useSessionStore((s) => s.role)
  const showBottomNav = true

  if (!isInitialized || isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <LoadingState variant="page" />
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh', bgcolor: 'background.default' }}>
      <Sidebar />
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          pb: showBottomNav
            ? { xs: 'calc(64px + env(safe-area-inset-bottom))', md: 0 }
            : { xs: 'calc(24px + env(safe-area-inset-bottom))', md: 0 },
        }}
      >
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          <AppHeader />
        </Box>
        <Container
          component="main"
          maxWidth="lg"
          sx={{
            flex: 1,
            py: { xs: 2, md: 3 },
            px: { xs: 2, md: 3 },
            width: '100%',
            maxWidth: { lg: 1100 },
          }}
        >
          <Outlet />
        </Container>
        <AppBottomNavigation />
      </Box>
      <DevRoleSwitcher />
      <AppSnackbar />
    </Box>
  )
}
