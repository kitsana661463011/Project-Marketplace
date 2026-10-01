import React, { Suspense, lazy, useMemo } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { DashboardLayout } from '../components/layout';
import type { NavItem } from '../types';
import { useBadgeCounts } from '../hooks';
import { useAuth } from '../context';
import { LoginPage } from '../pages/LoginPage';

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'แดชบอร์ด', icon: 'LayoutDashboard', href: '/dashboard' },
  { id: 'stores', label: 'แผนผังตลาด', icon: 'Map', href: '/stores' },
  { id: 'verifications', label: 'รายการจอง', icon: 'ClipboardCheck', href: '/verifications' },
  { id: 'sellers', label: 'ข้อมูลผู้ค้า', icon: 'Users', href: '/sellers' },
  { id: 'payments', label: 'ระบบการเงิน', icon: 'CreditCard', href: '/payments' },
  { id: 'reports', label: 'แจ้งเหตุ/ปัญหา', icon: 'Headphones', href: '/reports' },
  { id: 'announcements', label: 'ประกาศ', icon: 'Megaphone', href: '/announcements' },
];

const DashboardPage = lazy(() => import('../pages/Dashboard').then((module) => ({ default: module.Dashboard })));
const MarketMapPage = lazy(() => import('../pages/MarketMapPage'));
const SellersPage = lazy(() => import('../pages/SellersPage').then((module) => ({ default: module.default })));
const VerificationRequestsPage = lazy(() => import('../pages/ReservationList').then((module) => ({ default: module.VerificationRequestsPage })));
const PaymentManagementPage = lazy(() => import('../pages/PaymentsPage').then((module) => ({ default: module.default })));
const ReportsPage = lazy(() => import('../pages/ReservationList').then((module) => ({ default: module.ReportsPage })));
const AnnouncementsPage = lazy(() => import('../pages/ReservationList').then((module) => ({ default: module.AnnouncementsPage })));
const SettingsPage = lazy(() => import('../pages/SettingsPage').then((module) => ({ default: module.SettingsPage })));

const navIdMap: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/stores': 'stores',
  '/sellers': 'sellers',
  '/verifications': 'verifications',
  '/payments': 'payments',
  '/reports': 'reports',
  '/announcements': 'announcements',
  '/settings': 'settings',
};

const pageTitleMap: Record<string, string> = {
  '/dashboard': 'ภาพรวมตลาด',
  '/stores': 'จัดการแผนผังตลาด',
  '/sellers': 'ข้อมูลผู้ค้า',
  '/verifications': 'รายการจอง',
  '/payments': 'ระบบการเงิน',
  '/reports': 'แจ้งเหตุ/ปัญหา',
  '/announcements': 'จัดการประกาศ',
  '/settings': 'ตั้งค่าระบบและบัญชีผู้ดูแล',
};

interface ShellProps {
  title: string;
  children: React.ReactNode;
}

const PageShell: React.FC<ShellProps> = ({ title, children }) => {
  const location = useLocation();
  const activeItemId = navIdMap[location.pathname] ?? 'dashboard';
  const badgeCounts = useBadgeCounts();
  const { user, logout } = useAuth();

  // Merge live badge counts from the API into the static nav items
  const navItemsWithBadges = useMemo(
    () =>
      navItems.map((item) => {
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

  const fallbackUser = {
    id: 'admin',
    name: 'ผู้ดูแลระบบ',
    email: 'admin@marketplace.com',
    role: 'Administrator',
  };

  const totalNotifications = (badgeCounts.verifications || 0) + (badgeCounts.sellers || 0) + (badgeCounts.reports || 0);

  return (
    <DashboardLayout
      navItems={navItemsWithBadges}
      activeItemId={activeItemId}
      onNavigate={() => undefined}
      pageTitle={title}
      user={user || fallbackUser}
      notificationCount={totalNotifications}
      badgeCounts={badgeCounts}
      onLogout={logout}
      onNotificationClick={() => undefined}
      onSearch={() => undefined}
    >
      {children}
    </DashboardLayout>
  );
};

const LoadingFallback = () => (
  <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-sm font-medium text-slate-800">
    กำลังโหลดข้อมูล...
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-700">กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบ...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const RootRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
};

const renderWithShell = (title: string, element: React.ReactNode) => (
  <ProtectedRoute>
    <PageShell title={title}>{element}</PageShell>
  </ProtectedRoute>
);

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route path="/dashboard" element={renderWithShell('ภาพรวมตลาด', <Suspense fallback={<LoadingFallback />}><DashboardPage /></Suspense>)} />
      <Route path="/stores" element={renderWithShell('จัดการแผนผังตลาด', <Suspense fallback={<LoadingFallback />}><MarketMapPage /></Suspense>)} />
      <Route path="/sellers" element={renderWithShell('ข้อมูลผู้ค้า', <Suspense fallback={<LoadingFallback />}><SellersPage /></Suspense>)} />
      <Route path="/verifications" element={renderWithShell('รายการจอง', <Suspense fallback={<LoadingFallback />}><VerificationRequestsPage /></Suspense>)} />
      <Route path="/payments" element={renderWithShell('ระบบการเงิน', <Suspense fallback={<LoadingFallback />}><PaymentManagementPage /></Suspense>)} />
      <Route path="/reports" element={renderWithShell('แจ้งเหตุ/ปัญหา', <Suspense fallback={<LoadingFallback />}><ReportsPage /></Suspense>)} />
      <Route path="/announcements" element={renderWithShell('จัดการประกาศ', <Suspense fallback={<LoadingFallback />}><AnnouncementsPage /></Suspense>)} />
      <Route path="/settings" element={renderWithShell('ตั้งค่าระบบและบัญชีผู้ดูแล', <Suspense fallback={<LoadingFallback />}><SettingsPage /></Suspense>)} />
      <Route path="*" element={<RootRoute />} />
    </Routes>
  );
};

export { pageTitleMap };

