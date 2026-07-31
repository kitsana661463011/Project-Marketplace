import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  Bold,
  Building2,
  CalendarDays,
  Camera,
  CheckCircle2,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  ImageOff,
  Inbox,
  Italic,
  Link,
  List,
  Plus,
  Receipt,
  Search,
  Wrench,
  XCircle,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Announcement, IssueReport } from '../types';
import { ActionButton } from '../components/common';

type ReservationStatus = 'pending' | 'approved' | 'rejected' | 'refund_requested' | 'refunded';

interface ReservationItem {
  id: number;
  bookingId: string;
  tenantName: string;
  tenantAvatar: string;
  stallNumber: string;
  bookingDate: string;
  bookingDateValue: string;
  depositAmount: number;
  phone: string;
  email: string;
  stallSize?: string;
  zoneName?: string;
  startDate?: string;
  endDate?: string;
  proofImage?: string;
  status: ReservationStatus;
  rejectReason?: string;
  refundReason?: string;
  refundBankName?: string;
  refundAccountNumber?: string;
  refundAccountName?: string;
  refundSlip?: string;
  refundedAt?: string;
  rentalType?: 'daily' | 'monthly';
  dailyPrice?: number;
  monthlyPrice?: number;
  entryFee?: number;
  securityDeposit?: number;
  totalAmount?: number;
}

interface BookingApiItem {
  booking_id: number;
  user_id: number;
  stall_id: number;
  booking_date: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  reject_reason?: string | null;
  user_name: string | null;
  user_email: string | null;
  user_phone: string | null;
  stall_number: string | null;
  stall_size: string | null;
  stall_status: string | null;
  zone_name: string | null;
  payment_id: number | null;
  amount: number | null;
  payment_date: string | null;
  payment_slip: string | null;
  payment_status: string | null;
  refund_reason?: string | null;
  refund_bank_name?: string | null;
  refund_account_number?: string | null;
  refund_account_name?: string | null;
  refund_slip?: string | null;
  refunded_at?: string | null;
  rental_type?: 'daily' | 'monthly' | null;
  daily_price?: number | null;
  monthly_price?: number | null;
  entry_fee?: number | null;
  security_deposit?: number | null;
  total_amount?: number | null;
  stall_rental_type?: 'daily' | 'monthly' | null;
  stall_daily_price?: number | null;
  stall_monthly_price?: number | null;
  stall_entry_fee?: number | null;
  stall_security_deposit?: number | null;
}

const formatImageUrl = (path?: string | null) => {
  if (!path) return undefined;
  if (path.startsWith('http') || path.startsWith('data:')) {
    return path;
  }
  const cleanPath = path.replace(/^\/storage\//, '').replace(/^storage\//, '').replace(/^\/api\/images\//, '');
  return `/api/images/${cleanPath}`;
};

const toReservationStatus = (value?: string | null): ReservationStatus => {
  if (value === 'approved') return 'approved';
  if (value === 'cancelled' || value === 'rejected') return 'rejected';
  if (value === 'refund_requested') return 'refund_requested';
  if (value === 'refunded') return 'refunded';
  return 'pending';
};

const formatBookingDate = (value?: string | null) => {
  if (!value) return '-';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getInitials = (name?: string | null) => {
  if (!name) return '?';

  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]).join('').toUpperCase();
};

const mapBookingApiItem = (item: BookingApiItem): ReservationItem => {
  const effectiveStatus =
    item.payment_status === 'refund_requested' || item.payment_status === 'refunded'
      ? item.payment_status
      : item.status;

  const mappedRentalType = (item.rental_type || item.stall_rental_type || 'daily') as 'daily' | 'monthly';

  return {
    id: item.booking_id,
    bookingId: String(item.booking_id).padStart(6, '0'),
    tenantName: item.user_name || 'ไม่ระบุ',
    tenantAvatar: getInitials(item.user_name),
    stallNumber: item.stall_number || '-',
    bookingDate: formatBookingDate(item.booking_date || item.start_date),
    bookingDateValue: item.booking_date || item.start_date || '',
    depositAmount: item.amount || 0,
    phone: item.user_phone || '-',
    email: item.user_email || '-',
    stallSize: item.stall_size || undefined,
    zoneName: item.zone_name || undefined,
    startDate: item.start_date || undefined,
    endDate: item.end_date || undefined,
    proofImage: formatImageUrl(item.payment_slip),
    status: toReservationStatus(effectiveStatus),
    rejectReason: item.reject_reason || undefined,
    refundReason: item.refund_reason || undefined,
    refundBankName: item.refund_bank_name || undefined,
    refundAccountNumber: item.refund_account_number || undefined,
    refundAccountName: item.refund_account_name || undefined,
    refundSlip: formatImageUrl(item.refund_slip),
    refundedAt: item.refunded_at ? formatBookingDate(item.refunded_at) : undefined,
    rentalType: mappedRentalType,
    dailyPrice: Number(item.daily_price ?? item.stall_daily_price ?? 0),
    monthlyPrice: Number(item.monthly_price ?? item.stall_monthly_price ?? 0),
    entryFee: Number(item.entry_fee ?? item.stall_entry_fee ?? 0),
    securityDeposit: Number(item.security_deposit ?? item.stall_security_deposit ?? 0),
    totalAmount: Number(item.total_amount ?? item.amount ?? 0),
  };
};

const statusOptions: Array<{ label: string; value: ReservationStatus | 'all' }> = [
  { label: 'ทั้งหมด', value: 'all' },
  { label: 'รออนุมัติ', value: 'pending' },
  { label: 'อนุมัติแล้ว', value: 'approved' },
  { label: 'ยกเลิก', value: 'rejected' },
  { label: 'ขอคืนเงิน', value: 'refund_requested' },
  { label: 'คืนเงินแล้ว', value: 'refunded' },
];

const statusStyles: Record<ReservationStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  refund_requested: 'bg-purple-50 text-purple-700 border-purple-200',
  refunded: 'bg-sky-50 text-sky-700 border-sky-200',
};

const statusLabel: Record<ReservationStatus, string> = {
  pending: 'รออนุมัติ',
  approved: 'อนุมัติแล้ว',
  rejected: 'ยกเลิก',
  refund_requested: 'ขอคืนเงิน',
  refunded: 'คืนเงินแล้ว',
};

const PageHeader: React.FC<{ title: string; description?: string }> = ({ title, description }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
    {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
  </div>
);

const SimplePageCard: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
    <p className="mt-2 text-sm text-slate-600">{description}</p>
  </div>
);

const formatAnnouncementDate = (value?: string | null) => {
  if (!value) return '—';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const ReservationListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryBookingId = searchParams.get('booking_id');

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<ReservationItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshTrigger((prev) => prev + 1);
    }, 30_000); // Poll every 30 seconds
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
    let isCancelled = false;

    const params = new URLSearchParams();
    if (debouncedSearch) {
      params.set('search', debouncedSearch);
    }
    if (startDate) {
      params.set('start_date', startDate);
    }
    if (endDate) {
      params.set('end_date', endDate);
    }

    setLoading(true);
    setError(null);

    fetch(`/api/v1/bookings${params.toString() ? `?${params.toString()}` : ''}`, {
      headers: {
        Accept: 'application/json',
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('ไม่สามารถโหลดรายการจองได้');
        }

        const payload = await response.json();
        if (isCancelled) return;

        const items = Array.isArray(payload?.data) ? payload.data : [];
        const mapped = items.map(mapBookingApiItem);
        setReservations(mapped);

        if (queryBookingId) {
          const match = mapped.find((item: ReservationItem) => String(item.id) === String(queryBookingId));
          if (match) {
            setSelectedReservation(match);
            
            // Clean up query param
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('booking_id');
            setSearchParams(newParams, { replace: true });
          }
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setReservations([]);
          setError('ไม่สามารถโหลดรายการจองได้ในขณะนี้');
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [debouncedSearch, startDate, endDate, queryBookingId, searchParams, setSearchParams, refreshTrigger]);

  const filteredReservations = useMemo(() => {
    let list = [...reservations];

    if (statusFilter !== 'all') {
      list = list.filter((item) => item.status === statusFilter);
    }

    const priorityMap: Record<ReservationStatus, number> = {
      pending: 1,
      refund_requested: 2,
      approved: 3,
      refunded: 4,
      rejected: 5,
    };

    list.sort((a, b) => {
      const pA = priorityMap[a.status] ?? 99;
      const pB = priorityMap[b.status] ?? 99;

      if (pA !== pB) {
        return pA - pB;
      }

      const dateA = a.bookingDateValue ? new Date(a.bookingDateValue).getTime() : 0;
      const dateB = b.bookingDateValue ? new Date(b.bookingDateValue).getTime() : 0;
      return dateB - dateA;
    });

    return list;
  }, [reservations, statusFilter]);

  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
  const activePage = Math.min(currentPage, Math.max(totalPages, 1));
  const currentReservations = useMemo(() => {
    const startIndex = (activePage - 1) * itemsPerPage;
    return filteredReservations.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredReservations, activePage, itemsPerPage]);

  const handleStatusChange = async (bookingId: number, status: ReservationStatus) => {
    let endpoint = 'reject';

    if (status === 'approved') {
      endpoint = 'approve';
    } else if (status === 'pending') {
      endpoint = 'pending';
    }

    try {
      const response = await fetch(`/api/v1/bookings/${bookingId}/${endpoint}`, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('อัปเดตสถานะไม่สำเร็จ');
      }

      setReservations((current) => current.map((item) => (item.id === bookingId ? { ...item, status } : item)));
      setSelectedReservation((current) => (current && current.id === bookingId ? { ...current, status } : current));
      setError(null);
      window.dispatchEvent(new Event('refresh-badges'));
    } catch {
      setError('อัปเดตสถานะไม่สำเร็จ กรุณาลองใหม่');
    }
  };

  const summaryStats = useMemo(() => {
    const total = reservations.length;
    const pending = reservations.filter((item) => item.status === 'pending').length;
    const approved = reservations.filter((item) => item.status === 'approved').length;
    const refundRequested = reservations.filter((item) => item.status === 'refund_requested').length;
    return { total, pending, approved, refundRequested };
  }, [reservations]);

  return (
    <div className="space-y-6">
      {/* ── Sleek Compact Header ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="h-7 w-7 text-blue-600" />
            <span>รายการจองแผงค้า</span>
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            ตรวจสอบรายละเอียดคำขอจอง อนุมัติสัญญาเช่า และอนุมัติหลักฐานการชำระเงิน
          </p>
        </div>
      </div>

      {/* ── Summary KPI Overview Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* All */}
        <div
          onClick={() => setStatusFilter('all')}
          className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 hover:shadow-md ${
            statusFilter === 'all'
              ? 'border-sky-400 bg-sky-50/90 ring-2 ring-sky-300'
              : 'border-sky-200/80 bg-sky-50/50 hover:border-sky-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">ทั้งหมด</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100/80 text-sky-600">
              <Inbox className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{summaryStats.total}</p>
        </div>

        {/* Pending */}
        <div
          onClick={() => setStatusFilter('pending')}
          className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 hover:shadow-md ${
            statusFilter === 'pending'
              ? 'border-amber-400 bg-amber-50/90 ring-2 ring-amber-300'
              : 'border-amber-200/80 bg-amber-50/50 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800">รออนุมัติ</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100/80 text-amber-700">
              <CalendarDays className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-700">{summaryStats.pending}</p>
        </div>

        {/* Approved */}
        <div
          onClick={() => setStatusFilter('approved')}
          className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 hover:shadow-md ${
            statusFilter === 'approved'
              ? 'border-emerald-400 bg-emerald-50/90 ring-2 ring-emerald-300'
              : 'border-emerald-200/80 bg-emerald-50/50 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">อนุมัติแล้ว</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-700">{summaryStats.approved}</p>
        </div>

        {/* Refund Requested */}
        <div
          onClick={() => setStatusFilter('refund_requested')}
          className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 hover:shadow-md ${
            statusFilter === 'refund_requested'
              ? 'border-purple-400 bg-purple-50/90 ring-2 ring-purple-300'
              : 'border-purple-200/80 bg-purple-50/50 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-800">ขอคืนเงิน</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100/80 text-purple-700">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-purple-700">{summaryStats.refundRequested}</p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
            <Search className="h-4 w-4" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ค้นหาชื่อผู้จอง, เบอร์โทร หรือเลขแผงค้า..."
              className="w-full border-none bg-transparent outline-none placeholder:text-slate-400 font-medium"
            />
          </label>

          <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-slate-500" />
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm outline-none font-medium"
              />
            </div>
            <span className="text-slate-400 font-bold">ถึง</span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm outline-none font-medium"
            />
          </div>

          <label className="relative flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ReservationStatus | 'all')}
              className="appearance-none bg-transparent pr-6 outline-none font-bold"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" />
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
        {error ? (
          <div className="border-b border-rose-200 bg-rose-50 px-5 py-3.5 text-xs font-bold text-rose-700">{error}</div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="min-w-[850px] w-full text-left border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200/70 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">ผู้เช่า / ติดต่อ</th>
                <th className="px-6 py-4">โซน / เลขแผง</th>
                <th className="px-6 py-4">วันที่ทำรายการ</th>
                <th className="px-6 py-4">ยอดเงินมัดจำ</th>
                <th className="px-6 py-4">สถานะ</th>
                <th className="px-6 py-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs font-semibold text-slate-400">
                    กำลังโหลดข้อมูลรายการจอง...
                  </td>
                </tr>
              ) : currentReservations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs font-semibold text-slate-400">
                    ไม่พบรายการจองตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                currentReservations.map((item) => (
                  <tr key={item.id} className="group transition-colors hover:bg-blue-50/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 font-extrabold text-sm text-white shadow-xs">
                          {item.tenantAvatar}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{item.tenantName}</p>
                          <p className="text-xs text-slate-400">{item.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-800 border border-slate-200/60">
                        <span className="text-slate-400">{item.zoneName || 'ทั่วไป'}</span>
                        <span className="text-blue-600 font-black">{item.stallNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600">{item.bookingDate}</td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-900 text-sm">
                      ฿{item.depositAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${statusStyles[item.status]}`}>
                        {statusLabel[item.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <ActionButton
                          type="view"
                          onClick={() => setSelectedReservation(item)}
                          title="ดูรายละเอียด"
                        />
                        {item.status === 'refund_requested' || item.status === 'refunded' ? (
                          <button
                            onClick={() => navigate(`/payments?status=${item.status}`)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-700 hover:bg-purple-600 hover:text-white transition shadow-xs active:scale-95 cursor-pointer"
                            title="ไปยังหน้าโอนเงินคืนออนไลน์ (Payments)"
                          >
                            <Receipt className="h-4 w-4" />
                          </button>
                        ) : item.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => void handleStatusChange(item.id, 'approved')}
                              className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition shadow-xs active:scale-95 cursor-pointer"
                              aria-label="อนุมัติ"
                              title="อนุมัติคำขอ"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => void handleStatusChange(item.id, 'rejected')}
                              className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition shadow-xs active:scale-95 cursor-pointer"
                              aria-label="ไม่อนุมัติ"
                              title="ไม่อนุมัติคำขอ"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredReservations.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-4 text-xs font-medium text-slate-500 gap-3">
            <span>
              แสดงสูงสุด {itemsPerPage} คนต่อหน้า (หน้า {activePage} จากทั้งหมด {totalPages} หน้า - ทั้งหมด {filteredReservations.length} รายการ)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}
                disabled={activePage === 1}
                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100 transition disabled:opacity-40 shadow-2xs"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`h-8 w-8 rounded-xl text-xs font-bold transition shadow-2xs ${
                    activePage === page
                      ? 'bg-blue-600 text-white font-black'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((current) => Math.min(totalPages, current + 1))}
                disabled={activePage === totalPages}
                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100 transition disabled:opacity-40 shadow-2xs"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── Details Modal Popup ── */}
      {selectedReservation &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl space-y-0 animate-in zoom-in-95 duration-200 custom-scrollbar">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-6 py-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">รายละเอียดการจองแผงค้า</h3>
                    <p className="text-xs text-slate-400">ตรวจสอบรายละเอียดสัญญาและหลักฐานการชำระเงิน</p>
                  </div>
                </div>
                <button onClick={() => setSelectedReservation(null)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition">
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="grid gap-6 p-6 lg:grid-cols-2">
                {/* Left Column: Tenant & Rental Contract Info */}
                <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white p-3.5 shadow-2xs border border-slate-200/60">
                      <p className="text-xs font-bold text-slate-400">ชื่อผู้จอง</p>
                      <p className="mt-1 text-sm font-extrabold text-slate-900">{selectedReservation.tenantName}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-3.5 shadow-2xs border border-slate-200/60">
                      <p className="text-xs font-bold text-slate-400">เบอร์โทรศัพท์</p>
                      <p className="mt-1 text-sm font-bold text-slate-900">{selectedReservation.phone}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-3.5 shadow-2xs border border-slate-200/60 col-span-2">
                      <p className="text-xs font-bold text-slate-400">อีเมล</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800 break-all">{selectedReservation.email}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-3.5 shadow-2xs border border-slate-200/60">
                      <p className="text-xs font-bold text-slate-400">โซน / เลขแผงค้า</p>
                      <p className="mt-1 text-sm font-black text-blue-600">
                        {selectedReservation.zoneName || 'ทั่วไป'} - {selectedReservation.stallNumber}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white p-3.5 shadow-2xs border border-slate-200/60">
                      <p className="text-xs font-bold text-slate-400">ขนาดแผงค้า</p>
                      <p className="mt-1 text-sm font-bold text-slate-800">{selectedReservation.stallSize || 'ไม่ได้ระบุ'}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-3.5 shadow-2xs border border-slate-200/60 col-span-2">
                      <p className="text-xs font-bold text-slate-400">รูปแบบการเช่า</p>
                      <p className="mt-1 text-sm font-extrabold text-indigo-700">
                        {selectedReservation.rentalType === 'monthly' ? '📆 เช่ารายเดือน (Monthly)' : '📅 เช่ารายวัน (Daily)'}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white p-3.5 shadow-2xs border border-slate-200/60 col-span-2">
                      <p className="text-xs font-bold text-slate-400">ระยะเวลาเช่าแผง</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {selectedReservation.startDate && selectedReservation.endDate
                          ? `${formatBookingDate(selectedReservation.startDate)} ถึง ${formatBookingDate(selectedReservation.endDate)}`
                          : '-'}
                      </p>
                    </div>
                  </div>

                  {/* ── Itemized Fee Breakdown Card ── */}
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-indigo-100/80 pb-2">
                      <span className="text-xs font-black uppercase text-indigo-900 tracking-wider">
                        รายละเอียดค่าบริการ & ยอดรวม
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-0.5 text-xs font-bold ${statusStyles[selectedReservation.status]}`}>
                        {statusLabel[selectedReservation.status]}
                      </span>
                    </div>

                    {selectedReservation.rentalType === 'monthly' ? (
                      <div className="space-y-1.5 text-xs font-bold text-slate-700">
                        <div className="flex justify-between">
                          <span className="text-slate-500">ค่าเช่ารายเดือน:</span>
                          <span className="font-mono text-slate-900">฿{(selectedReservation.monthlyPrice || 0).toLocaleString()} / เดือน</span>
                        </div>
                        {(selectedReservation.entryFee ?? 0) > 0 && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">ค่าธรรมเนียมแรกเข้า:</span>
                            <span className="font-mono text-slate-900">฿{(selectedReservation.entryFee || 0).toLocaleString()}</span>
                          </div>
                        )}
                        {(selectedReservation.securityDeposit ?? 0) > 0 && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">เงินประกันแผงค้า:</span>
                            <span className="font-mono text-slate-900">฿{(selectedReservation.securityDeposit || 0).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1.5 text-xs font-bold text-slate-700">
                        <div className="flex justify-between">
                          <span className="text-slate-500">ค่าเช่ารายวัน:</span>
                          <span className="font-mono text-slate-900">฿{(selectedReservation.dailyPrice || selectedReservation.depositAmount || 0).toLocaleString()} / วัน</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-indigo-200/80">
                      <span className="text-xs font-black text-indigo-950 uppercase tracking-wider">ยอดเงินรวมสุทธิ</span>
                      <span className="text-2xl font-black text-emerald-600 font-mono">
                        ฿{(selectedReservation.totalAmount || selectedReservation.depositAmount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {selectedReservation.rejectReason && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4">
                      <p className="text-xs font-bold text-rose-800">เหตุผลที่ไม่อนุมัติ / ยกเลิก</p>
                      <p className="mt-1 text-xs font-semibold text-rose-700">{selectedReservation.rejectReason}</p>
                    </div>
                  )}

                  {selectedReservation.refundReason && (
                    <div className="rounded-2xl border border-purple-200 bg-purple-50/80 p-4 space-y-1.5 text-xs text-purple-900">
                      <p className="font-extrabold text-purple-900">ข้อมูลการขอคืนเงิน (Refund Details)</p>
                      <p><span className="font-bold text-purple-700">เหตุผล:</span> {selectedReservation.refundReason}</p>
                      <p><span className="font-bold text-purple-700">ธนาคาร:</span> {selectedReservation.refundBankName || '-'} ({selectedReservation.refundAccountNumber || '-'})</p>
                      <p><span className="font-bold text-purple-700">ชื่อบัญชี:</span> {selectedReservation.refundAccountName || '-'}</p>
                    </div>
                  )}
                </div>

                {/* Right Column: Slip & Action Buttons */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                        <Receipt className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">หลักฐานการโอนเงิน (สลิป)</h4>
                        <p className="text-xs text-slate-400">รูปภาพสลิปที่ผู้จองแนบเข้ามาในระบบ</p>
                      </div>
                    </div>

                    {selectedReservation.proofImage ? (
                      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 flex justify-center p-2">
                        <img
                          src={selectedReservation.proofImage}
                          alt="หลักฐานการโอน"
                          className="max-h-[280px] rounded-xl object-contain shadow-xs"
                        />
                      </div>
                    ) : (
                      <div className="flex h-56 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400">
                        ไม่มีหลักฐานการโอน
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
                    {selectedReservation.status === 'refund_requested' || selectedReservation.status === 'refunded' ? (
                      <button
                        onClick={() => {
                          const targetStatus = selectedReservation.status;
                          setSelectedReservation(null);
                          navigate(`/payments?status=${targetStatus}`);
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 px-5 py-3 text-xs font-extrabold text-white shadow-md hover:from-purple-800 hover:to-indigo-800 transition active:scale-98 cursor-pointer"
                      >
                        <Receipt className="h-4.5 w-4.5" />
                        ไปที่หน้าโอนเงินคืนออนไลน์ (Online Refund Portal)
                      </button>
                    ) : selectedReservation.status === 'pending' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedReservation(null)}
                          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                        >
                          ยกเลิก
                        </button>
                        <button
                          onClick={() => {
                            handleStatusChange(selectedReservation.id, 'rejected');
                            setSelectedReservation(null);
                          }}
                          className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition cursor-pointer"
                        >
                          ไม่อนุมัติ
                        </button>
                        <button
                          onClick={() => {
                            handleStatusChange(selectedReservation.id, 'approved');
                            setSelectedReservation(null);
                          }}
                          className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
                        >
                          อนุมัติการจอง
                        </button>
                      </div>
                    ) : (
                      /* Approved / Rejected / Read-Only View */
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => setSelectedReservation(null)}
                          className="rounded-xl border border-slate-200 bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer shadow-sm"
                        >
                          ปิดหน้าต่าง (Close)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export const StoreManagementPage: React.FC = () => {
  const [shops, setShops] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [currentShop, setCurrentShop] = useState<any | null>(null);

  // Form states
  const [shopName, setShopName] = useState('');
  const [description, setDescription] = useState('');
  const [userId, setUserId] = useState('');
  const [categoryId, setCategoryId] = useState('1');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const categories = [
    { id: '1', name: 'อาหารและเครื่องดื่ม (Food)' },
    { id: '2', name: 'เสื้อผ้าและแฟชั่น (Fashion)' },
    { id: '3', name: 'ไอทีและอิเล็กทรอนิกส์ (IT/Electronics)' },
    { id: '4', name: 'บริการและเบ็ดเตล็ด (Service)' },
    { id: '5', name: 'อื่นๆ (Others)' }
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [shopsRes, usersRes] = await Promise.all([
        fetch('/api/v1/shops'),
        fetch('/api/v1/users')
      ]);

      if (!shopsRes.ok || !usersRes.ok) {
        throw new Error('ไม่สามารถเรียกดูข้อมูลร้านค้าหรือผู้ใช้จากเซิร์ฟเวอร์ได้');
      }

      const shopsPayload = await shopsRes.json();
      const usersPayload = await usersRes.json();

      setShops(Array.isArray(shopsPayload?.data) ? shopsPayload.data : []);
      setUsers(Array.isArray(usersPayload?.data) ? usersPayload.data : []);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(typeof reader.result === 'string' ? reader.result : null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim() || !userId || !categoryId) {
      alert('กรุณากรอกชื่อร้านค้าและเจ้าของร้าน');
      return;
    }

    try {
      setIsSaving(true);
      const formData = new FormData();
      formData.append('shop_name', shopName);
      formData.append('description', description);
      formData.append('user_id', userId);
      formData.append('category_id', categoryId);
      if (selectedFile) {
        formData.append('shop_image', selectedFile);
      }

      const response = await fetch('/api/v1/shops', {
        method: 'POST',
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'ไม่สามารถบันทึกข้อมูลได้');
      }

      setShowCreateModal(false);
      resetForm();
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShop || !shopName.trim() || !userId || !categoryId) return;

    try {
      setIsSaving(true);
      const formData = new FormData();
      formData.append('shop_name', shopName);
      formData.append('description', description);
      formData.append('user_id', userId);
      formData.append('category_id', categoryId);
      formData.append('_method', 'PUT'); // Laravel form method spoofing for multipart PUT
      if (selectedFile) {
        formData.append('shop_image', selectedFile);
      }

      const response = await fetch(`/api/v1/shops/${currentShop.shop_id}`, {
        method: 'POST', // Send as POST for multipart handling in PHP
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'ไม่สามารถแก้ไขข้อมูลได้');
      }

      setShowUpdateModal(false);
      resetForm();
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('ต้องการลบร้านค้านี้จริงหรือไม่? รูปภาพที่เกี่ยวข้องจะถูกลบออกถาวร')) return;

    try {
      const response = await fetch(`/api/v1/shops/${id}`, {
        method: 'DELETE',
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'ลบข้อมูลร้านไม่สำเร็จ');
      }
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const resetForm = () => {
    setShopName('');
    setDescription('');
    setUserId('');
    setCategoryId('1');
    setSelectedFile(null);
    setImagePreview(null);
    setCurrentShop(null);
  };

  const openUpdateModal = (shop: any) => {
    setCurrentShop(shop);
    setShopName(shop.shop_name);
    setDescription(shop.description || '');
    setUserId(String(shop.user_id));
    setCategoryId(String(shop.category_id));
    setImagePreview(shop.shop_image ? getImageUrl(shop.shop_image) : null);
    setShowUpdateModal(true);
  };

  const getImageUrl = (path: string | null) => {
    if (!path) return '';
    if (path.startsWith('/assets/')) {
      return '/src' + path;
    }
    return `/api/images/${path}`;
  };

  const filteredShops = shops.filter((shop) =>
    shop.shop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (shop.owner?.username || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">การจัดการร้านค้า (Shops)</h1>
          <p className="text-sm text-slate-500">จัดการข้อมูลแผงร้านค้าและอัปโหลดภาพประกอบ</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            if (users.length > 0) setUserId(String(users[0].user_id));
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          เพิ่มร้านค้าใหม่
        </button>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 max-w-md">
            <Search className="h-4 w-4" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาตามชื่อร้านหรือชื่อผู้เช่า..."
              className="w-full border-none bg-transparent outline-none placeholder:text-slate-400"
            />
          </label>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">ร้านค้า</th>
                <th className="px-6 py-4 text-left font-semibold">รายละเอียด</th>
                <th className="px-6 py-4 text-left font-semibold">หมวดหมู่</th>
                <th className="px-6 py-4 text-left font-semibold">ผู้ดูแลร้าน (Owner)</th>
                <th className="px-6 py-4 text-center font-semibold">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    กำลังโหลดข้อมูลร้านค้า...
                  </td>
                </tr>
              ) : filteredShops.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    ไม่พบข้อมูลร้านค้าในระบบ
                  </td>
                </tr>
              ) : (
                filteredShops.map((shop) => (
                  <tr key={shop.shop_id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {shop.shop_image ? (
                          <img
                            src={getImageUrl(shop.shop_image)}
                            alt={shop.shop_name}
                            className="h-12 w-16 rounded-xl object-cover border border-slate-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=150&q=80';
                            }}
                          />
                        ) : (
                          <div className="flex h-12 w-16 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                            <ImageOff className="h-5 w-5" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-950">{shop.shop_name}</p>
                          <p className="text-xs text-slate-500">ID: {shop.shop_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-slate-600">
                      {shop.description || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                        {shop.category?.category_name || `หมวดหมู่ ID: ${shop.category_id}`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">
                          {shop.owner?.username || `User ID: ${shop.user_id}`}
                        </span>
                        {shop.owner?.email && (
                          <span className="text-xs text-slate-400">({shop.owner.email})</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <ActionButton
                          type="edit"
                          onClick={() => openUpdateModal(shop)}
                          title="แก้ไขข้อมูลร้าน"
                        />
                        <ActionButton
                          type="delete"
                          onClick={() => handleDelete(shop.shop_id)}
                          title="ลบร้านค้า"
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-blue-600 px-6 py-4 text-white">
              <h3 className="text-lg font-bold">เพิ่มร้านค้าใหม่</h3>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">ชื่อร้านค้า *</label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="กรอกชื่อร้านค้า"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">หมวดหมู่ร้าน *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white transition"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">ผู้เช่า / เจ้าของ *</label>
                  <select
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white transition"
                  >
                    {users.map((u) => (
                      <option key={u.user_id} value={u.user_id}>{u.username} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">รายละเอียดร้านค้า</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="กรอกรายละเอียดแผงค้าและสินค้า..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">อัปโหลดภาพหน้าร้าน</label>
                <div className="flex items-center gap-4">
                  <label className="flex h-24 w-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-center hover:bg-slate-100 transition">
                    <Camera className="h-6 w-6 text-slate-400" />
                    <span className="text-xs text-slate-500 mt-1">เลือกรูปภาพ</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                  {imagePreview && (
                    <div className="relative h-24 w-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                      <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setImagePreview(null);
                        }}
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 transition"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE MODAL */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-blue-600 px-6 py-4 text-white">
              <h3 className="text-lg font-bold">แก้ไขข้อมูลร้านค้า</h3>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">ชื่อร้านค้า *</label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="กรอกชื่อร้านค้า"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">หมวดหมู่ร้าน *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white transition"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">ผู้เช่า / เจ้าของ *</label>
                  <select
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white transition"
                  >
                    {users.map((u) => (
                      <option key={u.user_id} value={u.user_id}>{u.username} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">รายละเอียดร้านค้า</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="กรอกรายละเอียดแผงค้าและสินค้า..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">เปลี่ยนภาพหน้าร้าน</label>
                <div className="flex items-center gap-4">
                  <label className="flex h-24 w-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-center hover:bg-slate-100 transition">
                    <Camera className="h-6 w-6 text-slate-400" />
                    <span className="text-xs text-slate-500 mt-1">เลือกรูปภาพ</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                  {imagePreview && (
                    <div className="relative h-24 w-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                      <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setImagePreview(null);
                        }}
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 transition"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const SellerManagementPage: React.FC = () => (
  <div className="space-y-6">
    <PageHeader title="Seller Management" description="Track seller accounts and assigned spaces." />
    <SimplePageCard title="Seller overview" description="Seller management content will appear here." />
  </div>
);

export const VerificationRequestsPage: React.FC = () => <ReservationListPage />;

export const PaymentManagementPage: React.FC = () => (
  <div className="space-y-6">
    <PageHeader title="Payment Management" description="Review payment and settlement activity." />
    <SimplePageCard title="Payment overview" description="Payment management content will appear here." />
  </div>
);

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<IssueReport[]>([]);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'electric' | 'water' | 'structure' | 'clean' | 'feedback' | 'other'>('all');
  const [activeStatus, setActiveStatus] = useState<'all' | 'pending' | 'progress' | 'resolved'>('all');
  const [selectedReport, setSelectedReport] = useState<IssueReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const categoryOptions = [
    { label: 'ทั้งหมด', value: 'all' },
    { label: 'ไฟฟ้า', value: 'electric' },
    { label: 'ประปา', value: 'water' },
    { label: 'โครงสร้าง', value: 'structure' },
    { label: 'ความสะอาด', value: 'clean' },
    { label: 'รายงานความคิดเห็น', value: 'feedback' },
    { label: 'อื่นๆ', value: 'other' },
  ] as const;

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (activeCategory !== 'all') params.set('type', activeCategory);

      const response = await fetch(`/api/v1/admin/problem-reports${params.toString() ? `?${params.toString()}` : ''}`);
      if (!response.ok) {
        throw new Error('ไม่สามารถโหลดรายการแจ้งปัญหาได้');
      }

      const payload = await response.json();
      const items = Array.isArray(payload?.data) ? payload.data : [];
      setReports(
        items.map((item: any) => ({
          id: String(item.problem_id),
          type: item.report_type || 'other',
          zone: item.stall_number || '-',
          description: item.description || '-',
          date: item.report_date ? new Date(item.report_date).toLocaleDateString('th-TH') : '-',
          time: item.report_date ? new Date(item.report_date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-',
          rawDate: item.report_date || null,
          status: item.status || 'pending',
          image: formatImageUrl(item.image),
          priority: 'medium',
          reporter: item.user_name || 'ไม่ระบุ',
          adminNote: item.admin_note || '',
        }))
      );
    } catch {
      setReports([]);
      setError('ไม่สามารถโหลดรายการแจ้งปัญหาได้ในขณะนี้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReports();

    const interval = setInterval(() => {
      void loadReports();
    }, 30_000); // Auto refresh every 30 seconds

    return () => clearInterval(interval);
  }, [search, activeCategory]);

  useEffect(() => {
    if (selectedReport) {
      setAdminNote(selectedReport.adminNote || '');
    }
  }, [selectedReport]);

  const filteredReports = useMemo(() => {
    let filtered = [...reports];
    if (activeStatus !== 'all') {
      filtered = filtered.filter((item) => item.status === activeStatus);
    }
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter((item) => {
        const itemDate = item.rawDate ? new Date(item.rawDate) : null;
        return itemDate ? itemDate >= start : false;
      });
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter((item) => {
        const itemDate = item.rawDate ? new Date(item.rawDate) : null;
        return itemDate ? itemDate <= end : false;
      });
    }
    filtered.sort((a: any, b: any) => {
      const timeA = a.rawDate ? new Date(a.rawDate).getTime() : 0;
      const timeB = b.rawDate ? new Date(b.rawDate).getTime() : 0;
      return timeB - timeA;
    });
    return filtered;
  }, [reports, startDate, endDate, activeStatus]);

  const summary = useMemo(() => {
    const total = reports.length;
    const pending = reports.filter((item) => item.status === 'pending').length;
    const progress = reports.filter((item) => item.status === 'progress').length;
    const resolved = reports.filter((item) => item.status === 'resolved').length;
    return { total, pending, progress, resolved };
  }, [reports]);

  const getTypeMeta = (type: IssueReport['type']) => {
    switch (type) {
      case 'electric':
        return { label: 'ไฟฟ้า', className: 'bg-orange-50 text-orange-700 border-orange-200' };
      case 'water':
        return { label: 'ประปา', className: 'bg-sky-50 text-sky-700 border-sky-200' };
      case 'structure':
        return { label: 'โครงสร้าง', className: 'bg-violet-50 text-violet-700 border-violet-200' };
      case 'clean':
        return { label: 'ความสะอาด', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'feedback':
        return { label: 'รายงานความคิดเห็น', className: 'bg-amber-50 text-amber-700 border-amber-200' };
      default:
        return { label: 'อื่นๆ', className: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const getStatusMeta = (status: IssueReport['status']) => {
    switch (status) {
      case 'pending':
        return { label: 'รอดำเนินการ', className: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'progress':
        return { label: 'กำลังแก้ไข', className: 'bg-sky-50 text-sky-700 border-sky-200' };
      case 'resolved':
        return { label: 'แก้ไขเสร็จสิ้น', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default:
        return { label: status, className: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const updateStatus = async (id: string, status: IssueReport['status']) => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/v1/admin/problem-reports/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ status, admin_note: adminNote }),
      });

      if (!response.ok) {
        throw new Error('อัปเดตสถานะไม่สำเร็จ');
      }

      setReports((current) => current.map((item) => (item.id === id ? { ...item, status, adminNote } : item)));
      setSelectedReport((current) => (current && current.id === id ? { ...current, status, adminNote } : current));
      setError(null);
      window.dispatchEvent(new Event('refresh-badges'));
    } catch {
      setError('อัปเดตสถานะไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">รายการแจ้งปัญหา / ซ่อมบำรุง</h1>
        <p className="mt-1 text-sm text-slate-600">จัดการและติดตามสถานะการแจ้งซ่อมบำรุงภายในตลาด</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div 
          onClick={() => setActiveStatus('all')}
          className={`rounded-2xl border p-4 shadow-sm cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] ${
            activeStatus === 'all' ? 'border-sky-500 bg-sky-50/30 ring-2 ring-sky-500/20' : 'border-slate-200 bg-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-semibold">ทั้งหมด</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{summary.total}</p>
            </div>
            <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
              <Inbox className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div 
          onClick={() => setActiveStatus('pending')}
          className={`rounded-2xl border p-4 shadow-sm cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] ${
            activeStatus === 'pending' ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20 shadow-amber-100/10' : 'border-amber-200 bg-amber-50/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-700 font-semibold">รอดำเนินการ</p>
              <p className="mt-2 text-2xl font-bold text-amber-700">{summary.pending}</p>
            </div>
            <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
              <CalendarDays className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div 
          onClick={() => setActiveStatus('progress')}
          className={`rounded-2xl border p-4 shadow-sm cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] ${
            activeStatus === 'progress' ? 'border-sky-500 bg-sky-50/60 ring-2 ring-sky-500/20 shadow-sky-100/10' : 'border-sky-200 bg-sky-50/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-sky-700 font-semibold">กำลังแก้ไข</p>
              <p className="mt-2 text-2xl font-bold text-sky-700">{summary.progress}</p>
            </div>
            <div className="rounded-xl bg-sky-100 p-3 text-sky-700">
              <Wrench className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div 
          onClick={() => setActiveStatus('resolved')}
          className={`rounded-2xl border p-4 shadow-sm cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] ${
            activeStatus === 'resolved' ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-emerald-100/10' : 'border-emerald-200 bg-emerald-50/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-700 font-semibold">แก้ไขเสร็จสิ้น</p>
              <p className="mt-2 text-2xl font-bold text-emerald-700">{summary.resolved}</p>
            </div>
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((option) => {
              const isActive = activeCategory === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setActiveCategory(option.value)}
                  className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:items-center">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 w-full lg:w-auto">
              <CalendarDays className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border-none bg-transparent outline-none text-slate-700 w-full max-w-[130px] focus:ring-0 focus:outline-none"
              />
              <span className="text-slate-400 mx-1 text-xs shrink-0">ถึง</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border-none bg-transparent outline-none text-slate-700 w-full max-w-[130px] focus:ring-0 focus:outline-none"
              />
            </div>
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
              <Search className="h-4 w-4 shrink-0" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ค้นหาเลขที่แผง หรือรหัส..."
                className="w-full border-none bg-transparent outline-none placeholder:text-slate-400"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {error ? <div className="border-b border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">วันที่/เวลา</th>
                <th className="px-4 py-3 text-left font-semibold">ประเภท</th>
                <th className="px-4 py-3 text-left font-semibold">รายละเอียด</th>
                <th className="px-4 py-3 text-left font-semibold">สถานที่</th>
                <th className="px-4 py-3 text-left font-semibold">รูปภาพ</th>
                <th className="px-4 py-3 text-left font-semibold">สถานะ</th>
                <th className="px-4 py-3 text-left font-semibold">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                    กำลังโหลดรายการแจ้งปัญหา...
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                    ไม่พบรายการแจ้งปัญหาตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : filteredReports.map((report) => {
                const typeMeta = getTypeMeta(report.type);
                const statusMeta = getStatusMeta(report.status);
                return (
                  <tr key={report.id} className="border-t border-slate-200 bg-white">
                    <td className="px-4 py-3 text-slate-700">
                      <div className="font-medium">{report.date}</div>
                      <div className="text-slate-500">{report.time}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${typeMeta.className}`}>
                        {typeMeta.label}
                      </span>
                    </td>
                    <td className="max-w-[280px] px-4 py-3 text-slate-600">
                      <div className="line-clamp-2">{report.description}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                        {report.zone}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {report.image ? (
                        <img src={report.image} alt={report.zone} className="h-14 w-14 rounded-xl object-cover" />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                          <ImageOff className="h-5 w-5" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.className}`}>
                        {statusMeta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ActionButton
                        type="view"
                        onClick={() => setSelectedReport(report)}
                        title="ดูรายละเอียด"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-5xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between rounded-t-3xl bg-sky-700 px-6 py-4 text-white">
              <div>
                <h3 className="text-xl font-semibold">รายละเอียดการแจ้งซ่อม</h3>
                <p className="mt-1 text-sm text-sky-100">ตรวจสอบข้อมูลและอัปเดตสถานะคำร้อง</p>
              </div>
              <button onClick={() => setSelectedReport(null)} className="rounded-full p-2 transition hover:bg-sky-800">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <h4 className="mb-3 text-base font-semibold text-slate-900">รูปแนบจากการแจ้งเหตุ</h4>
                {selectedReport.image ? (
                  <img src={selectedReport.image} alt="ภาพแจ้งเหตุ" className="h-80 w-full rounded-2xl object-cover" />
                ) : (
                  <div className="flex h-80 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-slate-400">
                    ไม่มีรูปภาพที่แนบมา
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${getTypeMeta(selectedReport.type).className}`}>
                    {getTypeMeta(selectedReport.type).label}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                    {selectedReport.zone}
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Building2 className="h-4 w-4" />
                    <span>ผู้แจ้ง</span>
                  </div>
                  <p className="mt-2 font-semibold text-slate-900">{selectedReport.reporter || 'ไม่ระบุ'}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
                    <AlertTriangle className="h-4 w-4" />
                    <span>รายละเอียด</span>
                  </div>
                  <p className="text-sm leading-6 text-slate-700">{selectedReport.description}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
                    <CalendarDays className="h-4 w-4" />
                    <span>วันที่และเวลา</span>
                  </div>
                  <p className="text-sm text-slate-700">{selectedReport.date} {selectedReport.time}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <label className="mb-2 block text-sm font-medium text-slate-700">หมายเหตุแอดมิน</label>
                  <textarea
                    rows={4}
                    value={adminNote}
                    onChange={(event) => setAdminNote(event.target.value)}
                    placeholder="พิมพ์ข้อความเพิ่มเติมสำหรับลูกค้า/ช่างซ่อม..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                onClick={() => void updateStatus(selectedReport.id, 'progress')}
                disabled={updating}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Wrench className="h-4 w-4" />
                {updating ? 'กำลังอัปเดต...' : 'กำลังแก้ไข'}
              </button>
              <button
                onClick={() => void updateStatus(selectedReport.id, 'resolved')}
                disabled={updating}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCheck className="h-4 w-4" />
                {updating ? 'กำลังอัปเดต...' : 'แก้ไขเสร็จสิ้น'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const AnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'urgent' | 'event' | 'general'>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [editorSeed, setEditorSeed] = useState(0);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'general' as Announcement['category'],
    status: 'active' as Announcement['status'],
    image: '',
  });

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  const categoryOptions = [
    { label: 'ทั้งหมด', value: 'all' },
    { label: 'ประกาศด่วน', value: 'urgent' },
    { label: 'กิจกรรม', value: 'event' },
    { label: 'ทั่วไป', value: 'general' },
  ] as const;

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());

      const response = await fetch(`/api/v1/admin/announcements${params.toString() ? `?${params.toString()}` : ''}`);
      if (!response.ok) {
        throw new Error('ไม่สามารถโหลดประกาศได้');
      }

      const payload = await response.json();
      const items = Array.isArray(payload?.data) ? payload.data : [];
      setAnnouncements(
        items.map((item: any) => ({
          id: String(item.announcement_id),
          title: item.title || '',
          description: item.description || '',
          image: formatImageUrl(item.image) || '',
          date: formatAnnouncementDate(item.publish_date),
          rawDate: item.publish_date || null,
          status: item.status === 'active' ? 'active' : 'inactive',
          category: item.announcement_type === 'urgent' ? 'urgent' : item.announcement_type === 'activity' ? 'event' : 'general',
        }))
      );
    } catch {
      setAnnouncements([
        { id: 'mock-1', title: 'ประกาศหยุดจ่ายกระแสไฟฟ้า', description: 'การไฟฟ้าฯ จะงดจ่ายกระแสไฟฟ้าในวันที่ 15 กรกฎาคม ตั้งแต่เวลา 09.00-12.00 น. เพื่อซ่อมบำรุง', image: '', date: formatAnnouncementDate('2026-07-01T10:00:00Z'), rawDate: '2026-07-01T10:00:00Z', status: 'active', category: 'urgent' },
        { id: 'mock-2', title: 'กิจกรรมตรวจสุขภาพประจำปีผู้ค้า', description: 'ขอเชิญผู้ค้าทุกท่านเข้ารับการตรวจสุขภาพประจำปี ในวันที่ 20 กรกฎาคม ณ บริเวณลานกิจกรรม', image: '', date: formatAnnouncementDate('2026-06-25T14:30:00Z'), rawDate: '2026-06-25T14:30:00Z', status: 'active', category: 'event' },
        { id: 'mock-3', title: 'แจ้งปรับปรุงลานจอดรถโซน A', description: 'จะมีการเทคอนกรีตลานจอดรถโซน A เพิ่มเติม ขอความกรุณางดจอดรถในบริเวณดังกล่าวตั้งแต่วันที่ 1-5 สิงหาคม', image: '', date: formatAnnouncementDate('2026-06-20T09:15:00Z'), rawDate: '2026-06-20T09:15:00Z', status: 'active', category: 'general' },
      ]);
      setError('ไม่สามารถโหลดประกาศได้ในขณะนี้ ระบบกำลังแสดงข้อมูลตัวอย่าง');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAnnouncements();
  }, [search]);

  const filteredAnnouncements = useMemo(() => {
    let filtered = announcements.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchesSearch = [item.title, item.description, item.date]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter((item) => {
        const itemDate = item.rawDate ? new Date(item.rawDate) : null;
        return itemDate ? itemDate >= start : false;
      });
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter((item) => {
        const itemDate = item.rawDate ? new Date(item.rawDate) : null;
        return itemDate ? itemDate <= end : false;
      });
    }

    filtered.sort((a, b) => {
      const timeA = a.rawDate ? new Date(a.rawDate).getTime() : 0;
      const timeB = b.rawDate ? new Date(b.rawDate).getTime() : 0;
      return timeB - timeA;
    });

    return filtered;
  }, [activeCategory, announcements, search, startDate, endDate]);

  const getCategoryMeta = (category?: Announcement['category']) => {
    switch (category) {
      case 'urgent':
        return { label: 'ประกาศด่วน', className: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'event':
        return { label: 'กิจกรรม', className: 'bg-violet-50 text-violet-700 border-violet-200' };
      case 'general':
        return { label: 'ทั่วไป', className: 'bg-slate-100 text-slate-700 border-slate-200' };
      default:
        return { label: 'ทั่วไป', className: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.textContent = form.description || '';
    }
  }, [editorSeed]);

  const resetForm = () => {
    setForm({ title: '', description: '', category: 'general', status: 'active', image: '' });
    setSelectedImageFile(null);
  };

  const openCreateModal = () => {
    resetForm();
    setSelectedAnnouncement(null);
    setIsEditOpen(false);
    setIsPreviewOpen(false);
    setIsCreateOpen(true);
    setEditorSeed((value) => value + 1);
  };

  const openPreviewModal = (item: Announcement) => {
    setSelectedAnnouncement(item);
    setIsPreviewOpen(true);
    setIsEditOpen(false);
    setIsCreateOpen(false);
  };

  const openEditModal = (item: Announcement) => {
    setSelectedAnnouncement(item);
    setSelectedImageFile(null);
    setForm({
      title: item.title,
      description: item.description,
      category: item.category ?? 'general',
      status: item.status,
      image: item.image ?? '',
    });
    setIsEditOpen(true);
    setIsCreateOpen(false);
    setIsPreviewOpen(false);
    setEditorSeed((value) => value + 1);
  };

  const closeModal = () => {
    setIsCreateOpen(false);
    setIsPreviewOpen(false);
    setIsEditOpen(false);
    setSelectedAnnouncement(null);
    resetForm();
  };

  const handleCreateOrUpdate = async () => {
    if (!form.title.trim()) return;

    try {
      const formPayload = new FormData();
      formPayload.append('title', form.title);
      formPayload.append('description', form.description || '');
      const categoryVal = form.category === 'event' ? 'activity' : (form.category || 'general');
      formPayload.append('announcement_type', categoryVal);
      formPayload.append('status', form.status);
      formPayload.append('user_id', '1');

      if (selectedImageFile) {
        formPayload.append('image', selectedImageFile);
      } else if (form.image && !form.image.startsWith('blob:')) {
        formPayload.append('image', form.image || '');
      }

      const url = isEditOpen && selectedAnnouncement
        ? `/api/v1/admin/announcements/${selectedAnnouncement.id}`
        : '/api/v1/admin/announcements';

      const response = await fetch(url, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formPayload,
      });

      if (!response.ok) {
        throw new Error('ไม่สามารถบันทึกประกาศได้');
      }

      await loadAnnouncements();
      closeModal();
    } catch {
      setError('ไม่สามารถบันทึกประกาศได้ในขณะนี้');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/v1/admin/announcements/${id}/toggle-status`, {
        method: 'PATCH',
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error('ไม่สามารถเปลี่ยนสถานะได้');
      }

      await loadAnnouncements();
    } catch {
      setError('ไม่สามารถเปลี่ยนสถานะได้ในขณะนี้');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/v1/admin/announcements/${id}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error('ไม่สามารถลบประกาศได้');
      }

      await loadAnnouncements();
    } catch {
      setError('ไม่สามารถลบประกาศได้ในขณะนี้');
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setForm((current) => ({ ...current, image: previewUrl }));
    }
  };

  const applyTextFormat = (format: 'bold' | 'italic' | 'list' | 'link') => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    if (format === 'link') {
      const url = window.prompt('ใส่ URL', 'https://');
      if (!url) return;
      document.execCommand('createLink', false, url);
      const currentHtml = editorRef.current.innerHTML;
      setForm((current) => ({ ...current, description: currentHtml }));
      return;
    }

    const commandMap = {
      bold: 'bold',
      italic: 'italic',
      list: 'insertUnorderedList',
    } as const;

    document.execCommand(commandMap[format], false);
    const currentHtml = editorRef.current.innerHTML;
    setForm((current) => ({ ...current, description: currentHtml }));
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      const plainText = editorRef.current?.textContent || '';
      const sanitizedText = plainText.replace(/<[^>]*>/g, '').trim();
      setForm((current) => ({ ...current, description: sanitizedText }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">จัดการข่าวสารและประกาศ</h1>
          <p className="mt-1 text-sm text-slate-600">จัดการและเผยแพร่ประกาศให้ลูกค้าและผู้ขายรับทราบ</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
        >
          <Plus className="h-4 w-4" />
          สร้างประกาศใหม่
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="flex flex-1 lg:flex-none lg:w-80 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
            <Search className="h-4 w-4 shrink-0" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ค้นหาหัวข้อประกาศ..."
              className="w-full border-none bg-transparent outline-none placeholder:text-slate-400"
            />
          </label>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map((option) => {
                const isActive = activeCategory === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setActiveCategory(option.value)}
                    className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                      isActive ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 w-full sm:w-auto">
              <CalendarDays className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border-none bg-transparent outline-none text-slate-700 w-full max-w-[130px] focus:ring-0 focus:outline-none"
              />
              <span className="text-slate-400 mx-1 text-xs shrink-0">ถึง</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border-none bg-transparent outline-none text-slate-700 w-full max-w-[130px] focus:ring-0 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1000px] w-full text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">หัวข้อ</th>
                <th className="px-4 py-3 text-left font-semibold">รูปหน้าปก</th>
                <th className="px-4 py-3 text-left font-semibold">หมวดหมู่</th>
                <th className="px-4 py-3 text-left font-semibold">วันที่เผยแพร่</th>
                <th className="px-4 py-3 text-left font-semibold">แสดงบนแอป</th>
                <th className="px-4 py-3 text-left font-semibold">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                    กำลังโหลดประกาศ...
                  </td>
                </tr>
              ) : filteredAnnouncements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                    ไม่พบประกาศตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : filteredAnnouncements.map((item) => {
                const categoryMeta = getCategoryMeta(item.category);
                return (
                  <tr key={item.id} className="border-t border-slate-200 bg-white">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{item.title}</div>
                      <div className="mt-1 max-w-[260px] text-sm text-slate-500 line-clamp-2">{item.description}</div>
                    </td>
                    <td className="px-4 py-3">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="h-14 w-20 rounded-xl object-cover" />
                      ) : (
                        <div className="flex h-14 w-20 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                          <ImageOff className="h-5 w-5" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${categoryMeta.className}`}>
                        {categoryMeta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.date}</td>
                    <td className="px-4 py-3">
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={item.status === 'active'}
                          onChange={() => handleToggleStatus(item.id)}
                          className="peer sr-only"
                        />
                        <div className="h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-emerald-500" />
                        <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
                      </label>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ActionButton
                          type="view"
                          onClick={() => openPreviewModal(item)}
                          title="ดูตัวอย่าง"
                        />
                        <ActionButton
                          type="edit"
                          onClick={() => openEditModal(item)}
                          title="แก้ไข"
                        />
                        <ActionButton
                          type="delete"
                          onClick={() => handleDelete(item.id)}
                          title="ลบ"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {(isCreateOpen || isEditOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">{isEditOpen ? 'แก้ไขประกาศ' : 'สร้างประกาศใหม่'}</h3>
                <p className="mt-1 text-sm text-slate-500">กรอกข้อมูลประกาศเพื่อแสดงบนแอปพลิเคชัน</p>
              </div>
              <button onClick={closeModal} className="rounded-full p-2 transition hover:bg-slate-100">
                <XCircle className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto p-6">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center">
                {form.image ? (
                  <img src={form.image} alt="preview" className="mb-4 h-40 w-full rounded-2xl object-cover" />
                ) : (
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                    <Camera className="h-6 w-6" />
                  </div>
                )}
                <p className="text-sm font-medium text-slate-700">คลิกเพื่อเลือกรูปภาพหน้าปก (ขนาดแนะนำ 1200x600 px)</p>
                <input type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} />
              </label>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">หัวข้อข่าว</label>
                  <input
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder="ระบุหัวข้อข่าวสาร..."
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">หมวดหมู่</label>
                  <select
                    value={form.category}
                    onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as Announcement['category'] }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  >
                    <option value="urgent">ประกาศด่วน</option>
                    <option value="event">กิจกรรม</option>
                    <option value="general">ทั่วไป</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">สถานะ</label>
                  <select
                    value={form.status}
                    onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as Announcement['status'] }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  >
                    <option value="active">แสดงผลทันที</option>
                    <option value="inactive">ปิดการแสดงผล</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">เนื้อหาประกาศ</label>
                  <div className="rounded-xl border border-slate-200 p-2">
                    <div className="mb-2 flex flex-wrap gap-2">
                      <button type="button" onClick={() => applyTextFormat('bold')} className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-100"><Bold className="h-4 w-4" /></button>
                      <button type="button" onClick={() => applyTextFormat('italic')} className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-100"><Italic className="h-4 w-4" /></button>
                      <button type="button" onClick={() => applyTextFormat('list')} className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-100"><List className="h-4 w-4" /></button>
                      <button type="button" onClick={() => applyTextFormat('link')} className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-100"><Link className="h-4 w-4" /></button>
                    </div>
                    <div
                      ref={editorRef}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={handleEditorInput}
                      data-placeholder="พิมพ์ข้อความประกาศที่ต้องการเผยแพร่..."
                      className="min-h-[220px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                      style={{ whiteSpace: 'pre-wrap' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:justify-end">
              <button onClick={closeModal} className="rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">ยกเลิก</button>
              <button onClick={handleCreateOrUpdate} className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700">{isEditOpen ? 'บันทึกการแก้ไข' : 'สร้างประกาศ'}</button>
            </div>
          </div>
        </div>
      )}

      {isPreviewOpen && selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">ตัวอย่างประกาศ</h3>
                <p className="mt-1 text-sm text-slate-500">หน้าตาประกาศที่ลูกค้าจะเห็นบนแอปพลิเคชัน</p>
              </div>
              <button onClick={() => setIsPreviewOpen(false)} className="rounded-full p-2 transition hover:bg-slate-100">
                <XCircle className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto p-6">
              {selectedAnnouncement.image ? (
                <img src={selectedAnnouncement.image} alt={selectedAnnouncement.title} className="mb-5 h-56 w-full rounded-2xl object-cover" />
              ) : null}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getCategoryMeta(selectedAnnouncement.category).className}`}>
                  {getCategoryMeta(selectedAnnouncement.category).label}
                </span>
                <span className="text-sm text-slate-500">เผยแพร่ {selectedAnnouncement.date}</span>
              </div>
              <h4 className="text-2xl font-semibold text-slate-900">{selectedAnnouncement.title}</h4>
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700">{selectedAnnouncement.description}</p>
            </div>

            <div className="flex justify-end border-t border-slate-200 px-6 py-4">
              <button onClick={() => setIsPreviewOpen(false)} className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700">ปิดหน้าต่าง</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const SettingsPage: React.FC = () => (
  <div className="space-y-6">
    <PageHeader title="Settings" description="Adjust platform and access settings." />
    <SimplePageCard title="Settings overview" description="Settings content will appear here." />
  </div>
);

export const UserManagementPage: React.FC = () => (
  <div className="space-y-6">
    <PageHeader title="User Management" description="Manage staff permissions and access." />
    <SimplePageCard title="User overview" description="User management content will appear here." />
  </div>
);

export const ProfilePage: React.FC = () => (
  <div className="space-y-6">
    <PageHeader title="Profile" description="Review admin profile details." />
    <SimplePageCard title="Profile overview" description="Profile information will appear here." />
  </div>
);

export const NotificationCenterPage: React.FC = () => (
  <div className="space-y-6">
    <PageHeader title="Notification Center" description="Monitor alerts and recent activity." />
    <SimplePageCard title="Notifications overview" description="Notification content will appear here." />
  </div>
);
