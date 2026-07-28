import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Info, Save, Trash2, UploadCloud, Eye, CheckCircle2, Clock, Inbox, Receipt, XCircle, ExternalLink, CreditCard, User, FileText, ImageOff, Search, ChevronLeft, ChevronRight, Copy, Check, QrCode } from 'lucide-react';
import { formatImageUrl } from '../utils/imageUtils';

type PaymentSettingsResponse = {
  status: boolean;
  message: string;
  data: {
    id?: number;
    account_name?: string;
    account_number?: string;
    qr_code_path?: string | null;
  } | null;
};

const initialFormData = {
  accountName: '',
  accountNumber: '',
};



const PaymentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormData);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [qrCodePreview, setQrCodePreview] = useState<string | null>(null);

  const qrCodeUrl = useMemo(() => {
    if (!qrCodePreview) return null;
    if (
      qrCodePreview.startsWith('http') ||
      qrCodePreview.startsWith('data:')
    ) {
      return qrCodePreview;
    }
    const cleanPath = qrCodePreview.replace(/^\/storage\//, '').replace(/^storage\//, '').replace(/^\/api\/images\//, '');
    return `/api/images/${cleanPath}`;
  }, [qrCodePreview]);

  const handleInputChange = (field: 'accountName' | 'accountNumber', value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedFileName(file?.name ?? '');
    setSelectedFile(file ?? null);

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setQrCodePreview(typeof reader.result === 'string' ? reader.result : null);
      };
      reader.readAsDataURL(file);
    }
  };

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/market-payment-settings');
      if (!response.ok) {
        throw new Error('Unable to load payment settings');
      }

      const payload = (await response.json()) as PaymentSettingsResponse;
      const settings = payload.data;

      setFormData({
        accountName: settings?.account_name ?? '',
        accountNumber: settings?.account_number ?? '',
      });
      setQrCodePreview(settings?.qr_code_path ?? null);
    } catch {
      setErrorMessage('ไม่สามารถดึงข้อมูลบัญชีรับชำระเงินได้ในขณะนี้');
    } finally {
      setIsLoading(false);
    }
  };

  const [payments, setPayments] = useState<any[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [selectedSlip, setSelectedSlip] = useState<string | null>(null);
  const [slipImageError, setSlipImageError] = useState<Record<string, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'refund_requested' | 'refunded'>('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Online Refund Approval States
  const [refundSlipFile, setRefundSlipFile] = useState<File | null>(null);
  const [refundSlipPreview, setRefundSlipPreview] = useState<string | null>(null);
  const [refundNote, setRefundNote] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);
  const [copiedAccountNumber, setCopiedAccountNumber] = useState(false);

  const handleRefundFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRefundSlipFile(file);
      const reader = new FileReader();
      reader.onload = () => setRefundSlipPreview(typeof reader.result === 'string' ? reader.result : null);
      reader.readAsDataURL(file);
    }
  };

  const handleCopyAccount = (accNum: string) => {
    if (!accNum) return;
    navigator.clipboard.writeText(accNum);
    setCopiedAccountNumber(true);
    setTimeout(() => setCopiedAccountNumber(false), 2000);
  };

  const handleApproveRefundSubmit = async () => {
    if (!selectedPayment?.booking_id) return;

    try {
      setIsRefunding(true);
      const formPayload = new FormData();
      formPayload.append('_method', 'PUT');
      if (refundSlipFile) {
        formPayload.append('refund_slip_file', refundSlipFile);
        formPayload.append('refund_slip', refundSlipFile);
      }
      if (refundNote) {
        formPayload.append('note', refundNote);
      }

      const response = await fetch(`/api/v1/bookings/${selectedPayment.booking_id}/approve-refund`, {
        method: 'POST',
        body: formPayload,
      });

      const payload = await response.json();
      if (!response.ok || !payload.status) {
        throw new Error(payload.message || 'ไม่สามารถอนุมัติการคืนเงินได้');
      }

      setSuccessMessage(`อนุมัติการโอนคืนเงินสำหรับล็อก ${selectedPayment.booking?.stall?.stall_number || ''} เรียบร้อยแล้ว`);
      setSelectedPayment(null);
      setRefundSlipFile(null);
      setRefundSlipPreview(null);
      setRefundNote('');
      void loadPayments();
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการอนุมัติคืนเงิน');
    } finally {
      setIsRefunding(false);
    }
  };

  const handleApproveBooking = async () => {
    if (!selectedPayment?.booking_id) return;
    try {
      setIsRefunding(true);
      const response = await fetch(`/api/v1/bookings/${selectedPayment.booking_id}/approve`, {
        method: 'PUT',
      });
      const payload = await response.json();
      if (!response.ok || !payload.status) {
        throw new Error(payload.message || 'ไม่สามารถอนุมัติรายการชำระเงินได้');
      }
      setSuccessMessage(`อนุมัติการชำระเงินสำหรับล็อก ${selectedPayment.booking?.stall?.stall_number || ''} เรียบร้อยแล้ว`);
      setSelectedPayment(null);
      void loadPayments();
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการอนุมัติรายการ');
    } finally {
      setIsRefunding(false);
    }
  };

  const handleRejectBooking = async () => {
    if (!selectedPayment?.booking_id) return;
    try {
      setIsRefunding(true);
      const response = await fetch(`/api/v1/bookings/${selectedPayment.booking_id}/reject`, {
        method: 'PUT',
      });
      const payload = await response.json();
      if (!response.ok || !payload.status) {
        throw new Error(payload.message || 'ไม่สามารถปฏิเสธรายการได้');
      }
      setSuccessMessage(`ปฏิเสธรายการชำระเงินสำหรับล็อก ${selectedPayment.booking?.stall?.stall_number || ''} เรียบร้อยแล้ว`);
      setSelectedPayment(null);
      void loadPayments();
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการปฏิเสธรายการ');
    } finally {
      setIsRefunding(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, search]);

  const filteredAndSortedPayments = useMemo(() => {
    let list = [...payments];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => {
        const username = (p.booking?.user?.username || '').toLowerCase();
        const stallNum = (p.booking?.stall?.stall_number || '').toLowerCase();
        const amount = String(p.amount || '');
        return username.includes(q) || stallNum.includes(q) || amount.includes(q);
      });
    }

    if (statusFilter !== 'all') {
      list = list.filter((p) => p.status === statusFilter);
    }

    const statusPriority: Record<string, number> = {
      pending: 1,
      refund_requested: 2,
      refunded: 3,
      verified: 4,
      success: 4,
    };

    list.sort((a, b) => {
      const priorityA = statusPriority[a.status] || 99;
      const priorityB = statusPriority[b.status] || 99;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      const dateA = a.payment_date ? new Date(a.payment_date).getTime() : 0;
      const dateB = b.payment_date ? new Date(b.payment_date).getTime() : 0;
      return dateB - dateA;
    });

    return list;
  }, [payments, statusFilter, search]);

  const totalPages = Math.ceil(filteredAndSortedPayments.length / itemsPerPage);
  const activePage = Math.min(currentPage, Math.max(totalPages, 1));
  const paginatedPayments = useMemo(() => {
    const startIndex = (activePage - 1) * itemsPerPage;
    return filteredAndSortedPayments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedPayments, activePage, itemsPerPage]);

  const loadPayments = async () => {
    try {
      const response = await fetch('/api/v1/payments');
      if (!response.ok) throw new Error('Unable to load payments');
      const payload = await response.json();
      setPayments(payload.data || []);
    } catch {
      setPayments([]);
    }
  };

  useEffect(() => {
    void loadSettings();
    void loadPayments();
  }, []);

  const handleSaveClick = () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsConfirmModalOpen(true);
  };

  const handleConfirmSave = async () => {
    try {
      setIsSaving(true);
      setIsConfirmModalOpen(false);

      const formPayload = new FormData();
      formPayload.append('account_name', formData.accountName);
      formPayload.append('account_number', formData.accountNumber);
      if (selectedFile) {
        formPayload.append('qr_code', selectedFile);
      }

      const response = await fetch('/api/admin/market-payment-settings', {
        method: 'POST',
        body: formPayload,
      });

      const payload = (await response.json()) as PaymentSettingsResponse;
      if (!response.ok || !payload.status) {
        throw new Error(payload.message || 'Unable to save payment settings');
      }

      setSuccessMessage('บันทึกข้อมูลบัญชีและ QR Code สำเร็จแล้ว');
      setErrorMessage('');
      setSelectedFileName('');
      setSelectedFile(null);
      setQrCodePreview(payload.data?.qr_code_path ?? null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveQrCode = async () => {
    try {
      setIsSaving(true);
      const formPayload = new FormData();
      formPayload.append('account_name', formData.accountName);
      formPayload.append('account_number', formData.accountNumber);
      formPayload.append('remove_qr_code', '1');

      const response = await fetch('/api/admin/market-payment-settings', {
        method: 'POST',
        body: formPayload,
      });

      const payload = (await response.json()) as PaymentSettingsResponse;
      if (!response.ok || !payload.status) {
        throw new Error(payload.message || 'Unable to remove QR code');
      }

      setQrCodePreview(null);
      setSuccessMessage('ลบ QR Code สำเร็จแล้ว');
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบ QR Code');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setSelectedFileName('');
    setSelectedFile(null);
    setSuccessMessage('');
    setErrorMessage('');
    setIsConfirmModalOpen(false);
    void loadSettings();
  };

  const summaryStats = useMemo(() => {
    const total = payments.length;
    const pending = payments.filter((p) => p.status === 'pending').length;
    const refundRequested = payments.filter((p) => p.status === 'refund_requested').length;
    const refunded = payments.filter((p) => p.status === 'refunded').length;
    const verified = payments.filter((p) => p.status === 'verified' || p.status === 'success').length;
    return { total, pending, refundRequested, refunded, verified };
  }, [payments]);

  return (
    <div className="space-y-8 pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-600/10 text-sky-600">
              <CreditCard className="h-4 w-4" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">การชำระเงิน</h1>
          </div>
          <p className="mt-1.5 text-sm font-medium text-slate-500">
            ระบบบริหารจัดการประวัติการชำระเงินของแผงค้า และการตั้งค่า QR Code รับชำระเงิน
          </p>
        </div>
      </div>

      {(successMessage || errorMessage) && (
        <div className={`rounded-2xl border p-4 text-sm font-semibold shadow-xs animate-in fade-in duration-200 ${
          errorMessage
            ? 'border-red-200 bg-red-50/90 text-red-800'
            : 'border-emerald-200 bg-emerald-50/90 text-emerald-800'
        }`}>
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 flex-shrink-0" />
            <span>{errorMessage || successMessage}</span>
          </div>
        </div>
      )}

      {/* ── QR Code & Account Settings Section ── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Current QR Code Preview Card */}
        <div className="xl:col-span-5 flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs transition hover:shadow-md">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">QR Code สำหรับรับเงิน</h2>
                <p className="mt-0.5 text-xs text-slate-500">ภาพ QR Code ที่แสดงบนแอปพลิเคชันสำหรับผู้ซื้อ</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200/60 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                กำลังใช้งาน
              </span>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
              <div className="mx-auto flex max-w-[240px] flex-col items-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                {isLoading ? (
                  <div className="flex h-48 w-48 items-center justify-center text-xs text-slate-400">
                    กำลังโหลดข้อมูล...
                  </div>
                ) : qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="QR Code payment" className="h-48 w-48 rounded-xl object-contain" />
                ) : (
                  <div className="flex h-48 w-48 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-xs font-medium text-slate-400">
                    ยังไม่มี QR Code
                  </div>
                )}
                <div className="mt-3 w-full border-t border-slate-100 pt-3 text-center">
                  <p className="text-sm font-bold text-slate-900">{formData.accountName || 'ยังไม่ได้ระบุชื่อบัญชี'}</p>
                  <p className="mt-0.5 text-xs font-mono font-medium text-slate-500">{formData.accountNumber || 'ยังไม่ได้ระบุเลขบัญชี'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-400">รองรับ PromptPay ทุกธนาคาร</p>
            <button
              onClick={handleRemoveQrCode}
              disabled={isSaving || !qrCodePreview}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/50 px-3.5 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 size={14} />
              {isSaving ? 'กำลังลบ...' : 'ลบ QR Code'}
            </button>
          </div>
        </div>

        {/* Upload & Info Settings Card */}
        <div className="xl:col-span-7 flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs transition hover:shadow-md">
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">อัปโหลด QR Code & บัญชีรับเงิน</h2>
              <p className="mt-0.5 text-xs text-slate-500">อัปเดตข้อมูลภาพ QR Code และเลขบัญชีที่ใช้ในการรับชำระเงินค่าจองแผงค้า</p>
            </div>

            <label className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50/40 p-6 text-center transition hover:border-sky-400 hover:bg-sky-50/80">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 transition group-hover:scale-110">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="text-xs font-bold text-slate-800">ลากไฟล์มาวางที่นี่ หรือ <span className="text-sky-600 underline">คลิกเพื่อเลือกรูปภาพ</span></p>
              <p className="mt-1 text-[11px] text-slate-400">รองรับภาพ PNG, JPG, JPEG (ขนาดไม่เกิน 5MB)</p>
              <input type="file" accept="image/png,image/jpeg" className="sr-only" onChange={handleFileChange} />
            </label>

            {selectedFileName && (
              <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2 text-xs font-semibold text-sky-800">
                <FileText className="h-4 w-4 text-sky-600" />
                <span>ไฟล์ที่เลือก: {selectedFileName}</span>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">ชื่อบัญชีผู้รับเงิน</label>
                <input
                  type="text"
                  value={formData.accountName}
                  onChange={(event) => handleInputChange('accountName', event.target.value)}
                  placeholder="เช่น ตลาดนัดกาดหน้ามอ"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">เลขบัญชี / PromptPay</label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(event) => handleInputChange('accountNumber', event.target.value)}
                  placeholder="เช่น 081-xxx-xxxx หรือ 123-x-xxxxx-x"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSaveClick}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-sky-700 active:scale-95 disabled:opacity-40"
            >
              <Save size={15} />
              {isSaving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal (Portaled to body for 100% backdrop blur) */}
      {isConfirmModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
              <h3 className="text-lg font-bold text-slate-900">ยืนยันการบันทึกข้อมูลบัญชีและ QR Code?</h3>
              <p className="mt-2 text-xs leading-5 text-slate-600">
                คุณต้องการบันทึกการเปลี่ยนแปลงข้อมูลบัญชีและรูปภาพ QR Code รับชำระเงินนี้ใช่หรือไม่?
              </p>

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleConfirmSave}
                  disabled={isSaving}
                  className="rounded-xl bg-sky-600 px-5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-sky-700 disabled:opacity-40"
                >
                  {isSaving ? 'กำลังบันทึก...' : 'ยืนยันการบันทึก'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ── Summary KPI Overview Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* 1. All */}
        <div
          onClick={() => setStatusFilter('all')}
          className={`group cursor-pointer rounded-3xl border p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
            statusFilter === 'all'
              ? 'border-sky-400 bg-white ring-2 ring-sky-400/30 shadow-md'
              : 'border-slate-200/80 bg-white hover:border-sky-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ทั้งหมด</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <Inbox className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-3xl font-black text-slate-900 tracking-tight">{summaryStats.total}</p>
            <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md">รายการ</span>
          </div>
        </div>

        {/* 2. Pending */}
        <div
          onClick={() => setStatusFilter('pending')}
          className={`group cursor-pointer rounded-3xl border p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
            statusFilter === 'pending'
              ? 'border-amber-400 bg-white ring-2 ring-amber-400/30 shadow-md'
              : 'border-slate-200/80 bg-white hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">รอตรวจสอบ</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-3xl font-black text-amber-700 tracking-tight">{summaryStats.pending}</p>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">ต้องตรวจสอบ</span>
          </div>
        </div>

        {/* 3. Refund Requested */}
        <div
          onClick={() => setStatusFilter('refund_requested')}
          className={`group cursor-pointer rounded-3xl border p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
            statusFilter === 'refund_requested'
              ? 'border-purple-400 bg-white ring-2 ring-purple-400/30 shadow-md'
              : 'border-slate-200/80 bg-white hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">ขอคืนเงิน</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-3xl font-black text-purple-700 tracking-tight">{summaryStats.refundRequested}</p>
            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">คำร้องขอคืนเงิน</span>
          </div>
        </div>

        {/* 4. Refunded */}
        <div
          onClick={() => setStatusFilter('refunded')}
          className={`group cursor-pointer rounded-3xl border p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
            statusFilter === 'refunded'
              ? 'border-blue-400 bg-white ring-2 ring-blue-400/30 shadow-md'
              : 'border-slate-200/80 bg-white hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">คืนเงินแล้ว</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-3xl font-black text-blue-700 tracking-tight">{summaryStats.refunded}</p>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">คืนเงินเรียบร้อย</span>
          </div>
        </div>

        {/* 5. Verified Success (Last) */}
        <div
          onClick={() => setStatusFilter('verified')}
          className={`group cursor-pointer rounded-3xl border p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
            statusFilter === 'verified'
              ? 'border-emerald-400 bg-white ring-2 ring-emerald-400/30 shadow-md'
              : 'border-slate-200/80 bg-white hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">สำเร็จ</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-3xl font-black text-emerald-700 tracking-tight">{summaryStats.verified}</p>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">อนุมัติสำเร็จ</span>
          </div>
        </div>
      </div>

      {/* ── Payment History Table Section ── */}
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-xs overflow-hidden transition-all">
        {/* Table Header Controls */}
        <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900">ประวัติการชำระเงิน</h2>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              แสดงรายการชำระเงิน (สูงสุด {itemsPerPage} คนต่อหน้า)
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search Bar */}
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อผู้ค้า, ล็อก..."
                className="w-full sm:w-64 rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs font-semibold text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-2xs"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">กรองสถานะ:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 outline-none transition focus:border-sky-500 cursor-pointer shadow-2xs"
              >
                <option value="all">ทั้งหมด</option>
                <option value="pending">รอตรวจสอบ</option>
                <option value="verified">สำเร็จ</option>
                <option value="refund_requested">ขอคืนเงิน</option>
                <option value="refunded">คืนเงินแล้ว</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stable Min-Height Container */}
        <div className="min-h-[400px] overflow-x-auto flex flex-col justify-between">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/40 text-[11px] font-black uppercase tracking-wider text-slate-400">
                <th className="px-6 py-3.5">วันที่ / เวลา</th>
                <th className="px-6 py-3.5">ผู้ค้า / แผงค้า</th>
                <th className="px-6 py-3.5">จำนวนเงิน</th>
                <th className="px-6 py-3.5">สถานะ</th>
                <th className="px-6 py-3.5 text-center">การกระทำ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center text-xs font-semibold text-slate-400">
                    ไม่พบรายการชำระเงินตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((txn) => {
                  const paymentDateStr = txn.payment_date
                    ? new Date(txn.payment_date).toLocaleString('th-TH', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '-';
                  const tenantName = txn.booking?.user?.username || 'ไม่ระบุ';
                  const stallNum = txn.booking?.stall?.stall_number || '-';
                  const initialChar = tenantName.charAt(0).toUpperCase();

                  return (
                    <tr key={txn.payment_id} className="transition-colors hover:bg-slate-50/80">
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-600">
                        {paymentDateStr}
                      </td>

                      {/* Tenant & Stall Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-xs font-black text-slate-700 shadow-2xs border border-slate-200/60">
                            {initialChar}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{tenantName}</div>
                            <span className="inline-flex items-center rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-extrabold text-sky-700 border border-sky-200/60 mt-0.5">
                              ล็อก {stallNum}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Amount Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono font-black text-slate-900 text-sm">
                          ฿{(txn.amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Status Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {txn.status === 'verified' || txn.status === 'success' ? (
                          <span
                            onClick={() => txn.booking_id && navigate(`/verifications?booking_id=${txn.booking_id}`)}
                            title="คลิกเพื่อดูรายละเอียดใบจองนี้"
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 shadow-2xs"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            สำเร็จ
                          </span>
                        ) : txn.status === 'refund_requested' ? (
                          <span
                            onClick={() => txn.booking_id && navigate(`/verifications?booking_id=${txn.booking_id}`)}
                            title="คลิกเพื่อดูรายละเอียดใบจองนี้"
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-purple-50 border border-purple-200 px-3 py-1 text-xs font-bold text-purple-700 transition hover:bg-purple-100 shadow-2xs"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
                            ขอคืนเงิน
                          </span>
                        ) : txn.status === 'refunded' ? (
                          <span
                            onClick={() => txn.booking_id && navigate(`/verifications?booking_id=${txn.booking_id}`)}
                            title="คลิกเพื่อดูรายละเอียดใบจองนี้"
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-sky-50 border border-sky-200 px-3 py-1 text-xs font-bold text-sky-700 transition hover:bg-sky-100 shadow-2xs"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                            คืนเงินแล้ว
                          </span>
                        ) : (
                          <span
                            onClick={() => txn.booking_id && navigate(`/verifications?booking_id=${txn.booking_id}`)}
                            title="คลิกเพื่อดูรายละเอียดใบจองนี้"
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-700 transition hover:bg-amber-100 shadow-2xs"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                            รอตรวจสอบ
                          </span>
                        )}
                      </td>

                      {/* Action Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => setSelectedPayment(txn)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 border border-sky-200/80 transition hover:bg-sky-600 hover:text-white shadow-2xs"
                        >
                          <Eye size={15} />
                          <span>ตรวจสอบ</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredAndSortedPayments.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between text-xs font-semibold text-slate-600">
            <div>
              แสดง <span className="text-slate-900 font-bold">{Math.min((activePage - 1) * itemsPerPage + 1, filteredAndSortedPayments.length)}</span> - <span className="text-slate-900 font-bold">{Math.min(activePage * itemsPerPage, filteredAndSortedPayments.length)}</span> จากทั้งหมด <span className="text-slate-900 font-bold">{filteredAndSortedPayments.length}</span> รายการ
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={activePage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 shadow-2xs"
                title="หน้าก่อนหน้า"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`flex h-8 w-8 items-center justify-center rounded-xl border text-xs font-bold transition shadow-2xs ${
                    activePage === pageNum
                      ? 'border-sky-600 bg-sky-600 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={activePage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 shadow-2xs"
                title="หน้าถัดไป"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Payment Detail Modal (Portaled to body for 100% backdrop blur) ── */}
      {selectedPayment &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/75 p-4 sm:p-6 md:p-8 backdrop-blur-md flex items-center justify-center"
            onClick={() => setSelectedPayment(null)}
          >
            <div
              className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in duration-150 border border-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-400/30">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight text-white">รายละเอียดการชำระเงิน #{selectedPayment.payment_id}</h3>
                    <p className="text-xs font-medium text-slate-300">ข้อมูลผู้ชำระเงิน ล็อกที่จอง และระบบโอนเงินคืนออนไลน์</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
                >
                  <XCircle className="h-7 w-7" />
                </button>
              </div>

              {/* Body Content */}
              <div className="max-h-[82vh] overflow-y-auto p-6 sm:p-7">
                <div className="flex flex-col lg:flex-row gap-7">
                  {/* Left Column: Tenant Info & Original Slip */}
                  <div className="w-full lg:w-96 shrink-0 space-y-5 border-b lg:border-b-0 lg:border-r border-slate-200/80 pr-0 lg:pr-7 pb-6 lg:pb-0">
                    <div>
                      <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <User className="h-4.5 w-4.5 text-sky-600" /> ข้อมูลผู้ชำระเงิน & ล็อก
                      </h4>

                      <div className="space-y-3 rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 text-sm font-semibold text-slate-800 shadow-2xs">
                        <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                          <span className="text-xs font-bold text-slate-500">ผู้ค้า / ผู้เช่า:</span>
                          <span className="text-sm font-extrabold text-slate-900">{selectedPayment.booking?.user?.username || 'ไม่ระบุ'}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                          <span className="text-xs font-bold text-slate-500">เบอร์โทรศัพท์:</span>
                          <span className="text-sm font-extrabold text-slate-900">{selectedPayment.booking?.user?.phone || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                          <span className="text-xs font-bold text-slate-500">หมายเลขล็อก:</span>
                          <span className="text-sm font-black text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-200">
                            ล็อก {selectedPayment.booking?.stall?.stall_number || '-'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                          <span className="text-xs font-bold text-slate-500">ขนาดแผงค้า:</span>
                          <span className="text-sm font-bold text-slate-800">{selectedPayment.booking?.stall?.size || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                          <span className="text-xs font-bold text-slate-500">ยอดเงินที่ชำระ:</span>
                          <span className="font-mono font-black text-emerald-600 text-base">
                            ฿{(selectedPayment.amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-xs font-bold text-slate-500">สถานะปัจจุบัน:</span>
                          {selectedPayment.status === 'verified' || selectedPayment.status === 'success' ? (
                            <span className="rounded-full bg-emerald-100 border border-emerald-300 px-3 py-1 text-xs font-black text-emerald-800">อนุมัติสำเร็จ</span>
                          ) : selectedPayment.status === 'refund_requested' ? (
                            <span className="rounded-full bg-purple-100 border border-purple-300 px-3 py-1 text-xs font-black text-purple-800">ขอคืนเงิน</span>
                          ) : selectedPayment.status === 'refunded' ? (
                            <span className="rounded-full bg-sky-100 border border-sky-300 px-3 py-1 text-xs font-black text-sky-800">คืนเงินแล้ว</span>
                          ) : (
                            <span className="rounded-full bg-amber-100 border border-amber-300 px-3 py-1 text-xs font-black text-amber-800">รอตรวจสอบ</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Original Payment Slip */}
                    <div>
                      <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <FileText className="h-4.5 w-4.5 text-sky-600" /> สลิปชำระเงินเดิม
                      </h4>
                      <div className="flex items-center justify-center rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3 text-center shadow-2xs">
                        {selectedPayment.payment_slip && !slipImageError[selectedPayment.payment_slip] ? (
                          <div
                            onClick={() => setSelectedSlip(formatImageUrl(selectedPayment.payment_slip) || null)}
                            className="group relative block w-full cursor-pointer"
                          >
                            <img
                              src={formatImageUrl(selectedPayment.payment_slip)}
                              alt="Payment Slip"
                              onError={() => setSlipImageError((prev) => ({ ...prev, [selectedPayment.payment_slip]: true }))}
                              className="mx-auto max-h-52 rounded-xl object-contain shadow-xs transition group-hover:scale-102"
                            />
                            <span className="mt-2 block text-xs font-extrabold text-sky-600 underline">คลิกขยายสลิปขนาดใหญ่</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400 py-4">
                            <ImageOff className="h-7 w-7 mb-1 stroke-1" />
                            <span className="text-xs font-semibold">ไม่มีสลิปชำระเงินแนบมา</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Dynamic Status Dashboard & Online Transfer Portal */}
                  <div className="flex-1 min-w-0 space-y-5">
                    {/* 1. Pending Status Panel */}
                    {(selectedPayment.status === 'pending' || selectedPayment.status === 'pending_review') && (
                      <div className="space-y-4 rounded-3xl border border-amber-200 bg-gradient-to-b from-amber-50/80 to-amber-100/30 p-5 sm:p-6 shadow-xs">
                        <div className="flex items-center justify-between border-b border-amber-200/60 pb-3.5">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white shadow-2xs">
                              <Clock className="h-4.5 w-4.5" />
                            </span>
                            <div>
                              <h4 className="text-sm font-black text-amber-950 uppercase tracking-wider">ตรวจสอบ & อนุมัติรายการ (Payment Audit)</h4>
                              <p className="text-xs font-medium text-amber-700">ตรวจสอบความถูกต้องของสลิปชำระเงินและกดยืนยันการชำระเงิน</p>
                            </div>
                          </div>
                        </div>

                        {/* Audit Verification Card */}
                        <div className="space-y-4 bg-white p-5 rounded-2xl border border-amber-200/80 shadow-2xs text-sm">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <span className="text-slate-600 font-bold text-xs">ยอดเงินชำระที่ต้องตรวจสอบ:</span>
                            <span className="font-mono font-black text-amber-800 text-base">
                              ฿{(selectedPayment.amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                            </span>
                          </div>

                          <div className="rounded-xl bg-amber-50/80 p-3.5 border border-amber-200/60 text-xs text-amber-900 space-y-2 font-medium">
                            <p className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                              <Info className="h-4 w-4 text-amber-600" /> คำแนะนำการตรวจสอบสำหรับแอดมิน:
                            </p>
                            <ul className="list-disc list-inside space-y-1 pl-1 text-xs font-semibold">
                              <li>ตรวจสอบยอดเงินโอนบนสลิปฝั่งซ้ายว่าตรงกับ <strong>฿{(selectedPayment.amount || 0).toLocaleString()}</strong></li>
                              <li>ตรวจสอบชื่อบัญชีปลายทางและเวลาโอนเงินบนสลิป</li>
                            </ul>
                          </div>

                          <div className="pt-2 flex flex-col sm:flex-row gap-3">
                            <button
                              onClick={handleApproveBooking}
                              disabled={isRefunding}
                              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 px-5 text-sm font-extrabold text-white shadow-md transition hover:from-emerald-700 hover:to-teal-700 active:scale-98 disabled:opacity-40 cursor-pointer"
                            >
                              <CheckCircle2 className="h-5 w-5" />
                              {isRefunding ? 'กำลังบันทึก...' : 'อนุมัติการชำระเงิน'}
                            </button>
                            <button
                              onClick={handleRejectBooking}
                              disabled={isRefunding}
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-40 cursor-pointer"
                            >
                              <XCircle className="h-5 w-5" />
                              ปฏิเสธรายการ
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2. Verified / Success Status Panel */}
                    {(selectedPayment.status === 'verified' || selectedPayment.status === 'success') && (
                      <div className="space-y-4 rounded-3xl border border-emerald-200 bg-gradient-to-b from-emerald-50/80 to-teal-100/30 p-5 sm:p-6 shadow-xs">
                        <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3.5">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-2xs">
                              <CheckCircle2 className="h-4.5 w-4.5" />
                            </span>
                            <div>
                              <h4 className="text-sm font-black text-emerald-950 uppercase tracking-wider">เอกสารยืนยันชำระเงินสำเร็จ (Verified Receipt)</h4>
                              <p className="text-xs font-medium text-emerald-700">รายการนี้ได้รับการตรวจสอบและอนุมัติเข้าสู่ระบบอย่างเป็นทางการแล้ว</p>
                            </div>
                          </div>
                        </div>

                        {/* Verified Card */}
                        <div className="space-y-4 bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-2xs text-sm font-medium text-slate-700">
                          <div className="flex items-center gap-3 rounded-xl bg-emerald-50/90 p-4 border border-emerald-200 text-emerald-900 font-bold">
                            <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                            <div>
                              <p className="text-sm font-extrabold text-emerald-950">อนุมัติการชำระเงินเรียบร้อยแล้ว</p>
                              <p className="text-xs font-semibold text-emerald-700">ระบบได้ทำเครื่องหมายจองล็อกสำเร็จเรียบร้อยแล้ว</p>
                            </div>
                          </div>

                          <div className="space-y-3 pt-1 text-sm font-semibold">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                              <span className="text-slate-500 font-medium text-xs">รหัสทำรายการ (Payment ID):</span>
                              <span className="font-mono font-extrabold text-slate-900 text-sm">#PAY-{selectedPayment.payment_id}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                              <span className="text-slate-500 font-medium text-xs">วันที่ทำรายการ:</span>
                              <span className="font-bold text-slate-900 text-sm">
                                {selectedPayment.payment_date ? new Date(selectedPayment.payment_date).toLocaleString('th-TH') : '-'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pb-1">
                              <span className="text-slate-500 font-medium text-xs">สถานะการตรวจสอบ:</span>
                              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> สมบูรณ์ (Verified)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. Refund Requested Portal */}
                    {selectedPayment.status === 'refund_requested' && (
                      <div className="space-y-4 rounded-3xl border border-purple-200 bg-gradient-to-b from-purple-50/80 to-purple-100/40 p-5 sm:p-6 shadow-xs">
                        <div className="flex items-center justify-between border-b border-purple-200/60 pb-3.5">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600 text-white shadow-2xs">
                              <Receipt className="h-4.5 w-4.5" />
                            </span>
                            <div>
                              <h4 className="text-sm font-black text-purple-950 uppercase tracking-wider">โอนเงินคืนออนไลน์ (Online Refund)</h4>
                              <p className="text-xs font-medium text-purple-700">สแกน QR Code หรือคัดลอกเลขบัญชีเพื่อโอนคืนผ่าน Mobile Banking</p>
                            </div>
                          </div>
                        </div>

                        {/* PromptPay QR Code & Account Copy Box */}
                        <div className="grid gap-4 sm:grid-cols-12 bg-white p-5 rounded-2xl border border-purple-200/80 shadow-2xs">
                          {/* PromptPay QR Generator */}
                          <div className="sm:col-span-5 flex flex-col items-center justify-center border-r-0 sm:border-r border-purple-100 pr-0 sm:pr-5 pb-3 sm:pb-0">
                            <div className="relative group p-2.5 bg-slate-900 rounded-2xl shadow-md border border-purple-300">
                              {selectedPayment.refund_account_number ? (
                                <img
                                  src={`https://promptpay.io/${selectedPayment.refund_account_number.replace(/[^0-9]/g, '')}/${selectedPayment.amount}.png`}
                                  alt="PromptPay QR"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedPayment.refund_account_number)}`;
                                  }}
                                  className="h-32 w-32 rounded-xl object-contain bg-white p-1"
                                />
                              ) : (
                                <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-400">
                                  <QrCode className="h-10 w-10" />
                                </div>
                              )}
                            </div>
                            <span className="mt-2.5 text-xs font-extrabold text-purple-950 flex items-center gap-1">
                              <QrCode className="h-4 w-4 text-purple-600" /> สแกนจ่ายด้วย PromptPay
                            </span>
                          </div>

                          {/* Bank Details & Copy */}
                          <div className="sm:col-span-7 flex flex-col justify-between space-y-3 text-sm text-slate-700">
                            <div>
                              <span className="text-xs font-bold text-slate-400 block">ธนาคารปลายทาง:</span>
                              <p className="font-black text-slate-900 text-base">{selectedPayment.refund_bank_name || 'ไม่ระบุ'}</p>
                            </div>

                            <div>
                              <span className="text-xs font-bold text-slate-400 block">ชื่อบัญชีผู้รับเงิน:</span>
                              <p className="font-extrabold text-purple-950 text-sm">{selectedPayment.refund_account_name || 'ไม่ระบุ'}</p>
                            </div>

                            <div>
                              <span className="text-xs font-bold text-slate-400 block">เลขที่บัญชี:</span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="font-mono font-black text-slate-900 text-base bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                                  {selectedPayment.refund_account_number || '-'}
                                </span>
                                <button
                                  onClick={() => handleCopyAccount(selectedPayment.refund_account_number)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition shadow-2xs cursor-pointer ${
                                    copiedAccountNumber
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                                  }`}
                                >
                                  {copiedAccountNumber ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                  {copiedAccountNumber ? 'คัดลอกแล้ว' : 'คัดลอก'}
                                </button>
                              </div>
                            </div>

                            <div>
                              <span className="text-xs font-bold text-slate-400 block">ยอดเงินโอนคืน:</span>
                              <span className="font-mono font-black text-purple-700 text-lg">
                                ฿{(selectedPayment.amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                              </span>
                            </div>

                            {selectedPayment.refund_reason && (
                              <div className="pt-1">
                                <span className="text-xs font-bold text-slate-400 block">เหตุผลการขอคืนเงิน:</span>
                                <p className="rounded-xl bg-purple-50/90 p-2.5 text-xs text-purple-950 font-semibold border border-purple-200/70 mt-1">
                                  {selectedPayment.refund_reason}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Admin Proof Upload & Confirmation */}
                        <div className="space-y-3.5 bg-white p-5 rounded-2xl border border-purple-200/80 shadow-2xs">
                          <label className="block text-xs font-black text-purple-950">
                            แนบสลิปการโอนคืนเงิน (Refund Slip) <span className="text-purple-600 font-medium">(เพื่อเป็นหลักฐานอ้างอิงอย่างเป็นทางการ)</span>
                          </label>

                          <div className="flex items-center gap-3">
                            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-purple-300 bg-purple-50 px-4 py-2.5 text-xs font-extrabold text-purple-800 transition hover:bg-purple-100">
                              <UploadCloud className="h-4.5 w-4.5 text-purple-600" />
                              <span>{refundSlipFile ? refundSlipFile.name : 'เลือกไฟล์สลิป...'}</span>
                              <input type="file" accept="image/*" className="sr-only" onChange={handleRefundFileChange} />
                            </label>

                            {refundSlipPreview && (
                              <div
                                onClick={() => setSelectedSlip(refundSlipPreview)}
                                className="relative h-11 w-11 cursor-pointer overflow-hidden rounded-xl border border-purple-300 shadow-2xs"
                              >
                                <img src={refundSlipPreview} alt="Preview" className="h-full w-full object-cover" />
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">หมายเหตุเพิ่มเติม (ถ้ามี)</label>
                            <input
                              type="text"
                              value={refundNote}
                              onChange={(e) => setRefundNote(e.target.value)}
                              placeholder="เช่น โอนคืนผ่าน K-Bank เรียบร้อยแล้ว..."
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-purple-500 focus:bg-white"
                            />
                          </div>

                          <button
                            onClick={handleApproveRefundSubmit}
                            disabled={isRefunding}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 py-3 text-sm font-extrabold text-white shadow-md transition hover:from-purple-800 hover:to-indigo-800 active:scale-98 disabled:opacity-40 cursor-pointer"
                          >
                            <CheckCircle2 className="h-5 w-5" />
                            {isRefunding ? 'กำลังอนุมัติคืนเงิน...' : 'ยืนยันอนุมัติการโอนคืนเงินสำเร็จ'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 4. Section for Completed Refunds (status === refunded) */}
                    {selectedPayment.status === 'refunded' && (
                      <div className="space-y-4 rounded-3xl border border-sky-200 bg-sky-50/60 p-5 sm:p-6 shadow-xs">
                        <div className="flex items-center justify-between border-b border-sky-200/70 pb-3">
                          <h4 className="text-sm font-black text-sky-950 uppercase tracking-wider flex items-center gap-2">
                            <CheckCircle2 className="h-4.5 w-4.5 text-sky-600" /> เอกสารการโอนคืนเงินสำเร็จ
                          </h4>
                          <span className="rounded-full bg-sky-100 border border-sky-300 px-3 py-1 text-xs font-black text-sky-800">
                            คืนเงินแล้ว
                          </span>
                        </div>
                        <div className="space-y-3 text-sm font-semibold text-sky-950">
                          <div className="flex justify-between border-b border-sky-200/50 pb-1.5">
                            <span className="text-xs font-bold text-sky-700">ธนาคาร:</span>
                            <span className="text-sm font-extrabold text-slate-900">{selectedPayment.refund_bank_name || '-'}</span>
                          </div>
                          <div className="flex justify-between border-b border-sky-200/50 pb-1.5">
                            <span className="text-xs font-bold text-sky-700">เลขที่บัญชี:</span>
                            <span className="font-mono text-sm font-black text-slate-900">{selectedPayment.refund_account_number || '-'}</span>
                          </div>
                          <div className="flex justify-between border-b border-sky-200/50 pb-1.5">
                            <span className="text-xs font-bold text-sky-700">ชื่อบัญชี:</span>
                            <span className="text-sm font-extrabold text-slate-900">{selectedPayment.refund_account_name || '-'}</span>
                          </div>
                          {selectedPayment.refunded_at && (
                            <div className="flex justify-between border-b border-sky-200/50 pb-1.5">
                              <span className="text-xs font-bold text-sky-700">วันที่โอนคืน:</span>
                              <span className="text-sm font-bold text-slate-900">
                                {new Date(selectedPayment.refunded_at).toLocaleString('th-TH')}
                              </span>
                            </div>
                          )}
                          {(selectedPayment.remark || selectedPayment.refund_reason) && (
                            <div className="flex justify-between border-b border-sky-200/50 pb-1.5">
                              <span className="text-xs font-bold text-sky-700">หมายเหตุเพิ่มเติม:</span>
                              <span className="text-sm font-extrabold text-sky-950">{selectedPayment.remark || selectedPayment.refund_reason}</span>
                            </div>
                          )}
                          {selectedPayment.refund_slip && (
                            <div className="pt-2">
                              <span className="text-xs font-black text-sky-800 block mb-2">สลิปหลักฐานการโอนคืนเงิน:</span>
                              {slipImageError[selectedPayment.refund_slip] ? (
                                <div className="flex items-center justify-center p-3.5 bg-white rounded-xl border border-sky-200 text-xs font-bold text-sky-400">
                                  ไม่พบสลิปการโอนคืนเงิน
                                </div>
                              ) : (
                                <div
                                  onClick={() => setSelectedSlip(formatImageUrl(selectedPayment.refund_slip) || null)}
                                  className="block cursor-pointer text-center bg-white p-3 rounded-2xl border border-sky-200 hover:border-sky-300 transition shadow-2xs"
                                >
                                  <img
                                    src={formatImageUrl(selectedPayment.refund_slip)}
                                    alt="Refund Slip"
                                    onError={() => setSlipImageError((prev) => ({ ...prev, [selectedPayment.refund_slip]: true }))}
                                    className="mx-auto max-h-40 object-contain rounded-xl shadow-xs"
                                  />
                                  <span className="text-xs font-extrabold text-sky-700 mt-2 block underline">ดูสลิปโอนคืนเงินขนาดใหญ่</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 bg-slate-50 px-6 py-4 gap-3">
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                >
                  ปิดหน้าต่าง
                </button>
                {selectedPayment.booking_id && (
                  <button
                    onClick={() => {
                      const bookingId = selectedPayment.booking_id;
                      setSelectedPayment(null);
                      navigate(`/verifications?booking_id=${bookingId}`);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-sky-700 shadow-sm"
                  >
                    <ExternalLink size={15} /> ดูรายละเอียดใบจองในหน้ารายการจอง
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ── Enlarged Image Lightbox Modal (Portaled to body) ── */}
      {selectedSlip &&
        createPortal(
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md animate-in fade-in duration-150"
            onClick={() => setSelectedSlip(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl bg-slate-950 p-2 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setSelectedSlip(null)}
                className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/80 text-white hover:bg-slate-800 transition"
                title="ปิด"
              >
                <XCircle className="h-6 w-6" />
              </button>
              <img src={selectedSlip} alt="Enlarged Slip" className="max-h-[85vh] w-full rounded-2xl object-contain" />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default PaymentsPage;
