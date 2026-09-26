import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate, useParams } from 'react-router-dom'
import { AppLayout } from '@/app/layout/AppLayout'
import { CompanyPermissionGuard, PermissionGuard } from '@/features/permissions'
import { Permission } from '@/features/permissions/model/permissions'
import { LoadingState } from '@/shared/ui'
import { companyDetailsPath } from '@/shared/constants/routes'

const HomePage = lazy(() =>
  import('@/pages/HomePage/HomePage').then((m) => ({ default: m.HomePage })),
)
const OpportunitiesPage = lazy(() =>
  import('@/pages/OpportunitiesPage/OpportunitiesPage').then((m) => ({
    default: m.OpportunitiesPage,
  })),
)
const OpportunityDetailsPage = lazy(() =>
  import('@/pages/OpportunityDetailsPage/OpportunityDetailsPage').then((m) => ({
    default: m.OpportunityDetailsPage,
  })),
)
const CreateOpportunityPage = lazy(() =>
  import('@/pages/CreateOpportunityPage/CreateOpportunityPage').then((m) => ({
    default: m.CreateOpportunityPage,
  })),
)
const CompaniesPage = lazy(() =>
  import('@/pages/CompaniesPage/CompaniesPage').then((m) => ({ default: m.CompaniesPage })),
)
const CompanyDetailsPage = lazy(() =>
  import('@/pages/CompanyDetailsPage/CompanyDetailsPage').then((m) => ({
    default: m.CompanyDetailsPage,
  })),
)
const MyProcessesPage = lazy(() =>
  import('@/pages/MyProcessesPage/MyProcessesPage').then((m) => ({ default: m.MyProcessesPage })),
)
const MyRequestsPage = lazy(() =>
  import('@/pages/MyRequestsPage/MyRequestsPage').then((m) => ({ default: m.MyRequestsPage })),
)
const MyProposalsPage = lazy(() =>
  import('@/pages/MyProposalsPage/MyProposalsPage').then((m) => ({ default: m.MyProposalsPage })),
)
const ProposalsPage = lazy(() =>
  import('@/pages/ProposalsPage/ProposalsPage').then((m) => ({ default: m.ProposalsPage })),
)
const ComparisonPage = lazy(() =>
  import('@/pages/ComparisonPage/ComparisonPage').then((m) => ({ default: m.ComparisonPage })),
)
const ShortlistPage = lazy(() =>
  import('@/pages/ShortlistPage/ShortlistPage').then((m) => ({ default: m.ShortlistPage })),
)
const CompanyManagementLayoutRoute = lazy(() =>
  import('@/widgets/CompanyManagementNav/CompanyManagementLayoutRoute').then((m) => ({
    default: m.CompanyManagementLayoutRoute,
  })),
)
const CompanyProfileRoute = lazy(() =>
  import('@/pages/CompanyProfileRoute').then((m) => ({ default: m.CompanyProfileRoute })),
)
const CompanyEditPage = lazy(() =>
  import('@/pages/CompanyEditPage/CompanyEditPage').then((m) => ({ default: m.CompanyEditPage })),
)
const CompanyTeamPage = lazy(() =>
  import('@/pages/CompanyTeamPage/CompanyTeamPage').then((m) => ({ default: m.CompanyTeamPage })),
)
const CompanyInviteMemberPage = lazy(() =>
  import('@/pages/CompanyInviteMemberPage/CompanyInviteMemberPage').then((m) => ({
    default: m.CompanyInviteMemberPage,
  })),
)
const CompanyMemberDetailPage = lazy(() =>
  import('@/pages/CompanyMemberDetailPage/CompanyMemberDetailPage').then((m) => ({
    default: m.CompanyMemberDetailPage,
  })),
)
const CompanyServicesPage = lazy(() =>
  import('@/pages/CompanyServicesPage/CompanyServicesPage').then((m) => ({
    default: m.CompanyServicesPage,
  })),
)
const CompanyServiceCreatePage = lazy(() =>
  import('@/pages/CompanyServicesPage/CompanyServiceCreatePage').then((m) => ({
    default: m.CompanyServiceCreatePage,
  })),
)
const CompanyServiceDetailPage = lazy(() =>
  import('@/pages/CompanyServicesPage/CompanyServiceDetailPage').then((m) => ({
    default: m.CompanyServiceDetailPage,
  })),
)
const CompanyServiceEditPage = lazy(() =>
  import('@/pages/CompanyServicesPage/CompanyServiceEditPage').then((m) => ({
    default: m.CompanyServiceEditPage,
  })),
)
const CompanyCasesPage = lazy(() =>
  import('@/pages/CompanyCasesPage/CompanyCasesPage').then((m) => ({
    default: m.CompanyCasesPage,
  })),
)
const CompanyCaseCreatePage = lazy(() =>
  import('@/pages/CompanyCasesPage/CompanyCaseCreatePage').then((m) => ({
    default: m.CompanyCaseCreatePage,
  })),
)
const CompanyCaseDetailPage = lazy(() =>
  import('@/pages/CompanyCasesPage/CompanyCaseDetailPage').then((m) => ({
    default: m.CompanyCaseDetailPage,
  })),
)
const CompanyCaseEditPage = lazy(() =>
  import('@/pages/CompanyCasesPage/CompanyCaseEditPage').then((m) => ({
    default: m.CompanyCaseEditPage,
  })),
)
const CompanyDocumentsPage = lazy(() =>
  import('@/pages/CompanyDocumentsPage/CompanyDocumentsPage').then((m) => ({
    default: m.CompanyDocumentsPage,
  })),
)
const CompanyDocumentUploadPage = lazy(() =>
  import('@/pages/CompanyDocumentsPage/CompanyDocumentUploadPage').then((m) => ({
    default: m.CompanyDocumentUploadPage,
  })),
)
const CompanyDocumentDetailPage = lazy(() =>
  import('@/pages/CompanyDocumentsPage/CompanyDocumentDetailPage').then((m) => ({
    default: m.CompanyDocumentDetailPage,
  })),
)
const CompanyPermissionsPage = lazy(() =>
  import('@/pages/CompanyPermissionsPage/CompanyPermissionsPage').then((m) => ({
    default: m.CompanyPermissionsPage,
  })),
)
const CompanySettingsPage = lazy(() =>
  import('@/pages/CompanySettingsPage/CompanySettingsPage').then((m) => ({
    default: m.CompanySettingsPage,
  })),
)
const CompanyVerificationPage = lazy(() =>
  import('@/pages/CompanyVerificationPage/CompanyVerificationPage').then((m) => ({
    default: m.CompanyVerificationPage,
  })),
)
const CompanyActivityPage = lazy(() =>
  import('@/pages/CompanyActivityPage/CompanyActivityPage').then((m) => ({
    default: m.CompanyActivityPage,
  })),
)
const NotificationsPage = lazy(() =>
  import('@/pages/NotificationsPage/NotificationsPage').then((m) => ({
    default: m.NotificationsPage,
  })),
)
const CompanyInvitationPage = lazy(() =>
  import('@/pages/CompanyInvitationPage/CompanyInvitationPage').then((m) => ({
    default: m.CompanyInvitationPage,
  })),
)
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
)
const AccessDeniedPage = lazy(() =>
  import('@/pages/AccessDeniedPage/AccessDeniedPage').then((m) => ({
    default: m.AccessDeniedPage,
  })),
)
const ProposalDetailsPage = lazy(() =>
  import('@/pages/ProposalDetailsPage/ProposalDetailsPage').then((m) => ({
    default: m.ProposalDetailsPage,
  })),
)
const CreateProposalPage = lazy(() =>
  import('@/pages/CreateProposalPage/CreateProposalPage').then((m) => ({
    default: m.CreateProposalPage,
  })),
)
const NegotiationsPage = lazy(() =>
  import('@/pages/NegotiationsPage/NegotiationsPage').then((m) => ({
    default: m.NegotiationsPage,
  })),
)
const DealRoomPage = lazy(() =>
  import('@/pages/DealRoomPage/DealRoomPage').then((m) => ({ default: m.DealRoomPage })),
)
const FavoritesPage = lazy(() =>
  import('@/pages/FavoritesPage/FavoritesPage').then((m) => ({ default: m.FavoritesPage })),
)
const ProfilePage = lazy(() =>
  import('@/pages/ProfilePage/ProfilePage').then((m) => ({ default: m.ProfilePage })),
)
const ModerationDashboardPage = lazy(() =>
  import('@/pages/ModerationDashboardPage/ModerationDashboardPage').then((m) => ({
    default: m.ModerationDashboardPage,
  })),
)
const ModerationQueuePage = lazy(() =>
  import('@/pages/ModerationQueuePage/ModerationQueuePage').then((m) => ({
    default: m.ModerationQueuePage,
  })),
)
const ModerationDetailPage = lazy(() =>
  import('@/pages/ModerationDetailPage/ModerationDetailPage').then((m) => ({
    default: m.ModerationDetailPage,
  })),
)
const ModerationReportsPage = lazy(() =>
  import('@/pages/ModerationReportsPage/ModerationReportsPage').then((m) => ({
    default: m.ModerationReportsPage,
  })),
)
const ModerationReportDetailPage = lazy(() =>
  import('@/pages/ModerationReportDetailPage/ModerationReportDetailPage').then((m) => ({
    default: m.ModerationReportDetailPage,
  })),
)
const ModerationEscalationsPage = lazy(() =>
  import('@/pages/ModerationEscalationsPage/ModerationEscalationsPage').then((m) => ({
    default: m.ModerationEscalationsPage,
  })),
)
const ModerationHistoryPage = lazy(() =>
  import('@/pages/ModerationHistoryPage/ModerationHistoryPage').then((m) => ({
    default: m.ModerationHistoryPage,
  })),
)
const ModerationProfilePage = lazy(() =>
  import('@/pages/ModerationProfilePage/ModerationProfilePage').then((m) => ({
    default: m.ModerationProfilePage,
  })),
)
const AdminDashboardPage = lazy(() =>
  import('@/pages/AdminDashboardPage/AdminDashboardPage').then((m) => ({
    default: m.AdminDashboardPage,
  })),
)
const AdminUsersPage = lazy(() =>
  import('@/pages/AdminUsersPage/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })),
)
const AdminUserDetailPage = lazy(() =>
  import('@/pages/AdminUserDetailPage/AdminUserDetailPage').then((m) => ({
    default: m.AdminUserDetailPage,
  })),
)
const AdminCompaniesPage = lazy(() =>
  import('@/pages/AdminCompaniesPage/AdminCompaniesPage').then((m) => ({
    default: m.AdminCompaniesPage,
  })),
)
const AdminCompanyDetailPage = lazy(() =>
  import('@/pages/AdminCompanyDetailPage/AdminCompanyDetailPage').then((m) => ({
    default: m.AdminCompanyDetailPage,
  })),
)
const AdminDictionariesPage = lazy(() =>
  import('@/pages/AdminDictionariesPage/AdminDictionariesPage').then((m) => ({
    default: m.AdminDictionariesPage,
  })),
)
const AdminAnalyticsPage = lazy(() =>
  import('@/pages/AdminAnalyticsPage/AdminAnalyticsPage').then((m) => ({
    default: m.AdminAnalyticsPage,
  })),
)
const AdminAuditPage = lazy(() =>
  import('@/pages/AdminAuditPage/AdminAuditPage').then((m) => ({ default: m.AdminAuditPage })),
)
const AdminSettingsPage = lazy(() =>
  import('@/pages/AdminSettingsPage/AdminSettingsPage').then((m) => ({
    default: m.AdminSettingsPage,
  })),
)
const AdminModerationPage = lazy(() =>
  import('@/pages/AdminModerationPage/AdminModerationPage').then((m) => ({
    default: m.AdminModerationPage,
  })),
)
const AdminDictionaryTypePage = lazy(() =>
  import('@/pages/AdminDictionaryTypePage/AdminDictionaryTypePage').then((m) => ({
    default: m.AdminDictionaryTypePage,
  })),
)
const AdminFeatureFlagsPage = lazy(() =>
  import('@/pages/AdminFeatureFlagsPage/AdminFeatureFlagsPage').then((m) => ({
    default: m.AdminFeatureFlagsPage,
  })),
)
const AdminNotificationsPage = lazy(() =>
  import('@/pages/AdminNotificationsPage/AdminNotificationsPage').then((m) => ({
    default: m.AdminNotificationsPage,
  })),
)
const AdminProfilePage = lazy(() =>
  import('@/pages/AdminProfilePage/AdminProfilePage').then((m) => ({
    default: m.AdminProfilePage,
  })),
)

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<LoadingState variant="page" />}>{element}</Suspense>
}

function guarded(
  permission: Permission | Permission[],
  element: ReactNode,
  denyReason?: string,
) {
  return withSuspense(
    <PermissionGuard permission={permission} deniedReason={denyReason}>
      {element}
    </PermissionGuard>,
  )
}

/** Company-scoped + marketplace mutations that respect CompanyMember.role.
 * Outer PermissionGuard blocks MOD/PA (and other system roles without marketplace perms).
 */
function companyGuarded(
  permission: Permission | Permission[],
  element: ReactNode,
  denyReason?: string,
) {
  const reason = denyReason ?? 'marketplace'
  return withSuspense(
    <PermissionGuard permission={permission} deniedReason={reason}>
      <CompanyPermissionGuard permission={permission} deniedReason={reason}>
        {element}
      </CompanyPermissionGuard>
    </PermissionGuard>,
  )
}

function CompanyAliasRedirect() {
  const { id = '' } = useParams()
  return <Navigate to={companyDetailsPath(id)} replace />
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: guarded(Permission.VIEW_OPPORTUNITIES, <HomePage />, 'marketplace') },
      { path: 'access-denied', element: withSuspense(<AccessDeniedPage />) },
      { path: 'profile', element: withSuspense(<ProfilePage />) },

      {
        path: 'opportunities',
        element: guarded(Permission.VIEW_OPPORTUNITIES, <OpportunitiesPage />, 'marketplace'),
      },
      {
        path: 'opportunities/create',
        element: companyGuarded(Permission.CREATE_OPPORTUNITY, <CreateOpportunityPage />),
      },
      {
        path: 'opportunities/:id',
        element: guarded(Permission.VIEW_OPPORTUNITIES, <OpportunityDetailsPage />, 'marketplace'),
      },
      {
        path: 'opportunities/:id/proposals',
        element: guarded(Permission.VIEW_OPPORTUNITIES, <ProposalsPage />, 'marketplace'),
      },
      {
        path: 'opportunities/:id/compare',
        element: guarded(Permission.VIEW_OPPORTUNITIES, <ComparisonPage />, 'marketplace'),
      },
      {
        path: 'opportunities/:id/propose',
        element: companyGuarded(Permission.CREATE_PROPOSAL, <CreateProposalPage />),
      },
      {
        path: 'proposals/create/:opportunityId',
        element: companyGuarded(Permission.CREATE_PROPOSAL, <CreateProposalPage />),
      },
      {
        path: 'proposals/:id',
        element: guarded(Permission.VIEW_OPPORTUNITIES, <ProposalDetailsPage />, 'marketplace'),
      },
      {
        path: 'deals/:id',
        element: guarded(
          [Permission.VIEW_DEALS, Permission.START_NEGOTIATION],
          <DealRoomPage />,
          'marketplace',
        ),
      },
      {
        path: 'companies',
        element: guarded(Permission.VIEW_COMPANY_PROFILE, <CompaniesPage />, 'marketplace'),
      },
      {
        path: 'companies/:id',
        element: guarded(Permission.VIEW_COMPANY_PROFILE, <CompanyDetailsPage />, 'marketplace'),
      },
      { path: 'company/:id', element: <CompanyAliasRedirect /> },
      {
        path: 'my',
        element: guarded(Permission.VIEW_OPPORTUNITIES, <MyProcessesPage />, 'marketplace'),
      },
      {
        path: 'my/requests',
        element: guarded(Permission.VIEW_OPPORTUNITIES, <MyRequestsPage />, 'marketplace'),
      },
      {
        path: 'my/proposals',
        element: guarded(Permission.VIEW_OPPORTUNITIES, <MyProposalsPage />, 'marketplace'),
      },
      {
        path: 'my/shortlist',
        element: companyGuarded(Permission.MANAGE_SHORTLIST, <ShortlistPage />),
      },
      {
        path: 'my/negotiations',
        element: guarded(Permission.START_NEGOTIATION, <NegotiationsPage />, 'marketplace'),
      },
      {
        path: 'favorites',
        element: guarded(Permission.MANAGE_FAVORITES, <FavoritesPage />, 'marketplace'),
      },
      {
        path: 'notifications',
        element: guarded(Permission.VIEW_NOTIFICATIONS, <NotificationsPage />, 'marketplace'),
      },
      {
        path: 'company-invitations/:token',
        element: withSuspense(<CompanyInvitationPage />),
      },

      {
        path: 'profile/company',
        element: guarded(Permission.VIEW_COMPANY, <CompanyManagementLayoutRoute />, 'marketplace'),
        children: [
          { index: true, element: withSuspense(<CompanyProfileRoute />) },
          {
            path: 'edit',
            element: companyGuarded(Permission.EDIT_COMPANY, <CompanyEditPage />),
          },
          {
            path: 'team',
            element: companyGuarded(
              Permission.MANAGE_COMPANY_MEMBERS,
              <CompanyTeamPage />,
              'company_members',
            ),
          },
          {
            path: 'team/invite',
            element: companyGuarded(
              Permission.MANAGE_COMPANY_MEMBERS,
              <CompanyInviteMemberPage />,
              'company_members',
            ),
          },
          {
            path: 'team/:memberId',
            element: companyGuarded(
              Permission.MANAGE_COMPANY_MEMBERS,
              <CompanyMemberDetailPage />,
              'company_members',
            ),
          },
          {
            path: 'services',
            element: companyGuarded(
              [Permission.VIEW_COMPANY_SERVICES, Permission.MANAGE_COMPANY_SERVICES],
              <CompanyServicesPage />,
            ),
          },
          {
            path: 'services/create',
            element: companyGuarded(Permission.MANAGE_COMPANY_SERVICES, <CompanyServiceCreatePage />),
          },
          {
            path: 'services/:serviceId',
            element: companyGuarded(
              [Permission.VIEW_COMPANY_SERVICES, Permission.MANAGE_COMPANY_SERVICES],
              <CompanyServiceDetailPage />,
            ),
          },
          {
            path: 'services/:serviceId/edit',
            element: companyGuarded(Permission.MANAGE_COMPANY_SERVICES, <CompanyServiceEditPage />),
          },
          {
            path: 'cases',
            element: companyGuarded(
              [Permission.VIEW_COMPANY_CASES, Permission.MANAGE_COMPANY_CASES],
              <CompanyCasesPage />,
            ),
          },
          {
            path: 'cases/create',
            element: companyGuarded(Permission.MANAGE_COMPANY_CASES, <CompanyCaseCreatePage />),
          },
          {
            path: 'cases/:caseId',
            element: companyGuarded(
              [Permission.VIEW_COMPANY_CASES, Permission.MANAGE_COMPANY_CASES],
              <CompanyCaseDetailPage />,
            ),
          },
          {
            path: 'cases/:caseId/edit',
            element: companyGuarded(Permission.MANAGE_COMPANY_CASES, <CompanyCaseEditPage />),
          },
          {
            path: 'documents',
            element: companyGuarded(
              [Permission.VIEW_COMPANY_DOCUMENTS, Permission.MANAGE_COMPANY_DOCUMENTS],
              <CompanyDocumentsPage />,
            ),
          },
          {
            path: 'documents/upload',
            element: companyGuarded(Permission.MANAGE_COMPANY_DOCUMENTS, <CompanyDocumentUploadPage />),
          },
          {
            path: 'documents/:documentId',
            element: companyGuarded(
              [Permission.VIEW_COMPANY_DOCUMENTS, Permission.MANAGE_COMPANY_DOCUMENTS],
              <CompanyDocumentDetailPage />,
            ),
          },
          {
            path: 'permissions',
            element: companyGuarded(
              [Permission.VIEW_COMPANY_PERMISSIONS, Permission.MANAGE_COMPANY_PERMISSIONS],
              <CompanyPermissionsPage />,
            ),
          },
          {
            path: 'settings',
            element: companyGuarded(
              Permission.MANAGE_COMPANY_SETTINGS,
              <CompanySettingsPage />,
              'company_settings',
            ),
          },
          {
            path: 'verification',
            element: companyGuarded(Permission.VIEW_COMPANY_VERIFICATION, <CompanyVerificationPage />),
          },
          {
            path: 'activity',
            element: companyGuarded(
              Permission.VIEW_COMPANY_ACTIVITY,
              <CompanyActivityPage />,
              'company_activity',
            ),
          },
        ],
      },

      {
        path: 'moderation',
        element: guarded(Permission.VIEW_MODERATION_DASHBOARD, <ModerationDashboardPage />),
      },
      {
        path: 'moderation/queue',
        element: guarded(Permission.VIEW_MODERATION_QUEUE, <ModerationQueuePage />),
      },
      {
        path: 'moderation/queue/:queueType',
        element: guarded(Permission.VIEW_MODERATION_QUEUE, <ModerationQueuePage />),
      },
      {
        path: 'moderation/reports',
        element: guarded(Permission.VIEW_REPORTS, <ModerationReportsPage />),
      },
      {
        path: 'moderation/reports/:id',
        element: guarded(Permission.HANDLE_REPORTS, <ModerationReportDetailPage />),
      },
      {
        path: 'moderation/escalations',
        element: guarded(Permission.VIEW_ESCALATIONS, <ModerationEscalationsPage />),
      },
      {
        path: 'moderation/history',
        element: guarded(Permission.VIEW_MODERATION_HISTORY, <ModerationHistoryPage />),
      },
      {
        path: 'moderation/profile',
        element: guarded(Permission.VIEW_MODERATION_DASHBOARD, <ModerationProfilePage />),
      },
      {
        path: 'moderation/company/:id',
        element: guarded(Permission.VIEW_MODERATION_ITEM, <ModerationDetailPage />),
      },
      {
        path: 'moderation/opportunity/:id',
        element: guarded(Permission.VIEW_MODERATION_ITEM, <ModerationDetailPage />),
      },
      {
        path: 'moderation/case/:id',
        element: guarded(Permission.VIEW_MODERATION_ITEM, <ModerationDetailPage />),
      },
      {
        path: 'moderation/document/:id',
        element: guarded(Permission.VIEW_MODERATION_ITEM, <ModerationDetailPage />),
      },
      {
        path: 'moderation/:type/:id',
        element: guarded(Permission.VIEW_MODERATION_ITEM, <ModerationDetailPage />),
      },

      {
        path: 'admin',
        element: guarded(
          Permission.VIEW_ADMIN_DASHBOARD,
          <AdminDashboardPage />,
          'platform_admin',
        ),
      },
      {
        path: 'admin/users',
        element: guarded(Permission.VIEW_USERS, <AdminUsersPage />, 'platform_admin'),
      },
      {
        path: 'admin/users/:id',
        element: guarded(Permission.MANAGE_USERS, <AdminUserDetailPage />, 'platform_admin'),
      },
      {
        path: 'admin/companies',
        element: guarded(Permission.VIEW_COMPANIES, <AdminCompaniesPage />, 'platform_admin'),
      },
      {
        path: 'admin/companies/:id',
        element: guarded(
          Permission.MANAGE_COMPANY_PLATFORM_STATUS,
          <AdminCompanyDetailPage />,
          'platform_admin',
        ),
      },
      {
        path: 'admin/moderation',
        element: guarded(Permission.VIEW_ESCALATIONS, <AdminModerationPage />),
      },
      {
        path: 'admin/moderation/:type/:id',
        element: guarded(Permission.VIEW_MODERATION_ITEM, <ModerationDetailPage />),
      },
      {
        path: 'admin/dictionaries',
        element: guarded(Permission.VIEW_DICTIONARIES, <AdminDictionariesPage />, 'platform_admin'),
      },
      {
        path: 'admin/dictionaries/:type',
        element: guarded(
          Permission.MANAGE_DICTIONARIES,
          <AdminDictionaryTypePage />,
          'platform_admin',
        ),
      },
      {
        path: 'admin/analytics',
        element: guarded(Permission.VIEW_ANALYTICS, <AdminAnalyticsPage />, 'platform_admin'),
      },
      {
        path: 'admin/audit',
        element: guarded(Permission.VIEW_AUDIT_LOG, <AdminAuditPage />, 'platform_admin'),
      },
      {
        path: 'admin/settings',
        element: guarded(
          Permission.VIEW_PLATFORM_SETTINGS,
          <AdminSettingsPage />,
          'platform_admin',
        ),
      },
      {
        path: 'admin/feature-flags',
        element: guarded(
          Permission.VIEW_FEATURE_FLAGS,
          <AdminFeatureFlagsPage />,
          'platform_admin',
        ),
      },
      {
        path: 'admin/notifications',
        element: guarded(
          Permission.VIEW_SYSTEM_NOTIFICATIONS,
          <AdminNotificationsPage />,
          'platform_admin',
        ),
      },
      {
        path: 'admin/profile',
        element: guarded(Permission.VIEW_ADMIN_DASHBOARD, <AdminProfilePage />, 'platform_admin'),
      },

      { path: '*', element: withSuspense(<NotFoundPage />) },
    ],
  },
])
