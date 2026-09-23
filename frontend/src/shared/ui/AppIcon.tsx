import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import Box from '@mui/material/Box'
import type { SxProps, Theme } from '@mui/material/styles'

export interface AppIconProps {
  icon: IconSvgElement
  size?: number
  strokeWidth?: number
  color?: string
  className?: string
  sx?: SxProps<Theme>
  'aria-hidden'?: boolean | 'true' | 'false'
  'aria-label'?: string
}

export function AppIcon({
  icon,
  size = 22,
  strokeWidth = 1.5,
  color = 'currentColor',
  className,
  sx,
  ...a11y
}: AppIconProps) {
  return (
    <Box
      component="span"
      className={className}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 0,
        flexShrink: 0,
        ...((sx as object) ?? {}),
      }}
      {...a11y}
    >
      <HugeiconsIcon icon={icon} size={size} color={color} strokeWidth={strokeWidth} />
    </Box>
  )
}
