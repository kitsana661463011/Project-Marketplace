import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { DashboardLayout } from '../components/layout';
import { mockDashboardMetrics, mockNavItems, mockUser } from '../data/mockData';

const DashboardPage = lazy(() => import('../pages/Dashboard').then((module) => ({ default: module.Dashboard })));
const StoreManagementPage = lazy(() => import('../pages/ReservationList').then((module) => ({ default: module.StoreManagementPage })));
const SellersPage = lazy(() => import('../pages/SellersPage').then((module) => ({ default: module.default })));
const VerificationRequestsPage = lazy(() => import('../pages/ReservationList').then((module) => ({ default: module.VerificationRequestsPage })));
const PaymentManagementPage = lazy(() => import('../pages/PaymentsPage').then((module) => ({ default: module.default })));
const ReportsPage = lazy(() => import('../pages/ReservationList').then((module) => ({ default: module.ReportsPage })));
const AnnouncementsPage = lazy(() => import('../pages/ReservationList').then((module) => ({ default: module.AnnouncementsPage })));

const navIdMap: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/stores': 'stores',
  '/sellers': 'sellers',
  '/verifications': 'verifications',
  '/payments': 'payments',
  '/reports': 'reports',
  '/announcements': 'announcements',
};

const pageTitleMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/stores': 'Store Management',
  '/sellers': 'Seller Management',
  '/verifications': 'Verification Requests',
  '/payments': 'Payment Management',
  '/reports': 'Reports',
  '/announcements': 'Announcements',
};

interface ShellProps {
  title: string;
  children: React.ReactNode;
}

const PageShell: React.FC<ShellProps> = ({ title, children }) => {
  const location = useLocation();
  const activeItemId = navIdMap[location.pathname] ?? 'dashboard';

  return (
    <DashboardLayout
      navItems={mockNavItems}
      activeItemId={activeItemId}
      onNavigate={() => undefined}
      pageTitle={title}
      user={mockUser}
      notificationCount={mockDashboardMetrics.notificationCount}
      onLogout={() => undefined}
      onNotificationClick={() => undefined}
      onSearch={() => undefined}
    >
      {children}
    </DashboardLayout>
  );
};

const LoadingFallback = () => (
  <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-sm font-medium text-slate-500">
    Loading page...
  </div>
);

const renderWithShell = (title: string, element: React.ReactNode) => (
  <PageShell title={title}>{element}</PageShell>
);

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={renderWithShell('Dashboard', <Suspense fallback={<LoadingFallback />}><DashboardPage /></Suspense>)} />
      <Route path="/stores" element={renderWithShell('Store Management', <Suspense fallback={<LoadingFallback />}><StoreManagementPage /></Suspense>)} />
      <Route path="/sellers" element={renderWithShell('Seller Management', <Suspense fallback={<LoadingFallback />}><SellersPage /></Suspense>)} />
      <Route path="/verifications" element={renderWithShell('Verification Requests', <Suspense fallback={<LoadingFallback />}><VerificationRequestsPage /></Suspense>)} />
      <Route path="/payments" element={renderWithShell('Payment Management', <Suspense fallback={<LoadingFallback />}><PaymentManagementPage /></Suspense>)} />
      <Route path="/reports" element={renderWithShell('Reports', <Suspense fallback={<LoadingFallback />}><ReportsPage /></Suspense>)} />
      <Route path="/announcements" element={renderWithShell('Announcements', <Suspense fallback={<LoadingFallback />}><AnnouncementsPage /></Suspense>)} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export { pageTitleMap };
