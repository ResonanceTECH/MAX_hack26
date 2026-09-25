import { usePermission } from '@/features/permissions'
import { Permission } from '@/features/permissions/model/permissions'
import { CompanyAdminOverviewPage } from '@/pages/CompanyAdminOverviewPage/CompanyAdminOverviewPage'
import { CompanyProfilePage } from '@/pages/CompanyProfilePage/CompanyProfilePage'

/** Company Admin sees management overview; Business User sees read-only profile */
export function CompanyProfileRoute() {
  const canManage = usePermission(Permission.EDIT_COMPANY)
  return canManage ? <CompanyAdminOverviewPage /> : <CompanyProfilePage />
}
