import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import { AppButton } from './AppButton'
import { AppIcon } from './AppIcon'
import { Cancel01Icon } from './icons'

export interface FilterDrawerProps {
  open: boolean
  onClose: () => void
  onApply?: () => void
  onReset?: () => void
  title?: string
  children: ReactNode
}

export function FilterDrawer({
  open,
  onClose,
  onApply,
  onReset,
  title = 'Фильтры',
  children,
}: FilterDrawerProps) {
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: '85dvh',
          pb: 'env(safe-area-inset-bottom)',
        },
      }}
    >
      <Box sx={{ p: 2, maxWidth: 560, mx: 'auto', width: '100%' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h2">{title}</Typography>
          <IconButton onClick={onClose} aria-label="Закрыть фильтры">
            <AppIcon icon={Cancel01Icon} size={20} />
          </IconButton>
        </Stack>
        <Stack spacing={2}>{children}</Stack>
        <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
          {onReset ? (
            <AppButton fullWidth variant="outlined" onClick={onReset}>
              Сбросить
            </AppButton>
          ) : null}
          <AppButton
            fullWidth
            variant="contained"
            onClick={() => {
              onApply?.()
              onClose()
            }}
          >
            Применить
          </AppButton>
        </Stack>
      </Box>
    </Drawer>
  )
}
