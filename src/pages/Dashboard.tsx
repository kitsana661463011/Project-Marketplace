import React, { useEffect, useState } from 'react';
import { BadgeCheck, Store, Users, Wallet, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockDashboardMetrics } from '../data/mockData';

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

type DashboardPayload = {
  overviewCards: OverviewCard[];
  categories: CategoryShareItem[];
  recentActivity: RecentActivityItem[];
};

const createFallbackData = (): DashboardPayload => ({
  overviewCards: [
    {
      title: 'แจ้งเตือนเหตุ',
      value: mockDashboardMetrics.notificationCount,
      subValue: '',
      detail: 'ต้องตรวจสอบทันที',
      type: 'report',
    },
    {
      title: 'คำขอจองที่รออนุมัติ',
      value: mockDashboardMetrics.pendingCount,
      subValue: '',
      detail: 'รอการตรวจสอบจากแอดมิน',
      type: 'booking',
    },
    {
      title: 'ล็อกที่มีคนจอง',
      value: mockDashboardMetrics.totalRating,
      subValue: `/${mockDashboardMetrics.totalRating + mockDashboardMetrics.readyCount}`,
      detail: '',
      type: 'occupied',
    },
    {
      title: 'ล็อกที่ว่าง',
      value: mockDashboardMetrics.readyCount,
      subValue: '',
      detail: 'พร้อมเปิดให้จอง',
      type: 'available',
    },
  ],
  categories: mockDashboardMetrics.categories.map((category) => ({
    id: category.id,
    name: category.name,
    count: category.count,
    percentage: category.percentage,
  })),
  recentActivity: mockDashboardMetrics.recentReviews.map((review) => ({
    id: review.id,
    type: 'booking',
    title: review.storeName,
    status: review.status,
    status_label: review.status === 'success' ? 'สำเร็จ' : 'รออนุมัติ',
    message: review.message,
    created_at: review.timestamp.toISOString(),
  })),
});

const categoryBarColors = [
  'from-blue-500 to-cyan-400',
  'from-emerald-500 to-teal-400',
  'from-amber-500 to-orange-400',
  'from-violet-500 to-purple-400',
];

const getCardConfig = (title: string) => {
  switch (title) {
    case 'ล็อกที่มีคนจอง':
      return {
        icon: Wallet,
        tint: 'bg-blue-50 text-blue-600',
        valueColor: 'text-slate-900',
        accent: 'from-blue-600 to-cyan-500',
        border: 'border-blue-100',
        iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      };
    case 'ล็อกที่ว่าง':
      return {
        icon: Store,
        tint: 'bg-emerald-50 text-emerald-600',
        valueColor: 'text-emerald-600',
        accent: 'from-emerald-500 to-teal-400',
        border: 'border-emerald-100',
        iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-500',
        href: '/stores',
      };
    case 'คำขอจองที่รออนุมัติ':
      return {
        icon: BadgeCheck,
        tint: 'bg-amber-50 text-amber-600',
        valueColor: 'text-amber-600',
        accent: 'from-amber-500 to-orange-400',
        border: 'border-amber-100',
        iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500',
        href: '/verifications',
      };
    default:
      return {
        icon: Users,
        tint: 'bg-rose-50 text-rose-600',
        valueColor: 'text-rose-600',
        accent: 'from-rose-500 to-pink-400',
        border: 'border-rose-100',
        iconBg: 'bg-gradient-to-br from-rose-500 to-pink-500',
        href: '/reports',
      };
  }
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardPayload>(createFallbackData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      setLoading(true);

      try {
        const response = await fetch('/api/v1/dashboard/overview');

        if (!response.ok) {
          throw new Error('Failed to load dashboard data');
        }

        const payload = await response.json();
        const data = payload?.data;

        if (!isMounted || !data) {
          return;
        }

        setDashboardData({
          overviewCards: data.overview_cards ?? [],
          categories: data.category_share ?? [],
          recentActivity: data.recent_activity ?? [],
        });
      } catch {
        setDashboardData(createFallbackData());
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const statCards = (dashboardData.overviewCards.length ? dashboardData.overviewCards : createFallbackData().overviewCards).map((card) => ({
    ...getCardConfig(card.title),
    ...card,
  }));

  const categories = dashboardData.categories.length ? dashboardData.categories : createFallbackData().categories;
  const recentItems = dashboardData.recentActivity.length ? dashboardData.recentActivity : createFallbackData().recentActivity;

  return (
    <div className="space-y-7">

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
          กำลังโหลดข้อมูลจากระบบ...
        </div>
      )}

      {/* ── KPI Cards ── */}
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const isInteractive = Boolean(card.href);

          return (
            <button
              key={`${card.title}-${index}`}
              type="button"
              onClick={() => card.href && navigate(card.href)}
              className={`card-hover group relative overflow-hidden rounded-[24px] border bg-white p-6 text-left shadow-[0_4px_24px_-12px_rgba(15,23,42,0.12)] ${card.border} ${isInteractive ? 'cursor-pointer' : ''}`}
            >
              {/* Left accent bar */}
              <div className={`absolute left-0 top-0 h-full w-1.5 rounded-r-full bg-gradient-to-b ${card.accent}`} />

              <div className="flex items-center justify-between pl-3">
                <p className="text-sm font-semibold text-slate-500">{card.title}</p>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-sm ${card.iconBg}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-5 flex items-end gap-1 pl-3">
                <p className={`text-4xl font-bold leading-none tracking-tight ${card.valueColor}`}>{card.value}</p>
                {card.subValue ? <span className="pb-1 text-base font-medium text-slate-300">{card.subValue}</span> : null}
              </div>

              {card.detail ? (
                <div className="mt-4 pl-3">
                  {card.detail === 'พร้อมเปิดให้จอง' ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200/60">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {card.detail}
                    </span>
                  ) : card.title === 'แจ้งเตือนเหตุ' ? (
                    <div className="flex items-center gap-2 text-rose-600">
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                        <path d="M12 2L1 21h22L12 2zm0 4.2l7.2 13.8H4.8L12 6.2zm-1 3v5h2V9h-2zm0 7v2h2v-2h-2z" />
                      </svg>
                      <span className="text-sm font-semibold">{card.detail}</span>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">{card.detail}</p>
                  )}
                </div>
              ) : card.title === 'แจ้งเตือนเหตุ' ? (
                <div className="mt-4 flex items-center gap-2 pl-3 text-rose-600">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                    <path d="M12 2L1 21h22L12 2zm0 4.2l7.2 13.8H4.8L12 6.2zm-1 3v5h2V9h-2zm0 7v2h2v-2h-2z" />
                  </svg>
                  <span className="text-sm font-semibold">ต้องตรวจสอบทันที</span>
                </div>
              ) : null}

              {/* Hover arrow for interactive cards */}
              {isInteractive && (
                <div className="absolute right-4 top-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <ArrowUpRight className="h-4 w-4 text-slate-300" />
                </div>
              )}
            </button>
          );
        })}
      </section>

      {/* ── Bottom Section: Categories + Recent Activity ── */}
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        {/* Category Share */}
        <div className="rounded-[28px] border border-slate-200/80 bg-white p-7 shadow-[0_4px_24px_-12px_rgba(15,23,42,0.08)]">
          <div>
            <h3 className="text-lg font-bold text-slate-900">สัดส่วนหมวดหมู่</h3>
            <p className="mt-1 text-sm text-slate-400">ข้อมูลยอดนิยมในตลาด</p>
          </div>

          <div className="mt-6 space-y-4">
            {categories.map((category, index) => (
              <div key={`${category.id ?? 'category'}-${category.name}-${index}`} className="group rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition-colors duration-200 hover:border-blue-100 hover:bg-blue-50/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">{category.name}</p>
                    <p className="mt-0.5 text-sm text-slate-400">{category.count} ร้าน</p>
                  </div>
                  <div className="rounded-lg bg-white px-2.5 py-1 text-sm font-bold text-blue-700 shadow-sm ring-1 ring-slate-100">
                    {category.percentage}%
                  </div>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200/70">
                  <div
                    className={`h-2.5 rounded-full bg-gradient-to-r transition-all duration-700 ease-out ${categoryBarColors[index % categoryBarColors.length]}`}
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-[28px] border border-slate-200/80 bg-white p-7 shadow-[0_4px_24px_-12px_rgba(15,23,42,0.08)]">
          <div>
            <h3 className="text-lg font-bold text-slate-900">รายการล่าสุด</h3>
            <p className="mt-1 text-sm text-slate-400">สถานะการตรวจสอบล่าสุดของระบบ</p>
          </div>

          <div className="mt-6 space-y-3">
            {recentItems.slice(0, 4).map((item, index) => {
              const isSuccess = ['approved', 'success', 'resolved', 'verified'].includes(item.status.toLowerCase());
              const isBooking = item.type === 'booking';
              const cursorClass = isBooking ? 'cursor-pointer hover:border-sky-300 hover:bg-sky-50/20 active:scale-[0.99] transition-all' : '';

              return (
                <div 
                  key={`${item.id ?? 'activity'}-${item.title}-${item.created_at ?? index}`} 
                  onClick={() => {
                    if (isBooking && item.id) {
                      navigate(`/verifications?booking_id=${item.id}`);
                    }
                  }}
                  title={isBooking ? 'คลิกเพื่อตรวจสอบรายการจองนี้' : undefined}
                  className={`group flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3.5 transition-all duration-200 hover:shadow-sm ${cursorClass}`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 text-sm font-bold text-blue-600">
                      {item.title.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800">{item.title}</p>
                      <p className="mt-0.5 text-sm text-slate-400">{item.message}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">สถานะ</p>
                    <div className="mt-1 flex items-center justify-end gap-1.5">
                      {isSuccess && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                      <p className={`text-sm font-bold ${isSuccess ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {item.status_label}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
