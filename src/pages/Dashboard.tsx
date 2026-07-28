import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BadgeCheck,
  Store,
  Users,
  Wallet,
  CheckCircle2,
  ArrowUpRight,
  ShieldAlert,
  CreditCard,
  Map,
  Sparkles,
  TrendingUp,
  Building2,
  Clock,
  ChevronRight,
  Megaphone,
  FolderPlus,
  Heart,
  Search,
  Layers,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type OverviewCard = {
  title: string;
  value: number | string;
  subValue?: string;
  detail?: string;
  type?: string;
};

type CategoryShareItem = {
  id: string | number;
  name: string;
  count: number;
  percentage: number;
};

type UserInterestItem = {
  name: string;
  count: number;
  percentage: number;
};

type ZoneSummaryItem = {
  zone_id: number;
  zone_name: string;
  total_stalls: number;
  occupied_count: number;
  available_count: number;
};

type RecentActivityItem = {
  id?: string | number;
  type?: string;
  title: string;
  owner?: string;
  status: string;
  status_label: string;
  message: string;
  created_at: string;
};

type MarketSummary = {
  total_revenue?: number;
  total_stalls?: number;
  occupied_stalls?: number;
  available_stalls?: number;
  pending_bookings?: number;
  pending_reports?: number;
  total_shops?: number;
  total_sellers?: number;
  total_users_with_interests?: number;
};

type DashboardPayload = {
  summary: MarketSummary;
  overviewCards: OverviewCard[];
  categories: CategoryShareItem[];
  userInterests: UserInterestItem[];
  zones: ZoneSummaryItem[];
  recentActivity: RecentActivityItem[];
};

const categoryBarColors = [
  'from-blue-500 to-cyan-400',
  'from-emerald-500 to-teal-400',
  'from-amber-500 to-orange-400',
  'from-violet-500 to-purple-400',
];

const interestBarColors = [
  'from-rose-500 to-pink-400',
  'from-purple-500 to-indigo-400',
  'from-blue-500 to-sky-400',
  'from-amber-500 to-yellow-400',
  'from-emerald-500 to-teal-400',
];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardPayload>({
    summary: {},
    overviewCards: [],
    categories: [],
    userInterests: [],
    zones: [],
    recentActivity: [],
  });

  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);
  const [categorySuccessMsg, setCategorySuccessMsg] = useState('');

  const [isAddInterestOpen, setIsAddInterestOpen] = useState(false);
  const [interestName, setInterestName] = useState('');
  const [isSubmittingInterest, setIsSubmittingInterest] = useState(false);
  const [interestSuccessMsg, setInterestSuccessMsg] = useState('');

  const [categorySearch, setCategorySearch] = useState('');
  const [interestSearch, setInterestSearch] = useState('');
  const [isViewAllCategoriesOpen, setIsViewAllCategoriesOpen] = useState(false);
  const [isViewAllInterestsOpen, setIsViewAllInterestsOpen] = useState(false);

  const loadDashboardData = async () => {
    try {
      const response = await fetch('/api/v1/dashboard/overview');

      if (!response.ok) {
        throw new Error('Failed to load dashboard data');
      }

      const payload = await response.json();
      const data = payload?.data;

      if (!data) return;

      setDashboardData({
        summary: data.summary ?? {},
        overviewCards: data.overview_cards ?? [],
        categories: data.category_share ?? [],
        userInterests: data.user_interests ?? [],
        zones: data.zone_summary ?? [],
        recentActivity: data.recent_activity ?? [],
      });
    } catch {
      // Keep existing
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    setIsSubmittingCategory(true);
    try {
      const response = await fetch('/api/v1/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_name: categoryName.trim(),
          description: categoryDesc.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create category');
      }

      setCategoryName('');
      setCategoryDesc('');
      setIsAddCategoryOpen(false);
      setCategorySuccessMsg('เพิ่มหมวดหมู่สินค้าใหม่เรียบร้อยแล้ว!');
      setTimeout(() => setCategorySuccessMsg(''), 4000);
      await loadDashboardData();
    } catch {
      alert('เกิดข้อผิดพลาดในการบันทึกหมวดหมู่ใหม่');
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleAddInterest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interestName.trim()) return;

    setIsSubmittingInterest(true);
    try {
      const response = await fetch('/api/v1/user-interests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interest_name: interestName.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create user interest option');
      }

      setInterestName('');
      setIsAddInterestOpen(false);
      setInterestSuccessMsg('เพิ่มตัวเลือกความสนใจของผู้ใช้เรียบร้อยแล้ว!');
      setTimeout(() => setInterestSuccessMsg(''), 4000);
      await loadDashboardData();
    } catch {
      alert('เกิดข้อผิดพลาดในการบันทึกตัวเลือกความสนใจใหม่');
    } finally {
      setIsSubmittingInterest(false);
    }
  };

  useEffect(() => {
    void loadDashboardData();
  }, []);

  const { summary, zones, categories, userInterests, recentActivity } = dashboardData;

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(categorySearch.trim().toLowerCase())
  );

  const filteredInterests = userInterests.filter((i) =>
    i.name.toLowerCase().includes(interestSearch.trim().toLowerCase())
  );

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '฿0.00';
    return `฿${val.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => navigate('/payments')}
          className="group relative overflow-hidden rounded-[24px] border border-emerald-100 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/10 cursor-pointer"
        >
          <div className="absolute left-0 top-0 h-full w-1.5 rounded-r-full bg-gradient-to-b from-emerald-500 to-teal-600" />
          <div className="flex items-center justify-between pl-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">รายได้มัดจำรวม</span>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/30 group-hover:scale-110 transition-transform">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pl-2">
            <p className="text-3xl font-black tracking-tight text-emerald-700 font-mono">
              {formatCurrency(summary.total_revenue)}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>ยอดมัดจำชำระสมบูรณ์แล้ว</span>
            </div>
          </div>
          <ArrowUpRight className="absolute right-4 top-4 h-4 w-4 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
        </button>

        <button
          type="button"
          onClick={() => navigate('/verifications')}
          className="group relative overflow-hidden rounded-[24px] border border-amber-100 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/10 cursor-pointer"
        >
          <div className="absolute left-0 top-0 h-full w-1.5 rounded-r-full bg-gradient-to-b from-amber-500 to-orange-500" />
          <div className="flex items-center justify-between pl-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">คำขอจองรออนุมัติ</span>
            <div className="flex h-1-1 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30 group-hover:scale-110 transition-transform">
              <BadgeCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pl-2">
            <div className="flex items-baseline gap-1.5">
              <p className="text-3xl font-black tracking-tight text-amber-600">{summary.pending_bookings ?? 0}</p>
              <span className="text-sm font-semibold text-slate-400">รายการ</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
              <Clock className="h-3.5 w-3.5" />
              <span>รอการตรวจสอบจากแอดมิน</span>
            </div>
          </div>
          <ArrowUpRight className="absolute right-4 top-4 h-4 w-4 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
        </button>

        <button
          type="button"
          onClick={() => navigate('/reports')}
          className="group relative overflow-hidden rounded-[24px] border border-rose-100 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-rose-300 hover:shadow-lg hover:shadow-rose-500/10 cursor-pointer"
        >
          <div className="absolute left-0 top-0 h-full w-1.5 rounded-r-full bg-gradient-to-b from-rose-500 to-pink-500" />
          <div className="flex items-center justify-between pl-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">แจ้งเหตุ/ปัญหา</span>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/30 group-hover:scale-110 transition-transform">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pl-2">
            <div className="flex items-baseline gap-1.5">
              <p className="text-3xl font-black tracking-tight text-rose-600">{summary.pending_reports ?? 0}</p>
              <span className="text-sm font-semibold text-slate-400">เคส</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-rose-600">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              <span>ต้องตรวจสอบ / ซ่อมแซมด่วน</span>
            </div>
          </div>
          <ArrowUpRight className="absolute right-4 top-4 h-4 w-4 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
        </button>

        <button
          type="button"
          onClick={() => navigate('/stores')}
          className="group relative overflow-hidden rounded-[24px] border border-blue-100 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer"
        >
          <div className="absolute left-0 top-0 h-full w-1.5 rounded-r-full bg-gradient-to-b from-blue-600 to-indigo-600" />
          <div className="flex items-center justify-between pl-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">อัตราการครองแผง</span>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30 group-hover:scale-110 transition-transform">
              <Store className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pl-2">
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-black tracking-tight text-slate-900">{summary.occupied_stalls ?? 0}</p>
              <span className="text-base font-bold text-slate-400">/{summary.total_stalls ?? 0} แผง</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-blue-600">
              <Building2 className="h-3.5 w-3.5" />
              <span>
                {summary.total_stalls
                  ? `${Math.round(((summary.occupied_stalls ?? 0) / summary.total_stalls) * 100)}% ของความจุตลาด`
                  : '0%'}
              </span>
            </div>
          </div>
          <ArrowUpRight className="absolute right-4 top-4 h-4 w-4 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-sky-500" /> ทางลัดการจัดการข้อมูล (Admin Quick Actions)
          </h3>
          <span className="text-xs text-slate-400 font-medium">คลิกเพื่อไปยังหน้านั้นๆ ทันที</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'อนุมัติการจองแผง', icon: BadgeCheck, href: '/verifications', color: 'from-amber-500 to-orange-500', badge: summary.pending_bookings },
            { label: 'ตรวจสอบการชำระเงิน', icon: CreditCard, href: '/payments', color: 'from-emerald-500 to-teal-500' },
            { label: 'แผนผังแผงค้าตลาด', icon: Map, href: '/stores', color: 'from-blue-600 to-indigo-600' },
            { label: 'จัดการข้อมูลผู้ค้า', icon: Users, href: '/sellers', color: 'from-sky-500 to-blue-600' },
            { label: 'สร้างประกาศข่าวสาร', icon: Megaphone, href: '/announcements', color: 'from-purple-500 to-pink-500' },
          ].map((action) => {
            const IconComp = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                onClick={() => navigate(action.href)}
                className="group flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 text-center transition-all duration-200 hover:border-blue-300 hover:bg-white hover:shadow-md active:scale-95"
              >
                <div className="relative mb-2">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${action.color} text-white shadow-md transition-transform group-hover:scale-110`}>
                    <IconComp className="h-6 w-6" />
                  </div>
                  {action.badge ? (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white shadow-sm ring-2 ring-white">
                      {action.badge}
                    </span>
                  ) : null}
                </div>
                <span className="text-xs font-bold text-slate-800 transition group-hover:text-blue-600">{action.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3 items-stretch">
        <div className="h-[500px] rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between overflow-hidden">
          <div className="shrink-0 mb-3 border-b border-slate-100 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">ความหนาแน่นโซนตลาด</h3>
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200/60">
                    {zones.length} โซน
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">สถานะแผงค้าว่างและแผงจองแบ่งตามโซน</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/stores')}
                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition"
              >
                <span>ผังเต็ม</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
            {zones.length > 0 ? (
              zones.map((zone) => {
                const total = zone.total_stalls || 1;
                const occupiedPct = Math.round((zone.occupied_count / total) * 100);
                return (
                  <div key={zone.zone_id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-2 hover:bg-blue-50/30 transition-colors">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{zone.zone_name}</span>
                      <div className="flex items-center gap-2.5">
                        <span className="font-semibold text-emerald-700">จองแล้ว {zone.occupied_count}</span>
                        <span className="font-semibold text-slate-400">ว่าง {zone.available_count}</span>
                        <span className="font-black text-blue-600">{occupiedPct}%</span>
                      </div>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-200/80 flex">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
                        style={{ width: `${occupiedPct}%` }}
                      />
                      <div
                        className="h-full bg-emerald-400/80 transition-all duration-500"
                        style={{ width: `${100 - occupiedPct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">ไม่มีข้อมูลโซนตลาด</div>
            )}
          </div>

          <div className="shrink-0 pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-400">
            <span>รวม {zones.length} โซนในผังตลาด</span>
            <span className="font-bold text-slate-700">ความจุ {summary.total_stalls ?? 0} แผง</span>
          </div>
        </div>

        <div className="h-[500px] rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between overflow-hidden">
          <div className="shrink-0 mb-3 border-b border-slate-100 pb-3 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">สัดส่วนประเภทสินค้า</h3>
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-200/60">
                    {categories.length} หมวดหมู่
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">หมวดหมู่ร้านค้าจำแนกตามความนิยม</p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddCategoryOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition active:scale-95 cursor-pointer"
              >
                <FolderPlus className="h-4 w-4" />
                <span>เพิ่มหมวดหมู่</span>
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาหมวดหมู่สินค้า..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200/80 bg-slate-50/70 pl-8 pr-3 py-1.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
              {categorySearch && (
                <button
                  type="button"
                  onClick={() => setCategorySearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {categorySuccessMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 animate-in fade-in duration-200">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>{categorySuccessMsg}</span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category, index) => (
                <div key={`${category.id ?? 'cat'}-${category.name}`} className="group rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 transition-colors hover:bg-blue-50/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-slate-800">{category.name}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{category.count} ร้านค้าที่เปิดบริการ</p>
                    </div>
                    <div className="rounded-lg bg-white px-2.5 py-1 text-xs font-extrabold text-blue-700 shadow-2xs border border-slate-200/60">
                      {category.percentage}%
                    </div>
                  </div>
                  <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-slate-200/70">
                    <div
                      className={`h-2.5 rounded-full bg-gradient-to-r transition-all duration-700 ease-out ${categoryBarColors[index % categoryBarColors.length]}`}
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">ไม่พบหมวดหมู่สินค้าที่ค้นหา</div>
            )}
          </div>

          <div className="shrink-0 pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-400">
            <span>รวม {categories.length} หมวดหมู่</span>
            <button
              type="button"
              onClick={() => setIsViewAllCategoriesOpen(true)}
              className="flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700 transition"
            >
              <span>ดูทั้งหมด ({categories.length})</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="h-[500px] rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between overflow-hidden">
          <div className="shrink-0 mb-3 border-b border-slate-100 pb-3 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
                    <Heart className="h-5 w-5 text-rose-500 fill-rose-500/20" />
                    <span>ความสนใจของผู้ใช้</span>
                  </h3>
                  <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200/60">
                    {userInterests.length} ตัวเลือก
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">สิ่งที่ผู้สมัครเลือกตอนลงทะเบียน</p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddInterestOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition active:scale-95 cursor-pointer"
              >
                <Heart className="h-4 w-4" />
                <span>เพิ่มตัวเลือก</span>
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาตัวเลือกความสนใจ..."
                value={interestSearch}
                onChange={(e) => setInterestSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200/80 bg-slate-50/70 pl-8 pr-3 py-1.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-rose-500 focus:bg-white focus:outline-none"
              />
              {interestSearch && (
                <button
                  type="button"
                  onClick={() => setInterestSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {interestSuccessMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 animate-in fade-in duration-200">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>{interestSuccessMsg}</span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
            {filteredInterests.length > 0 ? (
              filteredInterests.map((interest, index) => (
                <div key={`interest-${interest.name}`} className="group rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 transition-colors hover:bg-rose-50/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {index === 0 && <span className="text-xs">🔥</span>}
                      <div>
                        <p className="font-bold text-sm text-slate-800">{interest.name}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{interest.count} คนเลือกสนใจ</p>
                      </div>
                    </div>
                    <div className="rounded-lg bg-white px-2.5 py-1 text-xs font-extrabold text-rose-600 shadow-2xs border border-slate-200/60">
                      {interest.percentage}%
                    </div>
                  </div>
                  <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-slate-200/70">
                    <div
                      className={`h-2.5 rounded-full bg-gradient-to-r transition-all duration-700 ease-out ${interestBarColors[index % interestBarColors.length]}`}
                      style={{ width: `${interest.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">ไม่พบตัวเลือกความสนใจที่ค้นหา</div>
            )}
          </div>

          <div className="shrink-0 pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-400">
            <span>ผู้เลือก {summary.total_users_with_interests ?? 0} คน</span>
            <button
              type="button"
              onClick={() => setIsViewAllInterestsOpen(true)}
              className="flex items-center gap-1 font-bold text-rose-600 hover:text-rose-700 transition"
            >
              <span>ดูทั้งหมด ({userInterests.length})</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900">กิจกรรมและแจ้งเตือนล่าสุด</h3>
            <p className="mt-0.5 text-xs text-slate-400">คำขอจองและการรายงานปัญหาที่เกิดขึ้นในตลาด</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/verifications')}
            className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition"
          >
            <span>ดูทั้งหมด</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {recentActivity.length > 0 ? (
            recentActivity.map((item, index) => {
              const isApproved = ['approved', 'resolved', 'verified'].includes(item.status?.toLowerCase() || '');
              const isPending = ['pending', 'progress', 'refund_requested'].includes(item.status?.toLowerCase() || '');
              const isReport = item.type === 'report';

              return (
                <div
                  key={`${item.id ?? 'act'}-${index}`}
                  onClick={() => {
                    if (isReport) navigate('/reports');
                    else if (item.id) navigate(`/verifications?booking_id=${item.id}`);
                  }}
                  className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition-all duration-200 hover:border-blue-200 hover:bg-white hover:shadow-xs cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-xs font-bold text-sm shrink-0 ${isReport
                          ? 'bg-gradient-to-br from-rose-500 to-pink-600'
                          : 'bg-gradient-to-br from-blue-600 to-indigo-600'
                        }`}
                    >
                      {isReport ? <ShieldAlert className="h-5 w-5" /> : <BadgeCheck className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition">{item.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500 font-medium truncate">{item.message}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 text-right">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${isApproved
                          ? 'bg-emerald-100 text-emerald-800'
                          : isPending
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                    >
                      {isApproved && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {isPending && <Clock className="h-3.5 w-3.5" />}
                      <span>{item.status_label}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">ยังไม่มีกิจกรรมล่าสุด</div>
          )}
        </div>
      </section>

      {/* ── Add Category Modal Portal ── */}
      {isAddCategoryOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                    <FolderPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">เพิ่มหมวดหมู่สินค้าใหม่</h3>
                    <p className="text-xs text-slate-400">สำหรับจำแนกประเภทสินค้าของผู้ค้าในตลาด</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(false)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddCategory} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ชื่อหมวดหมู่สินค้า <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น กิฟต์ช็อป, งานแฮนด์เมด, ผักผลไม้สด"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    คำอธิบายหมวดหมู่ (ระบุหรือไม่ก็ได้)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="อธิบายสินค้าในหมวดหมู่นี้สั้นๆ..."
                    value={categoryDesc}
                    onChange={(e) => setCategoryDesc(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddCategoryOpen(false)}
                    className="rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingCategory || !categoryName.trim()}
                    className="flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {isSubmittingCategory ? (
                      <span>กำลังบันทึก...</span>
                    ) : (
                      <>
                        <FolderPlus className="h-4 w-4" />
                        <span>บันทึกหมวดหมู่</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ── Add User Interest Modal Portal ── */}
      {isAddInterestOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                    <Heart className="h-5 w-5 fill-rose-600/20" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">เพิ่มตัวเลือกความสนใจของผู้ใช้</h3>
                    <p className="text-xs text-slate-400">สำหรับตัวเลือกการสมัครสมาชิกบนแอปมือถือ</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddInterestOpen(false)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddInterest} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ชื่อหมวดหมู่ความสนใจ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น แฟชั่น & ความงาม, อุปกรณ์อิเล็กทรอนิกส์, สินค้ามือสอง"
                    value={interestName}
                    onChange={(e) => setInterestName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddInterestOpen(false)}
                    className="rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingInterest || !interestName.trim()}
                    className="flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-600/30 hover:bg-rose-700 transition disabled:opacity-50"
                  >
                    {isSubmittingInterest ? (
                      <span>กำลังบันทึก...</span>
                    ) : (
                      <>
                        <Heart className="h-4 w-4" />
                        <span>บันทึกความสนใจ</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ── View All Categories Modal Portal ── */}
      {isViewAllCategoriesOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-3xl max-h-[85vh] rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl flex flex-col justify-between space-y-4 animate-in zoom-in-95 duration-200 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                    <Layers className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">รายการหมวดหมู่สินค้าทั้งหมด ({categories.length})</h3>
                    <p className="text-xs text-slate-400">หมวดหมู่ร้านค้าทั้งหมดในระบบตลาดนัด</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsViewAllCategoriesOpen(false);
                      setIsAddCategoryOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition"
                  >
                    <FolderPlus className="h-4 w-4" />
                    <span>เพิ่มหมวดหมู่ใหม่</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsViewAllCategoriesOpen(false)}
                    className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="relative shrink-0">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาตามชื่อหมวดหมู่สินค้า..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((category, index) => (
                      <div key={`all-cat-${category.name}`} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-800">{category.name}</span>
                          <span className="rounded-lg bg-white px-2 py-1 text-xs font-extrabold text-blue-700 shadow-2xs border border-slate-200/60">
                            {category.percentage}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{category.count} ร้านค้าในหมวดหมู่นี้</p>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-200/70">
                          <div
                            className={`h-2 rounded-full bg-gradient-to-r ${categoryBarColors[index % categoryBarColors.length]}`}
                            style={{ width: `${category.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 py-12 text-center text-xs text-slate-400">ไม่พบหมวดหมู่สินค้าที่ค้นหา</div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0 text-xs font-medium text-slate-400">
                <span>แสดง {filteredCategories.length} จากทั้งหมด {categories.length} หมวดหมู่</span>
                <button
                  type="button"
                  onClick={() => setIsViewAllCategoriesOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ── View All Interests Modal Portal ── */}
      {isViewAllInterestsOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-3xl max-h-[85vh] rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl flex flex-col justify-between space-y-4 animate-in zoom-in-95 duration-200 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                    <Heart className="h-6 w-6 fill-rose-600/20" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">ตัวเลือกความสนใจทั้งหมด ({userInterests.length})</h3>
                    <p className="text-xs text-slate-400">ความสนใจทั้งหมดที่ผู้ใช้สามารถเลือกได้เมื่อลงทะเบียน</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsViewAllInterestsOpen(false);
                      setIsAddInterestOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition"
                  >
                    <Heart className="h-4 w-4" />
                    <span>เพิ่มตัวเลือกใหม่</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsViewAllInterestsOpen(false)}
                    className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="relative shrink-0">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาตัวเลือกความสนใจ..."
                  value={interestSearch}
                  onChange={(e) => setInterestSearch(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredInterests.length > 0 ? (
                    filteredInterests.map((interest, index) => (
                      <div key={`all-int-${interest.name}`} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {index === 0 && <span className="text-xs">🔥</span>}
                            <span className="font-bold text-sm text-slate-800">{interest.name}</span>
                          </div>
                          <span className="rounded-lg bg-white px-2 py-1 text-xs font-extrabold text-rose-600 shadow-2xs border border-slate-200/60">
                            {interest.percentage}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{interest.count} คนเลือกสนใจ</p>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-200/70">
                          <div
                            className={`h-2 rounded-full bg-gradient-to-r ${interestBarColors[index % interestBarColors.length]}`}
                            style={{ width: `${interest.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 py-12 text-center text-xs text-slate-400">ไม่พบตัวเลือกความสนใจที่ค้นหา</div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0 text-xs font-medium text-slate-400">
                <span>แสดง {filteredInterests.length} จากทั้งหมด {userInterests.length} ตัวเลือก</span>
                <button
                  type="button"
                  onClick={() => setIsViewAllInterestsOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
