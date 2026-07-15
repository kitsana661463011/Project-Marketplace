import React, { useEffect, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Download, FileText, Maximize2, Search, UserRound, X } from 'lucide-react';
import { mockSellers, mockNewSellerApplications } from '../data/mockData';
import { ActionButton } from '../components/common';
import type { Seller, NewSellerApplication } from '../types';

type VendorView = 'all' | 'new';

const buildAvatarUrl = (name: string) => {
  const encodedName = encodeURIComponent(name || 'Seller');
  return `https://ui-avatars.com/api/?name=${encodedName}&background=0EA5E9&color=fff`;
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
  const [vendorView] = useState<VendorView>('all');
  const [sellers, setSellers] = useState<Seller[]>(mockSellers);
  const [applications, setApplications] = useState<NewSellerApplication[]>(mockNewSellerApplications);
  const [isLoadingSellers, setIsLoadingSellers] = useState(false);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [applicationSearch, setApplicationSearch] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<NewSellerApplication | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [citizenIdInput, setCitizenIdInput] = useState('');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [openStallsSellerId, setOpenStallsSellerId] = useState<string | null>(null);
  const [vendorPage, setVendorPage] = useState(1);
  const [applicationPage, setApplicationPage] = useState(1);

  useEffect(() => {
    const handleOutsideClick = () => {
      setOpenStallsSellerId(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const pageSize = 5;

  const filteredSellers = sellers.filter((seller) => {
    const matchesSearch = [seller.name, seller.phone, seller.citizen_id].join(' ').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredApplications = applications.filter((app) => {
    const matchesSearch = [app.name, app.phone, app.citizen_id].join(' ').toLowerCase().includes(applicationSearch.toLowerCase());
    return matchesSearch;
  });

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
          avatar: item.avatar ?? buildAvatarUrl(item.name ?? item.username ?? 'Seller'),
          document_url: item.document_url ?? null,
          document_image: item.document_image ?? null,
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
          avatar: item.avatar ?? buildAvatarUrl(item.name ?? item.username ?? 'Seller'),
          submission_date: item.submission_date ?? item.created_at ?? '-',
          status: item.document_status === 'approved' ? 'approved' : item.document_status === 'rejected' ? 'rejected' : 'pending',
          document_url: item.document_url ?? null,
          document_image: item.document_image ?? null,
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

  const vendorPageCount = Math.max(1, Math.ceil(filteredSellers.length / pageSize));
  const applicationPageCount = Math.max(1, Math.ceil(filteredApplications.length / pageSize));

  const pagedSellers = filteredSellers.slice((vendorPage - 1) * pageSize, vendorPage * pageSize);
  const pagedApplications = filteredApplications.slice((applicationPage - 1) * pageSize, applicationPage * pageSize);

  useEffect(() => {
    setVendorPage(1);
  }, [vendorView, searchTerm]);

  useEffect(() => {
    setApplicationPage(1);
  }, [applicationSearch]);

  useEffect(() => {
    if (selectedApplication) {
      const initialCitizenId = selectedApplication.citizen_id && selectedApplication.citizen_id !== '-' ? selectedApplication.citizen_id : '';
      setCitizenIdInput(initialCitizenId);
    } else {
      setCitizenIdInput('');
    }
  }, [selectedApplication]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'inactive':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'rejected':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: 'ใช้งาน',
      inactive: 'ไม่ใช้งาน',
      pending: 'รออนุมัติ',
      approved: 'อนุมัติแล้ว',
      rejected: 'ปฏิเสธแล้ว',
    };
    return labels[status] || status;
  };

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    if (status === 'approved') {
      const citizenId = (citizenIdInput.trim() || selectedApplication?.citizen_id || '').replace(/\D/g, '');
      if (citizenId.length !== 13) {
        alert('กรุณากรอกเลขบัตรประชาชนให้ครบ 13 หลักค่ะ');
        return;
      }
    }

    try {
      const endpoint = status === 'approved' ? `/api/v1/admin/sellers/${id}/approve` : `/api/v1/admin/sellers/${id}/reject`;
      const body = status === 'approved'
        ? {
            citizen_id: (citizenIdInput.trim() || selectedApplication?.citizen_id || '').replace(/\D/g, ''),
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
      setCitizenIdInput('');
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">ข้อมูลผู้ค้า</h1>
        <p className="text-sm text-slate-600 md:text-base">จัดการข้อมูลผู้ค้าและตรวจสอบคำขอสมัครใหม่</p>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">ข้อมูลผู้ค้าปัจจุบัน</h2>
            <p className="text-sm text-slate-500">รายชื่อผู้ค้าทั้งหมดที่มีสถานะใช้งานอยู่</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="ค้นหาชื่อ/เบอร์โทร/บัตรประชาชน"
                className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">ชื่อผู้ค้า</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">เลขบัตรประชาชน</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">เบอร์โทรศัพท์</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">เลขแผงปัจจุบัน</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoadingSellers ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                    กำลังโหลดข้อมูลผู้ค้าปัจจุบัน...
                  </td>
                </tr>
              ) : pagedSellers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                    ไม่มีข้อมูลผู้ค้าปัจจุบันในตอนนี้
                  </td>
                </tr>
              ) : (
                pagedSellers.map((seller) => (
                  <tr key={seller.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <img src={seller.avatar} alt={seller.name} className="h-10 w-10 rounded-full object-cover" />
                        <div>
                          <p className="font-medium text-slate-900">{seller.name}</p>
                          <p className="text-sm text-slate-500">{seller.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">{seller.citizen_id}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">{seller.phone}</td>
                    <td className="px-4 py-4">
                      {seller.current_stalls && seller.current_stalls.length > 0 ? (
                        <div className="relative group flex items-center gap-1.5 w-fit">
                          {/* First Stall */}
                          <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700 select-none">
                            {seller.current_stalls[0]}
                          </span>
                          
                          {/* More stalls count badge */}
                          {seller.current_stalls.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenStallsSellerId(openStallsSellerId === String(seller.id) ? null : String(seller.id));
                              }}
                              className="rounded-full bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 transition select-none outline-none"
                            >
                              +{seller.current_stalls.length - 1}
                            </button>
                          )}

                          {/* Beautiful Interactive Tooltip */}
                          {seller.current_stalls.length > 1 && (
                            <div 
                              onClick={(e) => e.stopPropagation()}
                              className={`absolute bottom-full left-1/2 z-20 mb-2 w-48 -translate-x-1/2 transition-all duration-200 ${
                                openStallsSellerId === String(seller.id) 
                                  ? 'scale-100 opacity-100 pointer-events-auto' 
                                  : 'scale-95 opacity-0 pointer-events-none group-hover:scale-100 group-hover:opacity-100 group-hover:pointer-events-auto'
                              }`}
                            >
                              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                                <div className="flex items-center justify-between mb-1.5 border-b border-slate-100 pb-1">
                                  <p className="text-xs font-bold text-slate-500">แผงค้าทั้งหมด ({seller.current_stalls.length})</p>
                                  <button 
                                    onClick={() => setOpenStallsSellerId(null)} 
                                    className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                                  >
                                    &times;
                                  </button>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {seller.current_stalls.map((zone) => (
                                    <span key={zone} className="rounded-md border border-sky-100 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
                                      {zone}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="absolute top-full left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1 bg-white border-r border-b border-slate-200 rotate-45"></div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <ActionButton
                        type="view"
                        onClick={() => setSelectedSeller(seller)}
                        title="ดูข้อมูลผู้ค้า"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={() => setVendorPage((current) => Math.max(1, current - 1))}
            disabled={vendorPage === 1}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: vendorPageCount }, (_, index) => index + 1).map((page) => (
            <button
              key={page}
              onClick={() => setVendorPage(page)}
              className={`h-9 w-9 rounded-full text-sm font-medium ${vendorPage === page ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setVendorPage((current) => Math.min(vendorPageCount, current + 1))}
            disabled={vendorPage === vendorPageCount}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">รายการรออนุมัติผู้สมัครใหม่</h2>
            <p className="text-sm text-slate-500">ตรวจเอกสารและดำเนินการอนุมัติผู้สมัคร</p>
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={applicationSearch}
              onChange={(event) => setApplicationSearch(event.target.value)}
              placeholder="ค้นหาชื่อผู้สมัคร"
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">ชื่อผู้สมัคร</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">เบอร์ติดต่อ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">วันที่ส่งเอกสาร</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">หลักฐาน</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">สถานะ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoadingApplications ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                    กำลังโหลดคำขออนุมัติผู้สมัคร...
                  </td>
                </tr>
              ) : pagedApplications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                    ไม่มีคำขอสมัครใหม่ในตอนนี้
                  </td>
                </tr>
              ) : (
                pagedApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <img src={app.avatar} alt={app.name} className="h-10 w-10 rounded-full object-cover" />
                        <div>
                          <p className="font-medium text-slate-900">{app.name}</p>
                          <p className="text-sm text-slate-500">{app.citizen_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">{app.phone}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">{formatDate(app.submission_date)}</td>
                    <td className="px-4 py-4">
                      {app.document_url ? (
                        <img src={app.document_url as string} alt="thumbnail" className="h-12 w-16 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-12 w-16 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-slate-400">
                          <FileText className="h-5 w-5" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(app.status || 'pending')}`}>
                        {app.status === 'pending' ? 'รอตรวจสอบ' : getStatusLabel(app.status || 'pending')}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <ActionButton
                        type="view"
                        onClick={() => setSelectedApplication(app)}
                        title="ตรวจสอบเอกสาร"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={() => setApplicationPage((current) => Math.max(1, current - 1))}
            disabled={applicationPage === 1}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: applicationPageCount }, (_, index) => index + 1).map((page) => (
            <button
              key={page}
              onClick={() => setApplicationPage(page)}
              className={`h-9 w-9 rounded-full text-sm font-medium ${applicationPage === page ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setApplicationPage((current) => Math.min(applicationPageCount, current + 1))}
            disabled={applicationPage === applicationPageCount}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {selectedSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-5xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between rounded-t-3xl bg-[#1e62ec] px-6 py-4 text-white">
              <h3 className="text-lg font-semibold">ข้อมูลผู้ค้าปัจจุบัน (Read Only)</h3>
              <button onClick={() => setSelectedSeller(null)} className="rounded-full p-2 transition hover:bg-sky-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <div className="rounded-full bg-sky-100 p-2 text-sky-700">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-900">ข้อมูลส่วนตัว</h4>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">ชื่อ-นามสกุล</p>
                    <p className="mt-1 text-base font-medium text-slate-900">{selectedSeller.name}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">อีเมล</p>
                    <p className="mt-1 text-base font-medium text-slate-900">{selectedSeller.email}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">เบอร์โทรศัพท์</p>
                    <p className="mt-1 text-base font-medium text-slate-900">{selectedSeller.phone}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">เลขบัตรประชาชน</p>
                    <p className="mt-1 text-base font-medium text-slate-900">{selectedSeller.citizen_id}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">สถานะ</p>
                    <p className="mt-1 text-base font-medium text-slate-900">{selectedSeller.status === 'active' ? 'ใช้งาน' : 'ไม่ใช้งาน'}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">เลขแผงปัจจุบัน</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(selectedSeller.current_stalls || []).length > 0 ? (
                        (selectedSeller.current_stalls || []).map((zone) => (
                          <span key={zone} className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700">
                            {zone}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-500">ยังไม่มีเลขแผงที่กำหนด</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center gap-2">
                  <div className="rounded-full bg-amber-100 p-2 text-amber-700">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900">ภาพเอกสาร</h4>
                    <p className="text-sm text-slate-500">ข้อมูลเอกสารที่เกี่ยวข้องกับผู้ค้า</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex h-56 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-sky-100 to-slate-100">
                    {selectedSeller.document_url ? (
                      <img src={selectedSeller.document_url as string} alt="ภาพเอกสารผู้ค้า" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-100 text-sm text-slate-500">
                        ไม่มีภาพเอกสารที่แสดง
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                  ข้อมูลนี้เป็นแบบอ่านอย่างเดียว ไม่สามารถแก้ไขข้อมูลได้
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-5xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between rounded-t-3xl bg-[#1e62ec] px-6 py-4 text-white">
              <h3 className="text-lg font-semibold">ตรวจสอบเอกสารผู้สมัครใหม่</h3>
              <button onClick={() => setSelectedApplication(null)} className="rounded-full p-2 transition hover:bg-sky-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <div className="rounded-full bg-sky-100 p-2 text-sky-700">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-900">ข้อมูลส่วนตัว</h4>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">ชื่อ-นามสกุล</p>
                    <p className="mt-1 text-base font-medium text-slate-900">{selectedApplication.name}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">เบอร์โทรศัพท์</p>
                    <p className="mt-1 text-base font-medium text-slate-900">{selectedApplication.phone}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">ที่อยู่ปัจจุบัน</p>
                    <p className="mt-1 text-base font-medium text-slate-900">{selectedApplication.address}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="citizen-id-input">
                      รหัสบัตรประชาชน
                    </label>
                    <input
                      id="citizen-id-input"
                      type="text"
                      inputMode="numeric"
                      maxLength={13}
                      value={citizenIdInput}
                      onChange={(event) => setCitizenIdInput(event.target.value.replace(/\D/g, ''))}
                      placeholder="กรอกเลขบัตรประชาชน 13 หลัก"
                      className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:bg-white"
                    />
                  </div>
                </div>

                <p className="mt-4 text-sm text-slate-500">📅 วันที่ส่งสมัคร: {formatDate(selectedApplication.submission_date)}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center gap-2">
                  <div className="rounded-full bg-amber-100 p-2 text-amber-700">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900">หลักฐานการสมัคร</h4>
                    <p className="text-sm text-slate-500">รูปถ่ายบัตรประชาชน</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex h-56 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-sky-100 to-slate-100">
                    <button
                      type="button"
                      onClick={() => setZoomedImage((selectedApplication.document_url as string) ?? 'https://images.unsplash.com/photo-1578496781402-06032763b4f3?auto=format&fit=crop&w=900&q=80')}
                      className="group relative h-full w-full"
                    >
                      <img
                        src={(selectedApplication.document_url as string) ?? 'https://images.unsplash.com/photo-1578496781402-06032763b4f3?auto=format&fit=crop&w=900&q=80'}
                        alt="ภาพบัตรประชาชน"
                        className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/20 opacity-0 transition group-hover:opacity-100">
                        <div className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700">
                          <Maximize2 className="h-4 w-4" />
                          คลิกเพื่อซูม
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-700">{selectedApplication.document_image ?? 'id_card.jpg'}</span>
                  </div>
                  <a href={selectedApplication.document_url ?? '#'} className="flex items-center gap-1 font-medium text-sky-700 hover:text-sky-800">
                    <Download className="h-4 w-4" />
                    ดาวน์โหลดไฟล์
                  </a>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                onClick={() => handleReview(String(selectedApplication.id), 'rejected')}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                <X className="h-4 w-4" />
                ปฏิเสธ / ข้อมูลไม่ชัดเจน
              </button>
              <button
                onClick={() => handleReview(String(selectedApplication.id), 'approved')}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <CheckCircle2 className="h-4 w-4" />
                อนุมัติการสมัคร
              </button>
            </div>
          </div>
        </div>
      )}

      {zoomedImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/85 p-4">
          <div className="relative w-full max-w-5xl rounded-3xl bg-white p-3 shadow-2xl">
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 text-slate-700 shadow transition hover:bg-white"
            >
              <X className="h-5 w-5" />
            </button>
            <img src={zoomedImage} alt="ภาพขยาย" className="max-h-[80vh] w-full rounded-2xl object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};

export default SellersPage;
