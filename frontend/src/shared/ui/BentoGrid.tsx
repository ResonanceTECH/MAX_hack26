import Box from '@mui/material/Box'
import type { BoxProps } from '@mui/material/Box'
import type { ReactNode } from 'react'

/**
 * 12-column bento grid (desktop).
 * - md+: 12 cols
 * - sm: 8 cols
 * - xs: 4 cols (tiles map via BentoTile span convention)
 *
 * Preferred tile spans: 3 | 4 | 6 | 8 | 12. rowSpan: 1 | 2.
 */
export interface BentoGridProps extends Omit<BoxProps, 'children'> {
  children: ReactNode
  /** Theme spacing units. Default 1.5 (~12px). */
  gap?: number
}

export function BentoGrid({ children, gap = 1.5, sx, ...rest }: BentoGridProps) {
  return (
    <Box
      {...rest}
      sx={[
        {
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(4, minmax(0, 1fr))',
            sm: 'repeat(8, minmax(0, 1fr))',
            md: 'repeat(12, minmax(0, 1fr))',
          },
          gap,
          alignItems: 'stretch',
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </Box>
  )
}
