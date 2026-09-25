import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { AppButton } from '@/shared/ui'
import { BaseUiMenu } from '@/features/company-management/ui/BaseUiMenu'

export interface ModerationDecisionPanelProps {
  loading?: boolean
  canApprove?: boolean
  canReject?: boolean
  canRequestChanges?: boolean
  canBlock?: boolean
  canEscalate?: boolean
  canAssign?: boolean
  onApprove: () => void
  onReject: () => void
  onRequestChanges: () => void
  onBlock: () => void
  onEscalate: () => void
  onAssign?: () => void
  approveLabel?: string
}

export function ModerationDecisionPanel({
  loading,
  canApprove = true,
  canReject = true,
  canRequestChanges = true,
  canBlock = true,
  canEscalate = true,
  canAssign,
  onApprove,
  onReject,
  onRequestChanges,
  onBlock,
  onEscalate,
  onAssign,
  approveLabel = 'Одобрить',
}: ModerationDecisionPanelProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const actions = (
    <Stack
      direction={isMobile ? 'row' : 'column'}
      spacing={1}
      flexWrap="wrap"
      useFlexGap
      sx={{ width: '100%' }}
    >
      {canAssign && onAssign ? (
        <AppButton variant="outlined" onClick={onAssign} disabled={loading} fullWidth={!isMobile}>
          Взять в работу
        </AppButton>
      ) : null}
      <AppButton
        variant="contained"
        color="success"
        onClick={onApprove}
        disabled={loading || !canApprove}
        fullWidth={!isMobile}
      >
        {approveLabel}
      </AppButton>
      <AppButton
        variant="outlined"
        onClick={onRequestChanges}
        disabled={loading || !canRequestChanges}
        fullWidth={!isMobile}
      >
        Исправления
      </AppButton>
      <AppButton
        variant="outlined"
        color="error"
        onClick={onReject}
        disabled={loading || !canReject}
        fullWidth={!isMobile}
      >
        Отклонить
      </AppButton>
      <BaseUiMenu
        aria-label="Дополнительные действия"
        items={[
          {
            key: 'block',
            label: 'Заблокировать',
            onClick: onBlock,
            disabled: loading || !canBlock,
            destructive: true,
          },
          {
            key: 'escalate',
            label: 'Эскалировать',
            onClick: onEscalate,
            disabled: loading || !canEscalate,
          },
        ]}
      />
    </Stack>
  )

  if (isMobile) {
    return (
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: (t) => t.zIndex.appBar + 1,
          p: 1.5,
          pb: 'calc(12px + env(safe-area-inset-bottom) + 64px)',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        {actions}
      </Paper>
    )
  }

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 16,
        p: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper',
      }}
    >
      <Stack spacing={1.5}>{actions}</Stack>
    </Box>
  )
}
