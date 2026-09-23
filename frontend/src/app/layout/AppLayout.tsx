import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import { Outlet } from 'react-router-dom'
import { AppHeader } from '@/widgets/AppHeader/AppHeader'
import { AppBottomNavigation } from '@/widgets/BottomNavigation/BottomNavigation'
import { Sidebar } from '@/widgets/Sidebar/Sidebar'

export function AppLayout() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh', bgcolor: 'background.default' }}>
      <Sidebar />
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          pb: { xs: 'calc(64px + env(safe-area-inset-bottom))', md: 0 },
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
          }}
        >
          <Outlet />
        </Container>
        <AppBottomNavigation />
      </Box>
    </Box>
  )
}
