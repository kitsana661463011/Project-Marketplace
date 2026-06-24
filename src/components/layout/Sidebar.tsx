import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  LogOut,
  Settings,
  Menu,
  X,
  LayoutDashboard,
  Map,
  ClipboardCheck,
  Users,
  CreditCard,
  Headphones,
  Megaphone,
  MoreVertical,
} from 'lucide-react';
import type { NavItem } from '../../types';

interface SidebarProps {
  navItems: NavItem[];
  activeItemId: string;
  onNavigate: (itemId: string) => void;
  userAvatar?: string;
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  navItems,
  activeItemId,
  onNavigate,
  userAvatar,
  userName = 'สมชาย ใจดี',
  userRole = 'Admin',
  onLogout,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;

  const iconMap: Record<string, React.ElementType> = {
    LayoutDashboard,
    Map,
    ClipboardCheck,
    Users,
    CreditCard,
    Headphones,
    Megaphone,
    Settings,
  };

  const labelMap: Record<string, string> = {
    dashboard: 'แดชบอร์ด',
    stores: 'แผนผังตลาด',
    sellers: 'ข้อมูลผู้ขาย',
    verifications: 'รายการจอง',
    payments: 'การชำระเงิน',
    reports: 'แจ้งเหตุ/ปัญหา',
    announcements: 'ประกาศ',
  };

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="border-b border-slate-200/80 p-5">
        <div className="p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-sm">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900">Marketplace</h1>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Admin</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive = currentPath === item.href || (item.href !== '/dashboard' && currentPath.startsWith(item.href));
          const Icon = iconMap[item.icon] ?? LayoutDashboard;
          const displayLabel = labelMap[item.id] ?? item.label;

          return (
            <NavLink
              key={item.id}
              to={item.href}
              onClick={() => {
                onNavigate(item.id);
                setIsMobileOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive || activeItemId === item.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
              aria-label={displayLabel}
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${isActive || activeItemId === item.id ? 'bg-white/15' : 'bg-slate-100'}`}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex-1 text-left text-sm font-medium">{displayLabel}</span>
              {item.badge && item.badge > 0 && (
                <span
                  className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                    isActive || activeItemId === item.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="relative border-t border-slate-100 p-4">
        <div className="flex items-center gap-3">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName}
              className="w-9 h-9 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-slate-600">
                {userName.charAt(0)}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{userName}</p>
            <p className="text-xs text-slate-400 truncate">{userRole}</p>
          </div>
          <button
            onClick={() => setIsUserMenuOpen((open) => !open)}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors flex-shrink-0"
            aria-label="เมนูผู้ใช้"
            aria-expanded={isUserMenuOpen}
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        {isUserMenuOpen && (
          <div className="absolute bottom-full left-4 right-4 mb-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            <button
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              aria-label="ตั้งค่า"
            >
              <Settings className="w-4 h-4" />
              ตั้งค่า
            </button>
            <button
              onClick={onLogout}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              aria-label="ออกจากระบบ"
            >
              <LogOut className="w-4 h-4" />
              ออกจากระบบ
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 bg-white fixed h-screen top-0 left-0 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Header Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center px-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="เปิด/ปิดเมนู"
          aria-expanded={isMobileOpen}
        >
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <h1 className="ml-4 text-lg font-bold text-gray-900">แดชบอร์ด</h1>
      </div>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute top-0 left-0 w-64 h-screen bg-white flex flex-col overflow-y-auto">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};