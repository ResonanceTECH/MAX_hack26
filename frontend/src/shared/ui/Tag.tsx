import Chip, { type ChipProps } from '@mui/material/Chip'

export interface TagProps extends Omit<ChipProps, 'size'> {
  size?: 'small' | 'medium'
}

export function Tag({ size = 'small', ...props }: TagProps) {
  return (
    <Chip size={size} variant="outlined" sx={{ borderRadius: 1.5, fontWeight: 500 }} {...props} />
  )
}
