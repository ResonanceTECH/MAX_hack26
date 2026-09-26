import { useCompanyPermission } from '@/features/permissions'
import { Permission } from '@/features/permissions/model/permissions'
import { CompanyAdminOverviewPage } from '@/pages/CompanyAdminOverviewPage/CompanyAdminOverviewPage'
import { CompanyProfilePage } from '@/pages/CompanyProfilePage/CompanyProfilePage'

/** Company Admin (companyRole) sees management overview; others see read-only profile */
export function CompanyProfileRoute() {
  const canManage = useCompanyPermission(Permission.EDIT_COMPANY)
  return canManage ? <CompanyAdminOverviewPage /> : <CompanyProfilePage />
}
