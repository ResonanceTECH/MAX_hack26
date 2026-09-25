import { Navigate } from 'react-router-dom'
import { ROUTES } from '@/shared/constants/routes'

/** Platform Admin moderation entry — reuse moderator dashboard */
export function AdminModerationPage() {
  return <Navigate to={ROUTES.MODERATION} replace />
}
