import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Store, CreditCard, ShieldAlert, ChevronRight, CheckCircle2 } from 'lucide-react';

interface TopbarProps {
  title: string;
  badgeCounts?: {
    verifications?: number;
    sellers?: number;
    reports?: number;
  };
}

export const Topbar: React.FC<TopbarProps> = ({ title, badgeCounts }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const verifications = badgeCounts?.verifications || 0;
  const sellers = badgeCounts?.sellers || 0;
  const reports = badgeCounts?.reports || 0;
  const total = verifications + sellers + reports;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-30 h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 lg:left-64 lg:h-20">
      <div className="flex h-full items-center justify-between px-4 lg:px-8">
        <div>
          <h1 className="text-xl font-bold text-slate-900 lg:text-2xl">{title}</h1>
        </div>

        {/* Admin Notification Center */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-50/80 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition active:scale-95 cursor-pointer"
            title="การแจ้งเตือนงานค้าง"
          >
            <Bell className="h-5 w-5" />
            {total > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white shadow-xs animate-in zoom-in-75">
                {total > 99 ? '99+' : total}
              </span>
            )}
          </button>

          {/* Dropdown Popover */}
          {isOpen && (
            <div className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 z-50">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-900">การแจ้งเตือนงานค้าง</span>
                  {total > 0 && (
                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-black text-rose-600 border border-rose-200">
                      {total} รายการ
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-slate-400">ระบบแอดมิน</span>
              </div>

              <div className="space-y-1.5 py-1">
                {/* 1. คำขอสมัครผู้ค้า */}
                <button
                  type="button"
                  onClick={() => handleSelect('/sellers')}
                  className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
                      <Store className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition">
                        คำขอสมัครเป็นผู้ค้า
                      </h4>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {sellers > 0 ? `รอตรวจสอบเอกสาร ${sellers} รายการ` : 'ไม่มีคำขอค้างตรวจ'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {sellers > 0 ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-700">
                        {sellers}
                      </span>
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    )}
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition" />
                  </div>
                </button>

                {/* 2. สลิปชำระเงินรอตรวจ */}
                <button
                  type="button"
                  onClick={() => handleSelect('/verifications')}
                  className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60">
                      <CreditCard className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition">
                        สลิปชำระเงิน / การจอง
                      </h4>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {verifications > 0 ? `รอตรวจสอบการโอน ${verifications} รายการ` : 'ตรวจสอบครบถ้วนแล้ว'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {verifications > 0 ? (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-black text-blue-700">
                        {verifications}
                      </span>
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    )}
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition" />
                  </div>
                </button>

                {/* 3. รายงานปัญหา */}
                <button
                  type="button"
                  onClick={() => handleSelect('/reports')}
                  className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-200/60">
                      <ShieldAlert className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition">
                        ปัญหาที่แจ้งเข้ามา
                      </h4>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {reports > 0 ? `รอดำเนินการแก้ไข ${reports} รายการ` : 'ไม่มีปัญหาค้าง'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {reports > 0 ? (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-black text-rose-700">
                        {reports}
                      </span>
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    )}
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition" />
                  </div>
                </button>
              </div>

              {total === 0 && (
                <div className="mt-2 pt-2 border-t border-slate-100 text-center text-xs font-bold text-emerald-600">
                  🎉 ยอดเยี่ยม! จัดการงานค้างครบทุกรายการแล้ว
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
