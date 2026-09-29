import Box from '@mui/material/Box'
import { HeaderActions } from '@/widgets/AppHeader/HeaderActions'

/** Desktop-only sticky chrome: notifications + profile avatar (sidebar already has brand). */
export function DesktopTopBar() {
  return (
    <Box
      component="header"
      aria-label="Действия аккаунта"
      sx={{
        display: { xs: 'none', md: 'flex' },
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 1,
        minHeight: 56,
        px: { md: 3 },
        py: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        position: 'sticky',
        top: 0,
        zIndex: (t) => t.zIndex.appBar,
      }}
    >
      <HeaderActions />
    </Box>
  )
}
