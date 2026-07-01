import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import type { NavItem, User } from '../../types';

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  activeItemId: string;
  onNavigate: (itemId: string) => void;
  pageTitle: string;
  user?: User;
  notificationCount?: number;
  onLogout?: () => void;
  onNotificationClick?: () => void;
  onSearch?: (query: string) => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  navItems,
  activeItemId,
  onNavigate,
  pageTitle,
  user,
  onLogout,
}) => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        navItems={navItems}
        activeItemId={activeItemId}
        onNavigate={onNavigate}
        userAvatar={user?.avatar}
        userName={user?.name}
        userRole={user?.role}
        onLogout={onLogout}
      />

      {/* Main Content */}
      <div className="flex flex-col flex-1 w-full lg:ml-64">
        {/* Topbar */}
        <Topbar title={pageTitle} />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6 mt-16 lg:mt-20 w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
