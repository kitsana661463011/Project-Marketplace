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
  userName = 'Admin User',
  userRole = 'Administrator',
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
    sellers: 'ข้อมูลผู้ค้า',
    verifications: 'รายการจอง',
    payments: 'การชำระเงิน',
    reports: 'แจ้งเหตุ/ปัญหา',
    announcements: 'ประกาศ',
  };

  const sidebarContent = (
    <>
      {/* ── Brand Header ── */}
      <div className="border-b border-slate-200/70 px-5 py-6">
        <div className="flex items-center gap-4 px-1">
          {/* Enlarged Logo */}
          <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 shadow-lg shadow-blue-500/30 ring-2 ring-white/80">
            <ShoppingBag className="h-7 w-7 text-white drop-shadow-sm" />
            {/* Decorative shine */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/20 via-transparent to-transparent" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-slate-900">Marketplace</h1>
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-blue-600">ADMIN</p>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {navItems.map((item) => {
          const isActive = currentPath === item.href || (item.href !== '/dashboard' && currentPath.startsWith(item.href));
          const Icon = iconMap[item.icon] ?? LayoutDashboard;
          const displayLabel = labelMap[item.id] ?? item.label;
          const hasBadge = item.badge && item.badge > 0;

          return (
            <NavLink
              key={item.id}
              to={item.href}
              onClick={() => {
                onNavigate(item.id);
                setIsMobileOpen(false);
              }}
              className={`group relative flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive || activeItemId === item.id
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-600 hover:bg-blue-50/70 hover:text-slate-900'
              }`}
              aria-label={displayLabel}
            >
              <span className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-200 ${
                isActive || activeItemId === item.id
                  ? 'bg-white/20'
                  : 'bg-slate-100/80 group-hover:bg-blue-100/80'
              }`}>
                <Icon className="h-[18px] w-[18px]" />
                {/* Badge on icon */}
                {hasBadge && !(isActive || activeItemId === item.id) && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                    {item.badge}
                  </span>
                )}
              </span>
              <span className="flex-1 text-left text-sm font-medium">{displayLabel}</span>
              {/* Badge in active state */}
              {hasBadge && (isActive || activeItemId === item.id) && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/25 px-1.5 text-[10px] font-bold text-white">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ── User Profile ── */}
      <div className="relative border-t border-slate-100 bg-slate-50/50 p-4">
        <div className="flex items-center gap-3">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName}
              className="h-10 w-10 flex-shrink-0 rounded-full border-2 border-white object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm">
              <span className="text-sm font-bold text-white">
                {userName.charAt(0)}
              </span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{userName}</p>
            <p className="truncate text-xs text-slate-400">{userRole}</p>
          </div>
          <button
            onClick={() => setIsUserMenuOpen((open) => !open)}
            className="flex-shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-slate-600 hover:shadow-sm"
            aria-label="เมนูผู้ใช้"
            aria-expanded={isUserMenuOpen}
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>

        {isUserMenuOpen && (
          <div className="absolute bottom-full left-4 right-4 mb-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
            <button
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              aria-label="ตั้งค่า"
            >
              <Settings className="h-4 w-4" />
              ตั้งค่า
            </button>
            <button
              onClick={onLogout}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              aria-label="ออกจากระบบ"
            >
              <LogOut className="h-4 w-4" />
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
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-slate-200/80 bg-white lg:flex">
        {sidebarContent}
      </aside>

      {/* Mobile Header Button */}
      <div className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center border-b border-slate-200 bg-white px-4 lg:hidden">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="rounded-lg p-2 transition-colors hover:bg-gray-100"
          aria-label="เปิด/ปิดเมนู"
          aria-expanded={isMobileOpen}
        >
          {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        <div className="ml-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
            <ShoppingBag className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold text-slate-900">Marketplace <span className="text-blue-600">ADMIN</span></span>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute left-0 top-0 h-screen w-64 flex-col overflow-y-auto bg-white shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};