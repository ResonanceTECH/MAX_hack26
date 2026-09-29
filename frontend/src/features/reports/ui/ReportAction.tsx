import { useState } from 'react'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import type { ReportEntityType } from '@/entities/report'
import { BaseUiMenu } from '@/features/company-management/ui/BaseUiMenu'
import { ReportEntityDialog } from '@/features/reports/ui/ReportEntityDialog'
import { AppIcon } from '@/shared/ui'
import { Flag01Icon } from '@/shared/ui/icons'

export interface ReportActionProps {
  targetType: ReportEntityType
  targetId: string
  targetName: string
}

export function ReportAction({ targetType, targetId, targetName }: ReportActionProps) {
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
  const [open, setOpen] = useState(false)

  return (
    <>
      {isDesktop ? (
        <Tooltip title="Пожаловаться">
          <IconButton
            aria-label="Пожаловаться"
            onClick={() => setOpen(true)}
            sx={{
              minWidth: 44,
              minHeight: 44,
              color: 'error.main',
              '&:hover': {
                bgcolor: 'error.light',
                color: 'error.dark',
              },
            }}
          >
            <AppIcon icon={Flag01Icon} size={20} color="currentColor" />
          </IconButton>
        </Tooltip>
      ) : (
        <BaseUiMenu
          aria-label="Пожаловаться"
          items={[
            {
              key: 'report',
              label: 'Пожаловаться',
              destructive: true,
              onClick: () => setOpen(true),
            },
          ]}
        />
      )}
      <ReportEntityDialog
        open={open}
        onClose={() => setOpen(false)}
        targetType={targetType}
        targetId={targetId}
        targetName={targetName}
      />
    </>
  )
}
