import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { formatImageUrl } from '../../utils/imageUtils';
import {
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
      <div className="border-b border-slate-200/70 px-5 py-5">
        <div className="group flex items-center gap-3.5 px-1 cursor-pointer">
          {/* Custom Image Logo with Smooth Animation & Size */}
          <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-blue-600/10 p-2 shadow-sm ring-1 ring-blue-200/60 transition-all duration-300 group-hover:scale-105 group-hover:shadow-md group-hover:shadow-blue-500/20 group-hover:ring-blue-400">
            <img
              src="/logo.png"
              alt="Marketplace Logo"
              className="h-full w-full object-contain drop-shadow-sm transition-transform duration-300 group-hover:rotate-3 animate-float-slow"
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900 transition-colors duration-200 group-hover:text-blue-600">Marketplace</h1>
            <p className="text-[11px] font-black uppercase tracking-[0.32em] text-blue-600">ADMIN</p>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-5">
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
              className={`group relative flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
                isActive || activeItemId === item.id
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30 scale-[1.01]'
                  : 'text-slate-600 hover:translate-x-1 hover:bg-blue-50/80 hover:text-blue-700'
              }`}
              aria-label={displayLabel}
            >
              <span className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 ${
                isActive || activeItemId === item.id
                  ? 'bg-white/20'
                  : 'bg-slate-100/80 group-hover:scale-110 group-hover:bg-blue-100 group-hover:text-blue-600'
              }`}>
                <Icon className="h-[18px] w-[18px] transition-transform duration-200 group-hover:rotate-6" />
                {/* Badge on icon */}
                {hasBadge && !(isActive || activeItemId === item.id) && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white shadow-sm ring-2 ring-white animate-bounce">
                    {item.badge}
                  </span>
                )}
              </span>
              <span className="flex-1 text-left text-sm font-semibold">{displayLabel}</span>
              {/* Badge in active state */}
              {hasBadge && (isActive || activeItemId === item.id) && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/25 px-1.5 text-[10px] font-black text-white">
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
              src={formatImageUrl(userAvatar)}
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
        <div className="ml-3 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50/80 p-1 ring-1 ring-blue-200/60 shadow-xs">
            <img src="/logo.png" alt="Logo" className="h-full w-full object-contain" />
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