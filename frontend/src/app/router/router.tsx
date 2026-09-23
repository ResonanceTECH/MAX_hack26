import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate, useParams } from 'react-router-dom'
import { AppLayout } from '@/app/layout/AppLayout'
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
const CompanyProfilePage = lazy(() =>
  import('@/pages/CompanyProfilePage/CompanyProfilePage').then((m) => ({
    default: m.CompanyProfilePage,
  })),
)
const NotificationsPage = lazy(() =>
  import('@/pages/NotificationsPage/NotificationsPage').then((m) => ({
    default: m.NotificationsPage,
  })),
)
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
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

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<LoadingState variant="page" />}>{element}</Suspense>
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
      { index: true, element: withSuspense(<HomePage />) },
      { path: 'opportunities', element: withSuspense(<OpportunitiesPage />) },
      { path: 'opportunities/create', element: withSuspense(<CreateOpportunityPage />) },
      { path: 'opportunities/:id', element: withSuspense(<OpportunityDetailsPage />) },
      { path: 'opportunities/:id/proposals', element: withSuspense(<ProposalsPage />) },
      { path: 'opportunities/:id/compare', element: withSuspense(<ComparisonPage />) },
      { path: 'opportunities/:id/propose', element: withSuspense(<CreateProposalPage />) },
      { path: 'proposals/:id', element: withSuspense(<ProposalDetailsPage />) },
      { path: 'deals/:id', element: withSuspense(<DealRoomPage />) },
      { path: 'companies', element: withSuspense(<CompaniesPage />) },
      { path: 'companies/:id', element: withSuspense(<CompanyDetailsPage />) },
      { path: 'company/:id', element: <CompanyAliasRedirect /> },
      { path: 'my', element: withSuspense(<MyProcessesPage />) },
      { path: 'my/requests', element: withSuspense(<MyRequestsPage />) },
      { path: 'my/proposals', element: withSuspense(<MyProposalsPage />) },
      { path: 'my/shortlist', element: withSuspense(<ShortlistPage />) },
      { path: 'my/negotiations', element: withSuspense(<NegotiationsPage />) },
      { path: 'favorites', element: withSuspense(<FavoritesPage />) },
      { path: 'profile/company', element: withSuspense(<CompanyProfilePage />) },
      { path: 'notifications', element: withSuspense(<NotificationsPage />) },
      { path: '*', element: withSuspense(<NotFoundPage />) },
    ],
  },
])
