import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'

export interface LoadingStateProps {
  rows?: number
  variant?: 'list' | 'cards' | 'page'
}

export function LoadingState({ rows = 3, variant = 'cards' }: LoadingStateProps) {
  if (variant === 'page') {
    return (
      <Stack spacing={2} aria-busy="true" aria-label="Загрузка">
        <Skeleton variant="text" width="40%" height={36} />
        <Skeleton variant="rounded" height={48} />
        <Skeleton variant="rounded" height={160} />
        <Skeleton variant="rounded" height={160} />
      </Stack>
    )
  }

  return (
    <Stack spacing={2} aria-busy="true" aria-label="Загрузка">
      {Array.from({ length: rows }).map((_, i) => (
        <Box
          key={i}
          sx={{
            p: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          {variant === 'list' ? (
            <>
              <Skeleton width="60%" />
              <Skeleton width="40%" />
            </>
          ) : (
            <>
              <Skeleton width="30%" height={28} sx={{ mb: 1 }} />
              <Skeleton width="80%" height={24} />
              <Skeleton width="50%" sx={{ mt: 1 }} />
              <Skeleton variant="rounded" height={40} sx={{ mt: 2 }} />
            </>
          )}
        </Box>
      ))}
    </Stack>
  )
}
