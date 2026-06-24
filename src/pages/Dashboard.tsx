import React, { useEffect, useState } from 'react';
import { BadgeCheck, Store, TrendingUp, Users, Wallet } from 'lucide-react';
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
    {
      title: 'คำขอจองที่รออนุมัติ',
      value: mockDashboardMetrics.pendingCount,
      subValue: '',
      detail: 'รอการตรวจสอบจากแอดมิน',
      type: 'booking',
    },
    {
      title: 'แจ้งเตือนเหตุ',
      value: mockDashboardMetrics.notificationCount,
      subValue: '',
      detail: 'ต้องตรวจสอบทันที',
      type: 'report',
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
    title: review.storeName,
    status: review.status,
    status_label: review.status === 'success' ? 'สำเร็จ' : 'รออนุมัติ',
    message: review.message,
    created_at: review.timestamp.toISOString(),
  })),
});

const getCardConfig = (title: string) => {
  switch (title) {
    case 'ล็อกที่มีคนจอง':
      return { icon: Wallet, tint: 'bg-blue-50 text-blue-600', valueColor: 'text-slate-900', accent: 'from-blue-600 to-cyan-500', border: 'border-blue-100' };
    case 'ล็อกที่ว่าง':
      return { icon: Store, tint: 'bg-emerald-50 text-emerald-600', valueColor: 'text-emerald-600', accent: 'from-emerald-600 to-lime-500', border: 'border-emerald-100' };
    case 'คำขอจองที่รออนุมัติ':
      return { icon: BadgeCheck, tint: 'bg-amber-50 text-amber-600', valueColor: 'text-amber-600', accent: 'from-amber-500 to-orange-500', border: 'border-amber-100', href: '/verifications' };
    default:
      return { icon: Users, tint: 'bg-rose-50 text-rose-600', valueColor: 'text-rose-600', accent: 'from-rose-600 to-pink-500', border: 'border-rose-100', href: '/reports' };
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
    <div className="space-y-6">
      <section className="rounded-[24px] border border-slate-200 bg-gradient-to-r from-slate-50 via-blue-50/80 to-white p-6 shadow-[0_10px_30px_-20px_rgba(37,99,235,0.25)]">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Overview</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">ภาพรวม Marketplace</h2>
            <p className="mt-2 text-sm text-slate-500">สรุปสถานะตลาดและผู้ขายในมุมมองที่ชัดเจนและเรียบง่าย</p>
          </div>
        </div>
      </section>

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
          กำลังโหลดข้อมูลจากระบบ...
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const isInteractive = Boolean(card.href);

          return (
            <button
              key={`${card.title}-${index}`}
              type="button"
              onClick={() => card.href && navigate(card.href)}
              className={`relative overflow-hidden rounded-[22px] border bg-white p-5 text-left shadow-[0_10px_24px_-18px_rgba(15,23,42,0.35)] ${card.border} ${isInteractive ? 'cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md' : ''}`}
            >
              <div className={`absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b ${card.accent}`} />
              <div className="flex items-center justify-between pl-2">
                <p className="text-sm font-semibold text-slate-600">{card.title}</p>
                <div className={`rounded-2xl border border-slate-200 p-2.5 ${card.tint}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4 flex items-end gap-1 pl-2">
                <p className={`text-4xl font-semibold leading-none ${card.valueColor}`}>{card.value}</p>
                {card.subValue ? <span className="pb-1 text-sm font-medium text-slate-400">{card.subValue}</span> : null}
              </div>
              {card.detail ? (
                <p className={`mt-3 pl-2 text-sm ${card.detail === 'พร้อมเปิดให้จอง' ? 'rounded-full bg-emerald-50 px-3 py-1.5 font-medium text-emerald-700 w-fit' : 'text-slate-500'}`}>
                  {card.detail}
                </p>
              ) : card.title === 'แจ้งเตือนเหตุ' ? (
                <div className="mt-3 flex items-center gap-2 pl-2 text-rose-600">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                    <path d="M12 2L1 21h22L12 2zm0 4.2l7.2 13.8H4.8L12 6.2zm-1 3v5h2V9h-2zm0 7v2h2v-2h-2z" />
                  </svg>
                  <span className="text-sm font-medium">ต้องตรวจสอบทันที</span>
                </div>
              ) : null}
            </button>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">สัดส่วนหมวดหมู่</h3>
            <p className="text-sm text-slate-500">ข้อมูลยอดนิยมในตลาด</p>
          </div>

          <div className="mt-5 space-y-4">
            {categories.map((category, index) => (
              <div key={`${category.id ?? 'category'}-${category.name}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{category.name}</p>
                    <p className="text-sm text-slate-500">{category.count} ร้าน</p>
                  </div>
                  <div className="text-sm font-semibold text-blue-700">{category.percentage}%</div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-200">
                  <div className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" style={{ width: `${category.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">รายการล่าสุด</h3>
            <p className="text-sm text-slate-500">คำขอการตรวจสอบและสถานะล่าสุด</p>
          </div>

          <div className="mt-5 space-y-3">
            {recentItems.slice(0, 4).map((item, index) => {
              const isSuccess = ['approved', 'success', 'resolved', 'verified'].includes(item.status.toLowerCase());

              return (
                <div key={`${item.id ?? 'activity'}-${item.title}-${item.created_at ?? index}`} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                      {item.title.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <p className="text-sm text-slate-500">{item.message}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">สถานะ</p>
                    <p className={`mt-1 text-sm font-semibold ${isSuccess ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {item.status_label}
                    </p>
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
