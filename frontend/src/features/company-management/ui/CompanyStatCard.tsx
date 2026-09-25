import { Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export interface CompanyStatCardProps {
  label: string
  value: string | number
  to?: string
  hint?: string
}

export function CompanyStatCard({ label, value, to, hint }: CompanyStatCardProps) {
  const content = (
    <Box
      sx={{
        p: 2,
        height: '100%',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        textDecoration: 'none',
        color: 'inherit',
        display: 'block',
        transition: 'border-color 0.15s',
        '&:hover': to ? { borderColor: 'primary.main' } : undefined,
      }}
    >
      <Typography variant="h2" component="div">
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      {hint ? (
        <Typography variant="caption" color="warning.main" display="block" sx={{ mt: 0.5 }}>
          {hint}
        </Typography>
      ) : null}
    </Box>
  )

  if (to) {
    return (
      <Box component={RouterLink} to={to} sx={{ textDecoration: 'none', color: 'inherit', height: '100%' }}>
        {content}
      </Box>
    )
  }
  return content
}
