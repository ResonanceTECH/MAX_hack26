import { Outlet } from 'react-router-dom'
import { CompanyManagementLayout } from './CompanyManagementLayout'

/** Router layout route: wraps company admin child routes */
export function CompanyManagementLayoutRoute() {
  return (
    <CompanyManagementLayout>
      <Outlet />
    </CompanyManagementLayout>
  )
}
