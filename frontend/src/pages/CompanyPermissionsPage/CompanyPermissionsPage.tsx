import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { PermissionMatrix } from '@/features/company-management'
import { PageHeader } from '@/shared/ui'

export function CompanyPermissionsPage() {
  return (
    <Box>
      <PageHeader
        title="Права доступа"
        subtitle="Фиксированная матрица ролей компании"
      />

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Роли внутри компании: Администратор, Менеджер, Наблюдатель. Изменение матрицы на
        платформе пока недоступно — отображается эталонная схема.
      </Typography>

      <PermissionMatrix />
    </Box>
  )
}
