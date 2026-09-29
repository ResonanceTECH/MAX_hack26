import Box from '@mui/material/Box'
import type { BoxProps } from '@mui/material/Box'
import { Link as RouterLink } from 'react-router-dom'
import type { ReactNode } from 'react'

/**
 * Desktop span on a 12-col grid. Common values: 3 | 4 | 6 | 8 | 12.
 * Responsive mapping:
 * - xs (4-col): ≤4 → 2 (half), else → 4 (full)
 * - sm (8-col): proportional ceil(span * 8/12), min 2
 * - md+: exact span
 */
export type BentoSpan = 2 | 3 | 4 | 6 | 8 | 12
export type BentoRowSpan = 1 | 2

export type BentoTileVariant = 'default' | 'emphasis' | 'muted' | 'action'

export interface BentoTileProps extends Omit<BoxProps, 'children'> {
  children: ReactNode
  /** Column span on the 12-col desktop grid. */
  span?: BentoSpan
  rowSpan?: BentoRowSpan
  variant?: BentoTileVariant
  /** When set, tile is a RouterLink. */
  to?: string
  /** Disable default padding (for flush media / nested lists). */
  noPadding?: boolean
}

function columnSpan(span: BentoSpan) {
  const sm = Math.min(8, Math.max(2, Math.ceil((span * 8) / 12)))
  const xs = span <= 4 ? 2 : 4
  return {
    xs: `span ${xs}`,
    sm: `span ${sm}`,
    md: `span ${span}`,
  }
}

const variantSx: Record<BentoTileVariant, BoxProps['sx']> = {
  default: {
    bgcolor: 'background.paper',
    border: '1px solid',
    borderColor: 'divider',
    boxShadow: 1,
  },
  emphasis: {
    bgcolor: 'background.paper',
    border: '1px solid',
    borderColor: 'secondary.light',
    boxShadow: 2,
  },
  muted: {
    bgcolor: 'transparent',
    border: '1px dashed',
    borderColor: 'divider',
    boxShadow: 'none',
  },
  action: {
    bgcolor: 'background.paper',
    border: '1px solid',
    borderColor: 'divider',
    boxShadow: 1,
    transition: 'border-color 0.15s, box-shadow 0.15s',
    '&:hover': {
      borderColor: 'secondary.main',
      boxShadow: 2,
    },
    '&:focus-visible': {
      outline: '2px solid',
      outlineColor: 'secondary.main',
      outlineOffset: 2,
    },
  },
}

export function BentoTile({
  children,
  span = 12,
  rowSpan = 1,
  variant = 'default',
  to,
  noPadding = false,
  sx,
  ...rest
}: BentoTileProps) {
  const interactive = Boolean(to) || variant === 'action'
  const surface = variantSx[interactive && variant === 'default' ? 'action' : variant]

  const baseSx: BoxProps['sx'] = {
    gridColumn: columnSpan(span),
    gridRow: rowSpan > 1 ? `span ${rowSpan}` : undefined,
    borderRadius: 1,
    minWidth: 0,
    minHeight: interactive ? 44 : undefined,
    p: noPadding ? 0 : 2,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    textDecoration: 'none',
    color: 'inherit',
    ...((surface as object) ?? {}),
  }

  if (to) {
    return (
      <Box
        component={RouterLink}
        to={to}
        {...rest}
        sx={[baseSx, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
      >
        {children}
      </Box>
    )
  }

  return (
    <Box {...rest} sx={[baseSx, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}>
      {children}
    </Box>
  )
}
