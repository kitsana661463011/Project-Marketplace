import React, { Suspense, lazy, useMemo } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { DashboardLayout } from '../components/layout';
import { mockDashboardMetrics, mockNavItems, mockUser } from '../data/mockData';
import { useBadgeCounts } from '../hooks';

const DashboardPage = lazy(() => import('../pages/Dashboard').then((module) => ({ default: module.Dashboard })));
const MarketMapPage = lazy(() => import('../pages/MarketMapPage'));
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
  '/dashboard': 'ภาพรวมตลาด',
  '/stores': 'จัดการแผนผังตลาด',
  '/sellers': 'ข้อมูลผู้ค้า',
  '/verifications': 'รายการจอง',
  '/payments': 'การชำระเงิน',
  '/reports': 'แจ้งเหตุ/ปัญหา',
  '/announcements': 'จัดการประกาศ',
};

interface ShellProps {
  title: string;
  children: React.ReactNode;
}

const PageShell: React.FC<ShellProps> = ({ title, children }) => {
  const location = useLocation();
  const activeItemId = navIdMap[location.pathname] ?? 'dashboard';
  const badgeCounts = useBadgeCounts();

  // Merge live badge counts from the API into the static nav items
  const navItemsWithBadges = useMemo(
    () =>
      mockNavItems.map((item) => {
        if (item.id === 'verifications' && badgeCounts.verifications > 0) {
          return { ...item, badge: badgeCounts.verifications };
        }
        if (item.id === 'sellers' && badgeCounts.sellers > 0) {
          return { ...item, badge: badgeCounts.sellers };
        }
        if (item.id === 'reports' && badgeCounts.reports > 0) {
          return { ...item, badge: badgeCounts.reports };
        }
        return item;
      }),
    [badgeCounts],
  );

  return (
    <DashboardLayout
      navItems={navItemsWithBadges}
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
      <Route path="/dashboard" element={renderWithShell('ภาพรวมตลาด', <Suspense fallback={<LoadingFallback />}><DashboardPage /></Suspense>)} />
      <Route path="/stores" element={renderWithShell('จัดการแผนผังตลาด', <Suspense fallback={<LoadingFallback />}><MarketMapPage /></Suspense>)} />
      <Route path="/sellers" element={renderWithShell('ข้อมูลผู้ค้า', <Suspense fallback={<LoadingFallback />}><SellersPage /></Suspense>)} />
      <Route path="/verifications" element={renderWithShell('รายการจอง', <Suspense fallback={<LoadingFallback />}><VerificationRequestsPage /></Suspense>)} />
      <Route path="/payments" element={renderWithShell('การชำระเงิน', <Suspense fallback={<LoadingFallback />}><PaymentManagementPage /></Suspense>)} />
      <Route path="/reports" element={renderWithShell('แจ้งเหตุ/ปัญหา', <Suspense fallback={<LoadingFallback />}><ReportsPage /></Suspense>)} />
      <Route path="/announcements" element={renderWithShell('จัดการประกาศ', <Suspense fallback={<LoadingFallback />}><AnnouncementsPage /></Suspense>)} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export { pageTitleMap };
