import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Maximize2,
  Search,
  UserRound,
  Users,
  X,
  ShieldCheck,
  Clock,
  Building2,
  XCircle,
  Check,
  Copy,
  Store,
  Filter,
  Calendar,
} from 'lucide-react';
import { mockSellers, mockNewSellerApplications } from '../data/mockData';
import { ActionButton } from '../components/common';
import type { Seller, NewSellerApplication } from '../types';
import { formatImageUrl } from '../utils/imageUtils';

type ActiveTab = 'sellers' | 'applications';

const buildAvatarUrl = (name: string) => {
  const encodedName = encodeURIComponent(name || 'Seller');
  return `https://ui-avatars.com/api/?name=${encodedName}&background=0EA5E9&color=fff`;
};

const formatCitizenId = (id: string | null | undefined) => {
  if (!id || id === '-' || id.trim().length !== 13) return id || '-';
  const clean = id.trim().replace(/\D/g, '');
  if (clean.length !== 13) return id;
  return `${clean.slice(0, 1)}-${clean.slice(1, 5)}-${clean.slice(5, 10)}-${clean.slice(10, 12)}-${clean.slice(12)}`;
};

const formatDate = (dateString: string | null | undefined) => {
  const value = typeof dateString === 'string' ? dateString.trim() : dateString;

  if (!value || value === '-' || value === 'Invalid Date') {
    return 'ไม่ระบุวันที่';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'ไม่ระบุวันที่';
  }

  return `${date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })} น.`;
};

const SellersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('applications');
  const [sellers, setSellers] = useState<Seller[]>(mockSellers);
  const [applications, setApplications] = useState<NewSellerApplication[]>(mockNewSellerApplications);
  const [isLoadingSellers, setIsLoadingSellers] = useState(false);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [applicationSearch, setApplicationSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedApplication, setSelectedApplication] = useState<NewSellerApplication | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [openStallsSellerId, setOpenStallsSellerId] = useState<string | null>(null);
  const [vendorPage, setVendorPage] = useState(1);
  const [applicationPage, setApplicationPage] = useState(1);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const pageSize = 6;

  useEffect(() => {
    const handleOutsideClick = () => {
      setOpenStallsSellerId(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const copyToClipboard = (text: string | null | undefined, fieldName: string) => {
    if (!text || text === '-') return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Load Sellers
  useEffect(() => {
    const controller = new AbortController();

    const loadSellers = async () => {
      setIsLoadingSellers(true);

      try {
        const params = new URLSearchParams();
        if (searchTerm.trim()) {
          params.set('search', searchTerm.trim());
        }

        const response = await fetch(`/api/v1/admin/sellers${params.toString() ? `?${params.toString()}` : ''}`, {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Unable to load sellers');
        }

        const payload = await response.json();
        const sellersData = Array.isArray(payload?.data) ? payload.data : [];

        const mappedSellers: Seller[] = sellersData.map((item: any) => ({
          id: String(item.id),
          name: item.name ?? item.username ?? 'ไม่ระบุชื่อ',
          phone: item.phone ?? '-',
          email: item.email ?? '-',
          citizen_id: item.citizen_id ?? '-',
          current_stalls: Array.isArray(item.current_stalls) ? item.current_stalls : [],
          status: item.status === 'active' ? 'active' : 'inactive',
          avatar: formatImageUrl(item.avatar) ?? buildAvatarUrl(item.name ?? item.username ?? 'Seller'),
          document_url: formatImageUrl(item.document_url) ?? null,
          document_image: formatImageUrl(item.document_image) ?? null,
        }));

        setSellers(mappedSellers);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setSellers(mockSellers);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingSellers(false);
        }
      }
    };

    loadSellers();

    return () => controller.abort();
  }, [searchTerm]);

  // Load Applications
  useEffect(() => {
    const controller = new AbortController();

    const loadApplications = async () => {
      setIsLoadingApplications(true);

      try {
        const params = new URLSearchParams();
        if (applicationSearch.trim()) {
          params.set('search', applicationSearch.trim());
        }

        const response = await fetch(`/api/v1/admin/sellers/pending${params.toString() ? `?${params.toString()}` : ''}`, {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Unable to load applications');
        }

        const payload = await response.json();
        const applicationsData = Array.isArray(payload?.data) ? payload.data : [];

        const mappedApplications: NewSellerApplication[] = applicationsData.map((item: any) => ({
          id: String(item.id),
          name: item.name ?? item.username ?? 'ไม่ระบุชื่อ',
          citizen_id: item.citizen_id ?? '-',
          phone: item.phone ?? '-',
          email: item.email ?? '-',
          address: item.address ?? '-',
          avatar: formatImageUrl(item.avatar) ?? buildAvatarUrl(item.name ?? item.username ?? 'Seller'),
          submission_date: item.submission_date ?? item.created_at ?? '-',
          status: item.document_status === 'approved' ? 'approved' : item.document_status === 'rejected' ? 'rejected' : 'pending',
          document_url: formatImageUrl(item.document_url) ?? null,
          document_image: formatImageUrl(item.document_image) ?? null,
        }));

        setApplications(mappedApplications);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setApplications(mockNewSellerApplications);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingApplications(false);
        }
      }
    };

    loadApplications();

    return () => controller.abort();
  }, [applicationSearch]);

  const filteredSellers = useMemo(() => {
    return sellers.filter((seller) => {
      const matchesSearch = [seller.name, seller.phone, seller.citizen_id, seller.email].join(' ').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || seller.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [sellers, searchTerm, statusFilter]);

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch = [app.name, app.phone, app.citizen_id, app.email].join(' ').toLowerCase().includes(applicationSearch.toLowerCase());
      return matchesSearch;
    });
  }, [applications, applicationSearch]);

  const vendorPageCount = Math.max(1, Math.ceil(filteredSellers.length / pageSize));
  const applicationPageCount = Math.max(1, Math.ceil(filteredApplications.length / pageSize));

  const pagedSellers = filteredSellers.slice((vendorPage - 1) * pageSize, vendorPage * pageSize);
  const pagedApplications = filteredApplications.slice((applicationPage - 1) * pageSize, applicationPage * pageSize);

  useEffect(() => {
    setVendorPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    setApplicationPage(1);
  }, [applicationSearch]);

  // Summary KPI statistics
  const summaryStats = useMemo(() => {
    const totalSellers = sellers.length;
    const activeSellers = sellers.filter((s) => s.status === 'active').length;
    const pendingApps = applications.filter((a) => a.status === 'pending').length;
    const totalStalls = sellers.reduce((acc, s) => acc + (s.current_stalls?.length || 0), 0);

    return { totalSellers, activeSellers, pendingApps, totalStalls };
  }, [sellers, applications]);

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const endpoint = status === 'approved' ? `/api/v1/admin/sellers/${id}/approve` : `/api/v1/admin/sellers/${id}/reject`;
      const body = status === 'approved'
        ? {
            citizen_id: (selectedApplication?.citizen_id || '').replace(/\D/g, ''),
            address: selectedApplication?.address ?? '',
          }
        : undefined;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errPayload = await response.json().catch(() => ({}));
        const errMsg = errPayload?.message || errPayload?.errors?.citizen_id?.[0] || 'ไม่สามารถอัปเดตข้อมูลผู้ค้าได้';
        throw new Error(errMsg);
      }

      setApplications((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
      setSellers((current) => current.map((seller) => (seller.id === id ? { ...seller, status: status === 'approved' ? 'active' : 'inactive' } : seller)));
      setSelectedApplication(null);
      window.dispatchEvent(new Event('refresh-badges'));
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Summary KPI Dashboard Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Merchants */}
        <div className="rounded-2xl border border-sky-200/80 bg-sky-50/60 p-4 shadow-xs hover:border-sky-300 transition duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-800 uppercase tracking-wide">ผู้ค้าในระบบทั้งหมด</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100/90 text-sky-700 shadow-xs">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-sky-900">{summaryStats.totalSellers} <span className="text-xs font-bold text-sky-600">ราย</span></p>
        </div>

        {/* Active Merchants */}
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-4 shadow-xs hover:border-emerald-300 transition duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">ใช้งานอยู่ปัจจุบัน</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100/90 text-emerald-700 shadow-xs">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-900">{summaryStats.activeSellers} <span className="text-xs font-bold text-emerald-600">ราย</span></p>
        </div>

        {/* Pending Applications */}
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-4 shadow-xs hover:border-amber-300 transition duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">คำขอสมัครรออนุมัติ</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100/90 text-amber-700 shadow-xs">
              <Clock className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-900">{summaryStats.pendingApps} <span className="text-xs font-bold text-amber-600">คำขอ</span></p>
        </div>
      </div>

      {/* ── Tab Switcher Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 rounded-2xl bg-slate-100 p-1.5 border border-slate-200/80 w-fit">
          <button
            onClick={() => setActiveTab('applications')}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black transition-all cursor-pointer ${
              activeTab === 'applications'
                ? 'bg-white text-blue-600 shadow-md ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>คำขอสมัครใหม่</span>
            {summaryStats.pendingApps > 0 && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            )}
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${activeTab === 'applications' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'}`}>
              {filteredApplications.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('sellers')}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black transition-all cursor-pointer ${
              activeTab === 'sellers'
                ? 'bg-white text-blue-600 shadow-md ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>ข้อมูลผู้ค้าปัจจุบัน</span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${activeTab === 'sellers' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'}`}>
              {filteredSellers.length}
            </span>
          </button>
        </div>

        <p className="text-xs font-semibold text-slate-500">
          {activeTab === 'sellers' ? 'รายการผู้ค้าที่ลงทะเบียนและเปิดใช้งานในระบบ' : 'ตรวจสอบและอนุมัติหลักฐานผู้สมัครค้าขายใหม่'}
        </p>
      </div>

      {/* ── TAB 1: CURRENT SELLERS TABLE ── */}
      {activeTab === 'sellers' && (
        <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="ค้นหาชื่อผู้ค้า, เบอร์โทรศัพท์, อีเมล หรือเลขบัตรประชาชน..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-9 text-xs font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white placeholder:text-slate-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
                <Filter className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500 font-medium">สถานะ:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer pr-2"
                >
                  <option value="all">ทั้งหมด ({sellers.length})</option>
                  <option value="active">ใช้งานอยู่ ({summaryStats.activeSellers})</option>
                  <option value="inactive">ไม่ใช้งาน ({sellers.length - summaryStats.activeSellers})</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sellers Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-600">ผู้ค้า / บัญชีผู้ใช้</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-600">เลขบัตรประชาชน</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-600">เบอร์ติดต่อ</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-600">แผงค้าที่ถือครอบครอง</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-600">สถานะ</th>
                  <th className="px-5 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-slate-600">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {isLoadingSellers ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm font-semibold text-slate-500">
                      กำลังโหลดข้อมูลผู้ค้าในระบบ...
                    </td>
                  </tr>
                ) : pagedSellers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm font-medium text-slate-500">
                      ไม่พบข้อมูลผู้ค้าตรงตามเงื่อนไขที่ค้นหา
                    </td>
                  </tr>
                ) : (
                  pagedSellers.map((seller) => (
                    <tr key={seller.id} className="group transition-colors hover:bg-blue-50/30">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img src={seller.avatar} alt={seller.name} className="h-10 w-10 shrink-0 rounded-2xl object-cover shadow-2xs border border-slate-200/60" />
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">{seller.name}</p>
                            <p className="text-xs font-medium text-slate-500 truncate max-w-[180px]">{seller.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-slate-800 text-xs tracking-wide">
                        {formatCitizenId(seller.citizen_id)}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-700 text-xs">
                        {seller.phone}
                      </td>
                      <td className="px-5 py-4">
                        {seller.current_stalls && seller.current_stalls.length > 0 ? (
                          <div className="relative group/stall flex items-center gap-1.5 w-fit">
                            {/* Display first 2 stalls directly */}
                            {seller.current_stalls.slice(0, seller.current_stalls.length > 2 ? 2 : seller.current_stalls.length).map((zone) => (
                              <span key={zone} className="inline-flex items-center gap-1 rounded-xl border border-blue-200/80 bg-blue-50/80 px-2.5 py-1 text-xs font-extrabold text-blue-700">
                                <Building2 className="h-3.5 w-3.5 text-blue-500" />
                                {zone}
                              </span>
                            ))}
                            
                            {/* If more than 2 stalls (e.g. 3-10 stalls), show +N count badge */}
                            {seller.current_stalls.length > 2 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenStallsSellerId(openStallsSellerId === String(seller.id) ? null : String(seller.id));
                                }}
                                className="rounded-xl bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 px-2.5 py-1 text-xs font-black text-slate-600 transition select-none cursor-pointer border border-slate-200"
                              >
                                +{seller.current_stalls.length - 2} แผง
                              </button>
                            )}

                            {/* Interactive Stall Tooltip Popover for multiple stalls */}
                            {seller.current_stalls.length > 2 && (
                              <div 
                                onClick={(e) => e.stopPropagation()}
                                className={`absolute bottom-full left-0 z-30 mb-2 w-60 transition-all duration-200 ${
                                  openStallsSellerId === String(seller.id) 
                                    ? 'scale-100 opacity-100 pointer-events-auto' 
                                    : 'scale-95 opacity-0 pointer-events-none group-hover/stall:scale-100 group-hover/stall:opacity-100 group-hover/stall:pointer-events-auto'
                                }`}
                              >
                                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xl space-y-2">
                                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                    <div className="flex items-center gap-1.5">
                                      <Store className="h-4 w-4 text-indigo-600" />
                                      <p className="text-xs font-black text-slate-800">แผงค้าทั้งหมด ({seller.current_stalls.length} แผง)</p>
                                    </div>
                                    <button 
                                      onClick={() => setOpenStallsSellerId(null)} 
                                      className="text-xs text-slate-400 hover:text-slate-700 font-bold px-1"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto custom-scrollbar pt-1">
                                    {seller.current_stalls.map((zone) => (
                                      <span key={zone} className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-extrabold text-sky-700">
                                        <Building2 className="h-3 w-3 text-sky-500" />
                                        {zone}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400 italic">ไม่มีแผงค้าในครอบครอง</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold border ${
                          seller.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${seller.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {seller.status === 'active' ? 'ใช้งานอยู่' : 'ระงับ/ไม่ใช้งาน'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <ActionButton
                          type="view"
                          onClick={() => setSelectedSeller(seller)}
                          title="ดูข้อมูลผู้ค้าอย่างละเอียด"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredSellers.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 pt-3 text-xs font-medium text-slate-500 gap-3">
              <span>
                แสดงสูงสุด {pageSize} คนต่อหน้า (หน้า {vendorPage} จากทั้งหมด {vendorPageCount} หน้า - ทั้งหมด {filteredSellers.length} คน)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setVendorPage((current) => Math.max(1, current - 1))}
                  disabled={vendorPage === 1}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100 transition disabled:opacity-40 shadow-2xs"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: vendorPageCount }, (_, index) => index + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setVendorPage(page)}
                    className={`h-8 w-8 rounded-xl text-xs font-bold transition shadow-2xs ${
                      vendorPage === page
                        ? 'bg-blue-600 text-white font-black'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setVendorPage((current) => Math.min(vendorPageCount, current + 1))}
                  disabled={vendorPage === vendorPageCount}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100 transition disabled:opacity-40 shadow-2xs"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── TAB 2: NEW APPLICATIONS TABLE ── */}
      {activeTab === 'applications' && (
        <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={applicationSearch}
                onChange={(event) => setApplicationSearch(event.target.value)}
                placeholder="ค้นหาชื่อผู้สมัคร, เบอร์โทรศัพท์ หรือเลขบัตรประชาชน..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-9 text-xs font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white placeholder:text-slate-400"
              />
              {applicationSearch && (
                <button
                  onClick={() => setApplicationSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-600">ผู้สมัครค้าขายใหม่</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-600">เบอร์ติดต่อ</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-600">วันที่ยื่นเรื่อง</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-600">หลักฐานแนบ</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-600">สถานะ</th>
                  <th className="px-5 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-slate-600">ตรวจสอบ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {isLoadingApplications ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm font-semibold text-slate-500">
                      กำลังโหลดคำขอสมัครใหม่...
                    </td>
                  </tr>
                ) : pagedApplications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm font-medium text-slate-500">
                      ไม่มีรายการคำขอสมัครใหม่ในขณะนี้
                    </td>
                  </tr>
                ) : (
                  pagedApplications.map((app) => (
                    <tr key={app.id} className="group transition-colors hover:bg-amber-50/30">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img src={app.avatar} alt={app.name} className="h-10 w-10 shrink-0 rounded-2xl object-cover shadow-2xs border border-slate-200/60" />
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">{app.name}</p>
                            <p className="text-xs font-mono font-bold text-slate-500">{formatCitizenId(app.citizen_id)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-700 text-xs">{app.phone}</td>
                      <td className="px-5 py-4 text-xs font-medium text-slate-600">{formatDate(app.submission_date)}</td>
                      <td className="px-5 py-4">
                        {app.document_url ? (
                          <button
                            type="button"
                            onClick={() => setZoomedImage(app.document_url as string)}
                            className="group/doc relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 hover:border-blue-400 transition cursor-pointer"
                          >
                            <img src={app.document_url as string} alt="หลักฐาน" className="h-11 w-16 object-cover transition group-hover/doc:scale-105" />
                            <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover/doc:opacity-100 transition flex items-center justify-center text-white">
                              <Maximize2 className="h-3.5 w-3.5" />
                            </div>
                          </button>
                        ) : (
                          <div className="flex h-11 w-16 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-400">
                            <FileText className="h-4 w-4" />
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold border ${
                          app.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : app.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            app.status === 'pending' ? 'bg-amber-500' : app.status === 'approved' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`} />
                          {app.status === 'pending' ? 'รอตรวจสอบ' : app.status === 'approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธคำขอ'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <ActionButton
                          type="view"
                          onClick={() => setSelectedApplication(app)}
                          title="ตรวจสอบเอกสารและพิจารณาอนุมัติ"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredApplications.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 pt-3 text-xs font-medium text-slate-500 gap-3">
              <span>
                แสดงสูงสุด {pageSize} รายการต่อหน้า (หน้า {applicationPage} จากทั้งหมด {applicationPageCount} หน้า - ทั้งหมด {filteredApplications.length} รายการ)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setApplicationPage((current) => Math.max(1, current - 1))}
                  disabled={applicationPage === 1}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100 transition disabled:opacity-40 shadow-2xs"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: applicationPageCount }, (_, index) => index + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setApplicationPage(page)}
                    className={`h-8 w-8 rounded-xl text-xs font-bold transition shadow-2xs ${
                      applicationPage === page
                        ? 'bg-blue-600 text-white font-black'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setApplicationPage((current) => Math.min(applicationPageCount, current + 1))}
                  disabled={applicationPage === applicationPageCount}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100 transition disabled:opacity-40 shadow-2xs"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── SELLER DETAIL MODAL (CURRENT SELLERS) ── */}
      {selectedSeller &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl space-y-0 animate-in zoom-in-95 duration-200 custom-scrollbar">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-6 py-4 text-white">
                <div className="flex items-center gap-3">
                  <img src={selectedSeller.avatar} alt={selectedSeller.name} className="h-10 w-10 rounded-2xl object-cover border border-white/20 shadow-xs" />
                  <div>
                    <h3 className="text-base font-bold">{selectedSeller.name}</h3>
                    <p className="text-xs text-slate-400">ข้อมูลผู้ค้าในระบบและสิทธิ์แผงค้า (Read-Only)</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSeller(null)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="grid gap-6 p-6 lg:grid-cols-2">
                {/* Identity Info */}
                <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                  <div className="flex items-center gap-2 border-b border-slate-200/60 pb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                      <UserRound className="h-4 w-4" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">ข้อมูลอัตลักษณ์บุคคล</h4>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-2xl bg-white p-3.5 border border-slate-200/60 shadow-2xs flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-400">ชื่อ-นามสกุลผู้ค้า</p>
                        <p className="mt-0.5 text-sm font-extrabold text-slate-900">{selectedSeller.name}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white p-3.5 border border-slate-200/60 shadow-2xs flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-400">เบอร์โทรศัพท์ติดต่อ</p>
                        <p className="mt-0.5 text-sm font-bold text-slate-900">{selectedSeller.phone}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedSeller.phone, 'phone')}
                        className="rounded-xl bg-slate-100 p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition cursor-pointer"
                        title="คัดลอกเบอร์โทร"
                      >
                        {copiedField === 'phone' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>

                    <div className="rounded-2xl bg-white p-3.5 border border-slate-200/60 shadow-2xs flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-400">อีเมลติดต่อ</p>
                        <p className="mt-0.5 text-sm font-semibold text-slate-800 break-all">{selectedSeller.email}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white p-3.5 border border-slate-200/60 shadow-2xs flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-400">เลขประจำตัวประชาชน</p>
                        <p className="mt-0.5 text-sm font-mono font-extrabold text-slate-900 tracking-wider">
                          {formatCitizenId(selectedSeller.citizen_id)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedSeller.citizen_id, 'citizen_id')}
                        className="rounded-xl bg-slate-100 p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition cursor-pointer"
                        title="คัดลอกเลขบัตรประชาชน"
                      >
                        {copiedField === 'citizen_id' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>

                    <div className="rounded-2xl bg-white p-3.5 border border-slate-200/60 shadow-2xs">
                      <p className="text-xs font-bold text-slate-400 mb-1.5">สถานะบัญชี</p>
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold border ${
                        selectedSeller.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${selectedSeller.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {selectedSeller.status === 'active' ? 'เปิดใช้งานปกติ (Active)' : 'ถูกระงับการใช้งาน (Inactive)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stalls & Documents */}
                <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                        <Store className="h-4 w-4" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">แผงค้าในครอบครองปัจจุบัน</h4>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500">จำนวนแผงที่ถือนำเช่า</span>
                        <span className="text-xs font-black text-indigo-600">{selectedSeller.current_stalls?.length || 0} แผง</span>
                      </div>

                      {(selectedSeller.current_stalls || []).length > 0 ? (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {(selectedSeller.current_stalls || []).map((zone) => (
                            <span key={zone} className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-black text-indigo-700 shadow-2xs">
                              <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                              {zone}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs font-semibold text-slate-400 italic">ยังไม่มีเลขแผงค้าที่ผูกกับบัญชีนี้</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">ภาพเอกสารประจำตัว</h4>
                      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center p-2 min-h-[160px]">
                        {selectedSeller.document_url ? (
                          <button
                            type="button"
                            onClick={() => setZoomedImage(selectedSeller.document_url as string)}
                            className="group relative w-full h-40 overflow-hidden rounded-xl cursor-pointer"
                          >
                            <img src={selectedSeller.document_url as string} alt="เอกสาร" className="h-full w-full object-cover rounded-xl transition duration-200 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                              <Maximize2 className="h-4 w-4" />
                              ดูภาพขนาดเต็ม
                            </div>
                          </button>
                        ) : (
                          <div className="text-xs font-medium text-slate-400">ไม่มีไฟล์ภาพเอกสาร</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedSeller(null)}
                      className="rounded-xl border border-slate-200 bg-slate-100 px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                    >
                      ปิดหน้าต่าง
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ── NEW APPLICATION REVIEW MODAL ── */}
      {selectedApplication &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl space-y-0 animate-in zoom-in-95 duration-200 custom-scrollbar">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-6 py-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">พิจารณาอนุมัติผู้สมัครค้าขายใหม่</h3>
                    <p className="text-xs text-slate-400">ตรวจสอบเอกสารหลักฐานและลงทะเบียนเลขบัตรประชาชน</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedApplication(null)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="grid gap-6 p-6 lg:grid-cols-2">
                {/* Personal Info & Citizen ID input */}
                <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                  <div className="flex items-center gap-2 border-b border-slate-200/60 pb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                      <UserRound className="h-4 w-4" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">ข้อมูลผู้สมัคร</h4>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-2xl bg-white p-3.5 border border-slate-200/60 shadow-2xs">
                      <p className="text-xs font-bold text-slate-400">ชื่อ-นามสกุลผู้สมัคร</p>
                      <p className="mt-0.5 text-sm font-extrabold text-slate-900">{selectedApplication.name}</p>
                    </div>

                    <div className="rounded-2xl bg-white p-3.5 border border-slate-200/60 shadow-2xs">
                      <p className="text-xs font-bold text-slate-400">เบอร์โทรศัพท์ติดต่อ</p>
                      <p className="mt-0.5 text-sm font-bold text-slate-900">{selectedApplication.phone}</p>
                    </div>

                    <div className="rounded-2xl bg-white p-3.5 border border-slate-200/60 shadow-2xs">
                      <p className="text-xs font-bold text-slate-400">ที่อยู่ปัจจุบัน</p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-800 leading-relaxed">{selectedApplication.address}</p>
                    </div>

                    {/* Read-Only Citizen ID Display */}
                    <div className="rounded-2xl bg-white p-3.5 border border-slate-200/60 shadow-2xs flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-400">เลขประจำตัวประชาชน (ผู้สมัครระบุ)</p>
                        <p className="mt-0.5 text-sm font-mono font-extrabold text-slate-900 tracking-wider">
                          {formatCitizenId(selectedApplication.citizen_id)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedApplication.citizen_id, 'app_citizen_id')}
                        className="rounded-xl bg-slate-100 p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition cursor-pointer"
                        title="คัดลอกเลขบัตรประชาชน"
                      >
                        {copiedField === 'app_citizen_id' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>

                    <div className="rounded-xl bg-slate-200/60 p-3 text-xs font-semibold text-slate-600 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
                      <span>ยื่นเรื่องสมัครเมื่อ: {formatDate(selectedApplication.submission_date)}</span>
                    </div>
                  </div>
                </div>

                {/* ID Card Document Preview */}
                <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">หลักฐานภาพถ่ายบัตรประชาชน</h4>
                        <p className="text-xs text-slate-400">ตรวจสอบความชัดเจนของรูปถ่ายและตัวเลข</p>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2">
                      <button
                        type="button"
                        onClick={() => setZoomedImage((selectedApplication.document_url as string) ?? 'https://images.unsplash.com/photo-1578496781402-06032763b4f3?auto=format&fit=crop&w=900&q=80')}
                        className="group relative h-60 w-full overflow-hidden rounded-xl cursor-pointer"
                      >
                        <img
                          src={(selectedApplication.document_url as string) ?? 'https://images.unsplash.com/photo-1578496781402-06032763b4f3?auto=format&fit=crop&w=900&q=80'}
                          alt="ภาพบัตรประชาชน"
                          className="h-full w-full object-contain bg-slate-100 rounded-xl transition duration-200 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30 opacity-0 transition group-hover:opacity-100">
                          <div className="flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-bold text-slate-800 shadow-md">
                            <Maximize2 className="h-4 w-4 text-blue-600" />
                            คลิกเปิดรูปขนาดขยายเต็มหน้าจอ
                          </div>
                        </div>
                      </button>
                    </div>

                    {selectedApplication.document_url && (
                      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold">
                        <span className="text-slate-600 truncate max-w-[200px]">{selectedApplication.document_image ?? 'id_card_photo.jpg'}</span>
                        <a
                          href={selectedApplication.document_url as string}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 transition"
                        >
                          <Download className="h-4 w-4" />
                          ดาวน์โหลด
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 pt-4 border-t border-slate-100 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => void handleReview(String(selectedApplication.id), 'rejected')}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-600 hover:text-white transition cursor-pointer active:scale-95"
                    >
                      <XCircle className="h-4 w-4" />
                      ปฏิเสธคำขอ / ข้อมูลไม่ชัดเจน
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleReview(String(selectedApplication.id), 'approved')}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-md hover:bg-emerald-700 transition cursor-pointer active:scale-95"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      อนุมัติเป็นผู้ค้า
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ── ZOOMED IMAGE LIGHTBOX MODAL ── */}
      {zoomedImage &&
        createPortal(
          <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-5xl rounded-3xl bg-white p-3 shadow-2xl space-y-2">
              <div className="flex items-center justify-between px-3 py-1 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-600">พรีวิวหลักฐานภาพถ่ายขนาดขยายเต็ม</span>
                <button
                  type="button"
                  onClick={() => setZoomedImage(null)}
                  className="rounded-full bg-slate-100 p-1.5 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="overflow-hidden rounded-2xl bg-slate-950 flex justify-center p-2">
                <img src={zoomedImage} alt="ภาพขยาย" className="max-h-[82vh] w-full object-contain rounded-xl" />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default SellersPage;
