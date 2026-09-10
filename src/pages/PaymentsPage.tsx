import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Info, Save, Trash2, UploadCloud, Eye, CheckCircle2, Clock, Inbox, Receipt, XCircle, ExternalLink, CreditCard, User, FileText, ImageOff, Search, ChevronLeft, ChevronRight, Copy, Check, QrCode, Plus, Edit3, Landmark, X } from 'lucide-react';
import { formatImageUrl } from '../utils/imageUtils';
import { formatThaiDateTime } from '../utils/dateUtils';
import { ThaiBankLogo } from '../components/ThaiBankLogo';

export interface ThaiBankMeta {
  code: string;
  name: string;
  shortName: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  accentBorder: string;
}

export const THAI_BANKS: ThaiBankMeta[] = [
  { code: 'promptpay', name: 'พร้อมเพย์ (PromptPay)', shortName: 'พร้อมเพย์', color: '#003d7c', badgeBg: 'bg-blue-600', badgeText: 'text-white', accentBorder: 'border-blue-300' },
  { code: 'kbank', name: 'ธนาคารกสิกรไทย (KBANK)', shortName: 'กสิกรไทย', color: '#137f44', badgeBg: 'bg-emerald-600', badgeText: 'text-white', accentBorder: 'border-emerald-300' },
  { code: 'scb', name: 'ธนาคารไทยพาณิชย์ (SCB)', shortName: 'ไทยพาณิชย์', color: '#4e2a84', badgeBg: 'bg-purple-700', badgeText: 'text-white', accentBorder: 'border-purple-300' },
  { code: 'bbl', name: 'ธนาคารกรุงเทพ (BBL)', shortName: 'กรุงเทพ', color: '#1e3f8a', badgeBg: 'bg-blue-800', badgeText: 'text-white', accentBorder: 'border-blue-300' },
  { code: 'ktb', name: 'ธนาคารกรุงไทย (KTB)', shortName: 'กรุงไทย', color: '#00a6e6', badgeBg: 'bg-sky-500', badgeText: 'text-white', accentBorder: 'border-sky-300' },
  { code: 'bay', name: 'ธนาคารกรุงศรีอยุธยา (BAY)', shortName: 'กรุงศรี', color: '#fec43b', badgeBg: 'bg-amber-500', badgeText: 'text-slate-900', accentBorder: 'border-amber-300' },
  { code: 'ttb', name: 'ธนาคารทหารไทยธนชาต (TTB)', shortName: 'ทีทีบี', color: '#002d63', badgeBg: 'bg-blue-900', badgeText: 'text-white', accentBorder: 'border-blue-300' },
  { code: 'gsb', name: 'ธนาคารออมสิน (GSB)', shortName: 'ออมสิน', color: '#eb1985', badgeBg: 'bg-pink-600', badgeText: 'text-white', accentBorder: 'border-pink-300' },
  { code: 'baac', name: 'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (ธ.ก.ส.)', shortName: 'ธ.ก.ส.', color: '#224a25', badgeBg: 'bg-emerald-800', badgeText: 'text-white', accentBorder: 'border-emerald-300' },
  { code: 'other', name: 'บัญชีธนาคารอื่นๆ', shortName: 'อื่นๆ', color: '#475569', badgeBg: 'bg-slate-700', badgeText: 'text-white', accentBorder: 'border-slate-300' },
];

export interface MarketBankAccount {
  id: number;
  bank_code: string;
  bank_name?: string;
  account_name: string;
  account_number: string;
  qr_code_path?: string | null;
  is_active: boolean;
  is_default?: boolean;
  sort_order?: number;
}

const initialBankForm = {
  bank_code: 'promptpay',
  bank_name: 'พร้อมเพย์ (PromptPay)',
  account_name: '',
  account_number: '',
  is_active: true,
};

const getBankCodeFromName = (name?: string | null) => {
  if (!name) return 'promptpay';
  const n = name.toLowerCase();
  if (n.includes('กสิกร') || n.includes('kbank')) return 'kbank';
  if (n.includes('ไทยพาณิชย์') || n.includes('scb')) return 'scb';
  if (n.includes('กรุงเทพ') || n.includes('bbl')) return 'bbl';
  if (n.includes('กรุงไทย') || n.includes('ktb')) return 'ktb';
  if (n.includes('กรุงศรี') || n.includes('bay')) return 'bay';
  if (n.includes('ทหารไทย') || n.includes('ttb')) return 'ttb';
  if (n.includes('ออมสิน') || n.includes('gsb')) return 'gsb';
  if (n.includes('ธ.ก.ส') || n.includes('baac')) return 'baac';
  if (n.includes('พร้อมเพย์') || n.includes('promptpay')) return 'promptpay';
  return 'promptpay';
};

const PaymentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [bankAccounts, setBankAccounts] = useState<MarketBankAccount[]>([]);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<MarketBankAccount | null>(null);
  const [bankFormData, setBankFormData] = useState(initialBankForm);
  const [bankQrFile, setBankQrFile] = useState<File | null>(null);
  const [bankQrPreview, setBankQrPreview] = useState<string | null>(null);
  const [removeBankQr, setRemoveBankQr] = useState<boolean>(false);
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [activeQrModal, setActiveQrModal] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBankDetail, setSelectedBankDetail] = useState<MarketBankAccount | null>(null);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/market-payment-settings');
      if (!response.ok) {
        throw new Error('Unable to load payment settings');
      }

      const payload = await response.json();
      const rawAccounts = payload?.data?.accounts;
      let accountList: MarketBankAccount[] = [];
      if (Array.isArray(rawAccounts)) {
        accountList = rawAccounts;
      } else if (payload?.data && payload.data.account_name) {
        accountList = [{
          id: payload.data.id || 1,
          bank_code: payload.data.bank_code || 'promptpay',
          bank_name: payload.data.bank_name || 'พร้อมเพย์ (PromptPay)',
          account_name: payload.data.account_name,
          account_number: payload.data.account_number,
          qr_code_path: payload.data.qr_code_path,
          is_active: payload.data.is_active ?? true,
        }];
      }
      setBankAccounts(accountList);
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'refunded'>('all');
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

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, search]);

  const historyPayments = useMemo(() => {
    return payments.filter(
      (p) => p.status === 'verified' || p.status === 'success' || p.status === 'refunded'
    );
  }, [payments]);

  const filteredAndSortedPayments = useMemo(() => {
    let list = [...historyPayments];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => {
        const username = (p.booking?.user?.username || '').toLowerCase();
        const stallNum = (p.booking?.stall?.stall_number || '').toLowerCase();
        const amount = String(p.amount || '');
        return username.includes(q) || stallNum.includes(q) || amount.includes(q);
      });
    }

    if (statusFilter === 'verified') {
      list = list.filter((p) => p.status === 'verified' || p.status === 'success');
    } else if (statusFilter === 'refunded') {
      list = list.filter((p) => p.status === 'refunded');
    }

    list.sort((a, b) => {
      const dateA = a.payment_date ? new Date(a.payment_date).getTime() : 0;
      const dateB = b.payment_date ? new Date(b.payment_date).getTime() : 0;
      return dateB - dateA;
    });

    return list;
  }, [historyPayments, statusFilter, search]);

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
      const list = payload.data || [];
      setPayments(list);

      const bookingIdParam = searchParams.get('booking_id');
      const paymentIdParam = searchParams.get('payment_id');
      const statusParam = searchParams.get('status');

      if (statusParam && ['all', 'verified', 'refunded'].includes(statusParam)) {
        setStatusFilter(statusParam as any);
      }

      if (bookingIdParam || paymentIdParam) {
        const target = list.find((p: any) =>
          (bookingIdParam && String(p.booking_id) === String(bookingIdParam)) ||
          (paymentIdParam && String(p.payment_id) === String(paymentIdParam))
        );
        if (target) {
          setSelectedPayment(target);
        }
      }
    } catch {
      setPayments([]);
    }
  };

  const getPaymentBreakdown = (payment: any) => {
    if (!payment) return null;
    const booking = payment.booking;
    const stall = payment.booking?.stall;
    const rentalType = booking?.rental_type || stall?.rental_type || 'daily';
    const totalAmount = Number(payment.amount || booking?.total_amount || 0);

    if (rentalType === 'monthly') {
      let monthlyPrice = Number(booking?.monthly_price ?? stall?.monthly_price ?? 0);
      let entryFee = Number(booking?.entry_fee ?? stall?.entry_fee ?? 0);
      let securityDeposit = Number(booking?.security_deposit ?? stall?.security_deposit ?? 0);

      if (monthlyPrice === 0 && entryFee === 0 && securityDeposit === 0 && totalAmount > 0) {
        monthlyPrice = Math.round(totalAmount * (5000 / 8000));
        entryFee = Math.round(totalAmount * (1000 / 8000));
        securityDeposit = totalAmount - (monthlyPrice + entryFee);
      }

      return {
        type: 'monthly',
        typeLabel: 'เช่ารายเดือน',
        items: [
          { label: 'ค่าเช่าแผงรายเดือน', amount: monthlyPrice },
          { label: 'ค่าธรรมเนียมแรกเข้า', amount: entryFee },
          { label: 'เงินประกันสัญญา', amount: securityDeposit },
        ],
        totalAmount: totalAmount || (monthlyPrice + entryFee + securityDeposit),
      };
    } else {
      const dailyPrice = Number(booking?.daily_price ?? stall?.daily_price ?? stall?.price ?? 500);
      let days = 1;
      if (booking?.start_date && booking?.end_date) {
        const start = new Date(booking.start_date);
        const end = new Date(booking.end_date);
        const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (diff > 0) days = diff;
      } else if (totalAmount > 0 && dailyPrice > 0) {
        days = Math.max(1, Math.round(totalAmount / dailyPrice));
      }

      const calculatedTotal = dailyPrice * days;

      return {
        type: 'daily',
        typeLabel: 'เช่ารายวัน',
        items: [
          { label: `ค่าเช่าแผงรายวัน (฿${dailyPrice.toLocaleString()}/วัน x ${days} วัน)`, amount: calculatedTotal },
        ],
        totalAmount: totalAmount || calculatedTotal,
      };
    }
  };

  useEffect(() => {
    void loadSettings();
    void loadPayments();
  }, []);

  const openAddBankModal = () => {
    setEditingBank(null);
    setBankFormData(initialBankForm);
    setBankQrFile(null);
    setBankQrPreview(null);
    setRemoveBankQr(false);
    setIsBankModalOpen(true);
  };

  const openEditBankModal = (acc: MarketBankAccount) => {
    setEditingBank(acc);
    setBankFormData({
      bank_code: acc.bank_code || 'promptpay',
      bank_name: acc.bank_name || 'พร้อมเพย์ (PromptPay)',
      account_name: acc.account_name,
      account_number: acc.account_number,
      is_active: acc.is_active ?? true,
    });
    setBankQrFile(null);
    setBankQrPreview(acc.qr_code_path ? `/api/images/${acc.qr_code_path.replace(/^\/storage\//, '').replace(/^storage\//, '').replace(/^\/api\/images\//, '')}` : null);
    setRemoveBankQr(false);
    setIsBankModalOpen(true);
  };

  const handleBankFormChange = (field: string, value: any) => {
    setBankFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'bank_code') {
        const found = THAI_BANKS.find((b) => b.code === value);
        if (found) {
          next.bank_name = found.name;
        }
      }
      return next;
    });
  };

  const handleBankQrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBankQrFile(file);
      setRemoveBankQr(false);
      const reader = new FileReader();
      reader.onload = () => {
        setBankQrPreview(typeof reader.result === 'string' ? reader.result : null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingBank(true);
      setErrorMessage('');
      setSuccessMessage('');

      const formPayload = new FormData();
      if (editingBank?.id) {
        formPayload.append('id', String(editingBank.id));
      }
      formPayload.append('bank_code', bankFormData.bank_code);
      formPayload.append('bank_name', bankFormData.bank_name);
      formPayload.append('account_name', bankFormData.account_name);
      formPayload.append('account_number', bankFormData.account_number);
      formPayload.append('is_active', bankFormData.is_active ? '1' : '0');
      if (removeBankQr) {
        formPayload.append('remove_qr_code', '1');
      }
      if (bankQrFile) {
        formPayload.append('qr_code', bankQrFile);
      }

      const response = await fetch('/api/admin/market-payment-settings', {
        method: 'POST',
        body: formPayload,
      });

      const payload = await response.json();
      if (!response.ok || !payload.status) {
        throw new Error(payload.message || 'Unable to save bank account');
      }

      setSuccessMessage(editingBank ? 'บันทึกข้อมูลบัญชีธนาคารเรียบร้อยแล้ว' : 'เพิ่มบัญชีธนาคารรับเงินเรียบร้อยแล้ว');
      setIsBankModalOpen(false);
      void loadSettings();
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการบันทึกบัญชี');
    } finally {
      setIsSavingBank(false);
    }
  };

  const handleDeleteBankAccount = async (id: number) => {
    if (!window.confirm('คุณต้องการลบบัญชีธนาคารนี้ใช่หรือไม่?')) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/market-payment-settings/${id}`, {
        method: 'DELETE',
      });
      const payload = await res.json();
      if (!res.ok || !payload.status) {
        throw new Error(payload.message || 'Unable to delete account');
      }
      setSuccessMessage('ลบบัญชีธนาคารเรียบร้อยแล้ว');
      void loadSettings();
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการลบบัญชี');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBankActive = async (acc: MarketBankAccount) => {
    try {
      const res = await fetch(`/api/admin/market-payment-settings/${acc.id}/toggle-active`, {
        method: 'PATCH',
      });
      const payload = await res.json();
      if (!res.ok || !payload.status) {
        throw new Error(payload.message || 'Unable to toggle account status');
      }
      if (selectedBankDetail && selectedBankDetail.id === acc.id) {
        setSelectedBankDetail((prev) => prev ? { ...prev, is_active: !prev.is_active } : null);
      }
      void loadSettings();
    } catch (err: any) {
      setErrorMessage(err.message || 'ไม่สามารถเปลี่ยนสถานะบัญชีได้');
    }
  };

  const summaryStats = useMemo(() => {
    const total = historyPayments.length;
    const refunded = historyPayments.filter((p) => p.status === 'refunded').length;
    const verified = historyPayments.filter((p) => p.status === 'verified' || p.status === 'success').length;
    return { total, refunded, verified };
  }, [historyPayments]);

  return (
    <div className="space-y-8 pb-12">
      {(successMessage || errorMessage) && (
        <div className={`rounded-2xl border p-4 text-sm font-semibold shadow-xs animate-in fade-in duration-200 ${errorMessage
            ? 'border-red-200 bg-red-50/90 text-red-800'
            : 'border-emerald-200 bg-emerald-50/90 text-emerald-800'
          }`}>
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 flex-shrink-0" />
            <span>{errorMessage || successMessage}</span>
          </div>
        </div>
      )}

      {/* ── Multi-Bank Payment Channels Management Section ── */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Landmark className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-black text-slate-900">ช่องทางรับชำระเงินของตลาด (Payment Channels)</h2>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              ตั้งค่าบัญชีธนาคารและพร้อมเพย์สำหรับให้ผู้เช่าโอนเงินค่าจองแผงค้า (ผู้เช่าสามารถเลือกธนาคารที่ต้องการโอนได้บนแอปมือถือ)
            </p>
          </div>

          <button
            type="button"
            onClick={openAddBankModal}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-blue-700 transition active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>เพิ่มบัญชีธนาคาร</span>
          </button>
        </div>

        {/* Bank Accounts Grid - Compact Sleek Layout */}
        {isLoading ? (
          <div className="py-8 text-center text-sm font-semibold text-slate-400">
            กำลังโหลดข้อมูลบัญชีธนาคาร...
          </div>
        ) : bankAccounts.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Landmark className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">ยังไม่มีบัญชีธนาคารสำหรับรับชำระเงิน</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              กรุณาเพิ่มบัญชีธนาคารหรือพร้อมเพย์อย่างน้อย 1 ช่องทาง เพื่อให้ผู้เช่าสามารถสแกนจ่ายหรือโอนเงินผ่านแอปมือถือได้
            </p>
            <button
              type="button"
              onClick={openAddBankModal}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>เพิ่มบัญชีแรก</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {bankAccounts.map((account) => {
              const meta = THAI_BANKS.find((b) => b.code.toLowerCase() === (account.bank_code || 'promptpay').toLowerCase()) || THAI_BANKS[0];

              return (
                <div
                  key={account.id}
                  onClick={() => setSelectedBankDetail(account)}
                  className={`group relative flex items-center justify-between gap-3 rounded-2xl border bg-white p-3.5 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-400 hover:-translate-y-1 hover:bg-gradient-to-r hover:from-white hover:to-blue-50/20 active:scale-[0.99] cursor-pointer ${
                    account.is_active ? 'border-slate-200/90 shadow-2xs' : 'border-slate-200/60 bg-slate-50/50 opacity-70'
                  }`}
                  title="คลิกเพื่อดูรายละเอียดและ QR Code"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <ThaiBankLogo bankCode={account.bank_code} size={42} className="transition-transform duration-300 group-hover:scale-105 group-hover:shadow-sm" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-900 truncate">{meta.shortName}</span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                          account.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${account.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                          {account.is_active ? 'เปิดรับเงิน' : 'ปิด'}
                        </span>
                      </div>
                      <p className="font-mono font-black text-xs text-blue-600 truncate mt-0.5">
                        {account.account_number}
                      </p>
                      <p className="text-[11px] font-medium text-slate-500 truncate">
                        {account.account_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {account.qr_code_path && (
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-transform group-hover:scale-110" title="มีรูป QR Code พร้อมใช้">
                        <QrCode className="h-3.5 w-3.5" />
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyAccount(account.account_number);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition active:scale-90 cursor-pointer"
                      title="คัดลอกเลขบัญชี"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 group-hover:translate-x-1 transition-all">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Modal: Bank Account Detail View (Expand) ── */}
      {selectedBankDetail && (() => {
        const meta = THAI_BANKS.find((b) => b.code.toLowerCase() === (selectedBankDetail.bank_code || 'promptpay').toLowerCase()) || THAI_BANKS[0];
        const qrUrl = selectedBankDetail.qr_code_path
          ? `/api/images/${selectedBankDetail.qr_code_path.replace(/^\/storage\//, '').replace(/^storage\//, '').replace(/^\/api\/images\//, '')}`
          : null;

        return createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
            onClick={() => setSelectedBankDetail(null)}
          >
            <div
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <ThaiBankLogo bankCode={selectedBankDetail.bank_code} size={48} />
                  <div>
                    <h3 className="text-base font-black text-slate-900">{meta.name}</h3>
                    <p className="text-xs font-semibold text-slate-400">ช่องทางรับชำระเงินของตลาด</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBankDetail(null)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                  title="ปิด"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Status Bar */}
              <div className={`flex items-center justify-between rounded-2xl p-3.5 border ${
                selectedBankDetail.is_active
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${
                    selectedBankDetail.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`} />
                  <span className="text-xs font-extrabold">
                    {selectedBankDetail.is_active ? 'เปิดรับเงินอยู่ (แสดงในแอปผู้เช่า)' : 'ปิดรับเงินชั่วคราว'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleBankActive(selectedBankDetail)}
                  className={`px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer ${
                    selectedBankDetail.is_active
                      ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 shadow-xs'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                  }`}
                >
                  {selectedBankDetail.is_active ? 'ปิดรับเงินชั่วคราว' : 'เปิดรับเงิน'}
                </button>
              </div>

              {/* Account Information Card */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-3">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">ชื่อบัญชีผู้รับเงิน</span>
                  <p className="text-sm font-black text-slate-900 mt-0.5">{selectedBankDetail.account_name}</p>
                </div>

                <div className="pt-2.5 border-t border-slate-200/60">
                  <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">เลขที่บัญชี / PromptPay ID</span>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span className="font-mono text-base font-black text-blue-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                      {selectedBankDetail.account_number}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyAccount(selectedBankDetail.account_number)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                        copiedAccountNumber
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {copiedAccountNumber ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-white" />
                          <span>คัดลอกแล้ว!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>คัดลอก</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* QR Code Card */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
                <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider mb-2">QR Code สำหรับสแกนจ่าย</span>
                {qrUrl ? (
                  <div className="flex flex-col items-center gap-3 bg-white p-4 rounded-xl border border-slate-200/80">
                    <img
                      src={qrUrl}
                      alt="QR Code"
                      className="w-48 h-48 object-contain rounded-lg border border-slate-100 shadow-xs cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => setActiveQrModal(qrUrl)}
                      title="คลิกเพื่อดูภาพขยายเต็มจอ"
                    />
                    <button
                      type="button"
                      onClick={() => setActiveQrModal(qrUrl)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>คลิกเพื่อดูรูปขยายเต็มจอ</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-white rounded-xl border border-dashed border-slate-200">
                    <QrCode className="h-8 w-8 text-slate-300 mx-auto mb-1.5" />
                    <p className="text-xs font-semibold text-slate-400">ยังไม่ได้อัปโหลดรูป QR Code สำหรับช่องทางนี้</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    const acc = selectedBankDetail;
                    setSelectedBankDetail(null);
                    handleDeleteBankAccount(acc.id);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>ลบบัญชีนี้</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBankDetail(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    ปิด
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const acc = selectedBankDetail;
                      setSelectedBankDetail(null);
                      openEditBankModal(acc);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-xs cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>แก้ไขข้อมูล</span>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      {/* ── Modal: Add / Edit Bank Account ── */}
      {isBankModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {editingBank ? 'แก้ไขบัญชีธนาคารรับเงิน' : 'เพิ่มบัญชีธนาคารรับเงินใหม่'}
                    </h3>
                    <p className="text-xs text-slate-400">สำหรับรับโอนเงินค่าจองแผงค้าในตลาด</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(false)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveBankAccount} className="space-y-4">
                {/* 1. Quick Select Thai Bank */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    เลือกธนาคาร / ช่องทางรับเงิน <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {THAI_BANKS.map((bank) => {
                      const isSelected = bankFormData.bank_code.toLowerCase() === bank.code.toLowerCase();
                      return (
                        <button
                          key={bank.code}
                          type="button"
                          onClick={() => handleBankFormChange('bank_code', bank.code)}
                          className={`relative flex items-center gap-2.5 rounded-2xl border p-2.5 text-left transition-all duration-200 cursor-pointer overflow-hidden ${
                            isSelected
                              ? 'border-blue-600 bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-blue-50/80 ring-2 ring-blue-500/25 shadow-sm scale-[1.02]'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 hover:-translate-y-0.5 hover:shadow-2xs'
                          }`}
                        >
                          <ThaiBankLogo bankCode={bank.code} size={28} className="transition-transform duration-200 group-hover:scale-105" />
                          <span className="text-xs font-black text-slate-800 truncate flex-1">{bank.shortName}</span>
                          {isSelected && (
                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xs animate-in zoom-in duration-200">
                              <Check className="h-2.5 w-2.5 stroke-[3]" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Account Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ชื่อบัญชีผู้รับเงิน <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ตลาดนัดกาดหน้ามอ, บจก. มาร์เก็ตเพลส"
                    value={bankFormData.account_name}
                    onChange={(e) => handleBankFormChange('account_name', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* 3. Account Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    เลขที่บัญชี หรือ เบอร์ PromptPay <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 123-4-56789-0 หรือ 081-xxx-xxxx"
                    value={bankFormData.account_number}
                    onChange={(e) => handleBankFormChange('account_number', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                  />
                </div>

                {/* 4. QR Code Image File Upload & Direct Preview with Animated Viewfinder */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-black text-slate-800">
                      รูปภาพ QR Code สำหรับสแกนจ่าย
                    </label>
                    {bankQrPreview && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        {bankQrFile ? 'เลือกไฟล์ใหม่แล้ว' : 'QR Code ปัจจุบันพร้อมใช้'}
                      </span>
                    )}
                  </div>

                  <input
                    type="file"
                    id="bank-qr-upload-input"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={handleBankQrChange}
                  />

                  {bankQrPreview ? (
                    <div className="relative group overflow-hidden rounded-3xl border-2 border-blue-200/90 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 p-4.5 transition-all duration-300 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10">
                      {/* Ambient background decoration */}
                      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-blue-400/10 blur-2xl pointer-events-none group-hover:bg-blue-500/15 transition-colors" />

                      <div className="relative flex flex-col sm:flex-row items-center gap-5">
                        {/* Interactive QR Viewfinder Box */}
                        <div
                          onClick={() => document.getElementById('bank-qr-upload-input')?.click()}
                          className="relative h-32 w-32 shrink-0 rounded-2xl overflow-hidden border-2 border-slate-200/90 bg-white shadow-md cursor-pointer group/img transition-all duration-300 hover:border-blue-500 hover:scale-105"
                          title="คลิกเพื่อเปลี่ยนรูปภาพ QR Code"
                        >
                          {/* 4 Viewfinder Corner Brackets */}
                          <span className="absolute top-1.5 left-1.5 w-3.5 h-3.5 border-t-2 border-l-2 border-blue-500 rounded-tl-sm z-20 transition-all duration-300 group-hover/img:border-cyan-500" />
                          <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 border-t-2 border-r-2 border-blue-500 rounded-tr-sm z-20 transition-all duration-300 group-hover/img:border-cyan-500" />
                          <span className="absolute bottom-1.5 left-1.5 w-3.5 h-3.5 border-b-2 border-l-2 border-blue-500 rounded-bl-sm z-20 transition-all duration-300 group-hover/img:border-cyan-500" />
                          <span className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 border-b-2 border-r-2 border-blue-500 rounded-br-sm z-20 transition-all duration-300 group-hover/img:border-cyan-500" />

                          {/* Laser Scanline Sweep Animation */}
                          <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_#06b6d4] animate-scanline pointer-events-none z-20" />

                          {/* QR Image */}
                          <img
                            src={bankQrPreview}
                            alt="QR Code Preview"
                            className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover/img:scale-110"
                          />

                          {/* Glassmorphism Hover Overlay */}
                          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs opacity-0 group-hover/img:opacity-100 transition-all duration-200 flex flex-col items-center justify-center text-white gap-1.5 z-30">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-md shadow-sm">
                              <UploadCloud className="h-4 w-4 animate-bounce" />
                            </div>
                            <span className="text-[11px] font-black tracking-wide">เปลี่ยนรูป</span>
                          </div>
                        </div>

                        {/* Details & Quick Action Buttons */}
                        <div className="flex-1 text-center sm:text-left space-y-2.5 min-w-0">
                          <div>
                            <div className="flex items-center justify-center sm:justify-start gap-1.5">
                              <QrCode className="h-4 w-4 text-blue-600" />
                              <p className="text-xs font-black text-slate-900 truncate">
                                {bankQrFile ? bankQrFile.name : 'รูปภาพ QR Code พร้อมใช้งาน'}
                              </p>
                            </div>
                            <p className="text-[11px] font-medium text-slate-500 mt-1 leading-relaxed">
                              {bankQrFile
                                ? '✨ ได้ทำการเลือกรูปภาพใหม่แล้ว กดปุ่ม "บันทึกบัญชี" ด้านล่างเพื่อใช้งาน'
                                : 'คลิกที่รูปภาพ QR Code ด้านซ้าย หรือกดปุ่มเปลี่ยนรูปเพื่ออัปเดตรูปใหม่'}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => document.getElementById('bank-qr-upload-input')?.click()}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-black transition-all shadow-sm shadow-blue-500/20 active:scale-95 cursor-pointer"
                            >
                              <UploadCloud className="h-3.5 w-3.5" />
                              <span>เปลี่ยนรูป QR Code</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setBankQrFile(null);
                                setBankQrPreview(null);
                                setRemoveBankQr(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 text-xs font-black transition-all border border-rose-200/80 active:scale-95 cursor-pointer"
                              title="ลบรูปภาพ QR Code ออกจากบัญชีนี้"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>ลบรูปภาพ</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Animated Empty Dropzone */
                    <div
                      onClick={() => document.getElementById('bank-qr-upload-input')?.click()}
                      className="group relative overflow-hidden flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-gradient-to-b from-slate-50/90 via-blue-50/20 to-indigo-50/30 p-7 text-center transition-all duration-300 hover:border-blue-500 hover:bg-blue-50/40 hover:shadow-lg hover:shadow-blue-500/10"
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-md shadow-blue-500/25 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 mb-3">
                        <QrCode className="h-7 w-7" />
                      </div>
                      <p className="text-xs font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                        คลิกเพื่ออัปโหลดภาพ QR Code สำหรับรับเงิน
                      </p>
                      <p className="text-[11px] font-medium text-slate-400 mt-1 max-w-xs">
                        รองรับไฟล์ PNG, JPG ขนาดไม่เกิน 5MB (ผู้เช่าจะสามารถสแกนจ่ายผ่านแอปได้ทันที)
                      </p>
                    </div>
                  )}
                </div>

                {/* 5. Active Toggle */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="bank_active_checkbox"
                    checked={bankFormData.is_active}
                    onChange={(e) => handleBankFormChange('is_active', e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="bank_active_checkbox" className="text-xs font-bold text-slate-700 cursor-pointer">
                    เปิดใช้งานรับชำระเงินทันที
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsBankModalOpen(false)}
                    className="rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingBank}
                    className="flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isSavingBank ? 'กำลังบันทึก...' : 'บันทึกบัญชี'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ── Modal: View QR Code Full Image ── */}
      {activeQrModal &&
        createPortal(
          <div
            onClick={() => setActiveQrModal(null)}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-sm w-full rounded-3xl bg-white p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-sm font-black text-slate-900">QR Code สำหรับรับชำระเงิน</h4>
                <button
                  type="button"
                  onClick={() => setActiveQrModal(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mx-auto flex items-center justify-center p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <img src={activeQrModal} alt="QR Code Full" className="max-h-72 w-auto object-contain rounded-xl" />
              </div>
              <p className="text-xs text-slate-400">สแกนผ่านแอปพลิเคชันธนาคารเพื่อทำรายการ</p>
            </div>
          </div>,
          document.body
        )}

      {/* ── Summary KPI Overview Cards (ประวัติการชำระเงิน) ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* 1. All History */}
        <div
          onClick={() => setStatusFilter('all')}
          className={`group cursor-pointer rounded-3xl border p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${statusFilter === 'all'
              ? 'border-sky-400 bg-white ring-2 ring-sky-400/30 shadow-md'
              : 'border-slate-200/80 bg-white hover:border-sky-300'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-600 uppercase tracking-wider">ธุรกรรมทั้งหมด</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <Inbox className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-3xl font-black text-slate-900 tracking-tight">{summaryStats.total}</p>
            <span className="text-xs font-extrabold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md">รายการทั้งหมด</span>
          </div>
          <p className="mt-2 text-[11px] font-semibold text-slate-500">
            รวมรายการเงินเข้าตลาดและยอดโอนคืนผู้ค้าทั้งหมด
          </p>
        </div>

        {/* 2. Refunded */}
        <div
          onClick={() => setStatusFilter('refunded')}
          className={`group cursor-pointer rounded-3xl border p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${statusFilter === 'refunded'
              ? 'border-sky-500 bg-white ring-2 ring-sky-400/30 shadow-md'
              : 'border-slate-200/80 bg-white hover:border-blue-300'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-sky-900 uppercase tracking-wider">คืนเงินแล้ว (Refunded)</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-3xl font-black text-sky-700 tracking-tight">{summaryStats.refunded}</p>
            <span className="text-xs font-extrabold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-md">โอนคืนเรียบร้อย</span>
          </div>
          <p className="mt-2 text-[11px] font-semibold text-sky-700">
            แอดมินโอนเงินคืนเข้าบัญชีผู้ค้าแล้ว มีสลิปยืนยันในระบบ
          </p>
        </div>

        {/* 3. Verified Success */}
        <div
          onClick={() => setStatusFilter('verified')}
          className={`group cursor-pointer rounded-3xl border p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${statusFilter === 'verified'
              ? 'border-emerald-400 bg-white ring-2 ring-emerald-400/30 shadow-md'
              : 'border-slate-200/80 bg-white hover:border-emerald-300'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-900 uppercase tracking-wider">สำเร็จ (Verified)</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-3xl font-black text-emerald-700 tracking-tight">{summaryStats.verified}</p>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">เงินเข้าตลาดแล้ว</span>
          </div>
          <p className="mt-2 text-[11px] font-semibold text-emerald-700">
            ตรวจสลิปถูกต้อง ได้รับเงินแล้ว อนุมัติสิทธิ์เข้าใช้แผงค้า
          </p>
        </div>
      </div>

      {/* ── Payment History Table Section ── */}
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-xs overflow-hidden transition-all">
        {/* Table Header Controls */}
        <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-black text-slate-900">ประวัติการชำระเงิน</h2>

              {/* Hover Tooltip Icon (i) */}
              <div className="relative group inline-flex items-center">
                <button
                  type="button"
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white transition-all duration-200 shadow-2xs cursor-pointer"
                  title="ดูคำอธิบายสถานะ"
                  aria-label="ดูคำอธิบายสถานะ"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>

                {/* Floating Tooltip Card */}
                <div className="pointer-events-none absolute left-0 top-full mt-2.5 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md p-4 shadow-2xl opacity-0 invisible -translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50">
                  <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      คำอธิบายความหมายของสถานะ
                    </h4>
                  </div>
                  <div className="space-y-3 text-xs">
                    {/* Status: Verified */}
                    <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50/70 p-2.5 border border-emerald-100/80">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white shrink-0 mt-0.5 shadow-2xs">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>สำเร็จ</span>
                      </span>
                      <div>
                        <p className="font-bold text-emerald-950 text-xs">เงินเข้าบัญชีตลาดแล้ว</p>
                        <p className="text-[11px] text-emerald-800 font-medium mt-0.5 leading-relaxed">
                          ผู้ค้าชำระเงินและตรวจสลิปผ่านแล้ว สัญญาเช่าแผงค้าอนุมัติพร้อมเปิดให้เข้าใช้ล็อกแผงค้าได้ทันที
                        </p>
                      </div>
                    </div>

                    {/* Status: Refunded */}
                    <div className="flex items-start gap-2.5 rounded-xl bg-sky-50/70 p-2.5 border border-sky-100/80">
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-600 px-2 py-0.5 text-[10px] font-black text-white shrink-0 mt-0.5 shadow-2xs">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>คืนเงินแล้ว</span>
                      </span>
                      <div>
                        <p className="font-bold text-sky-950 text-xs">โอนเงินคืนผู้ค้าแล้ว</p>
                        <p className="text-[11px] text-sky-800 font-medium mt-0.5 leading-relaxed">
                          คำขอจองถูกยกเลิก/ขอคืนเงิน และแอดมินได้โอนเงินคืนเข้าบัญชีธนาคารปลายทางของผู้ค้า พร้อมแนบหลักฐานสลิปในระบบแล้ว
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-0.5 text-sm font-semibold text-slate-500">
              แสดงรายการชำระเงิน (สูงสุด {itemsPerPage} รายการต่อหน้า)
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
                className="w-full sm:w-64 rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-2xs"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-600 whitespace-nowrap">กรองสถานะ:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 outline-none transition focus:border-sky-500 cursor-pointer shadow-2xs"
              >
                <option value="all">ทั้งหมด</option>
                <option value="refunded">คืนเงินแล้ว</option>
                <option value="verified">สำเร็จ</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stable Min-Height Container */}
        <div className="min-h-[400px] overflow-x-auto flex flex-col justify-between">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-black uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">วันที่ / เวลา</th>
                <th className="px-6 py-4">ผู้ค้า / แผงค้า</th>
                <th className="px-6 py-4">ชำระเงินค่าอะไรบ้าง (รายการค่าใช้จ่าย)</th>
                <th className="px-6 py-4">ธนาคารปลายทาง</th>
                <th className="px-6 py-4">ยอดเงินรวม</th>
                <th className="px-6 py-4">สถานะ</th>
                <th className="px-6 py-4 text-center">การกระทำ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-24 text-center text-sm font-semibold text-slate-400">
                    ไม่พบรายการชำระเงินตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((txn) => {
                  const paymentDateStr = formatThaiDateTime(txn.payment_date);
                  const tenantName = txn.booking?.user?.username || 'ไม่ระบุ';
                  const stallNum = txn.booking?.stall?.stall_number || '-';
                  const initialChar = tenantName.charAt(0).toUpperCase();
                  const bd = getPaymentBreakdown(txn);

                  return (
                    <tr key={txn.payment_id} className="transition-colors hover:bg-slate-50/80">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-700">
                        {paymentDateStr}
                      </td>

                      {/* Tenant & Stall Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-sm font-black text-slate-700 shadow-2xs border border-slate-200/60">
                            {initialChar}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 text-base">{tenantName}</div>
                            <span className="inline-flex items-center rounded-md bg-sky-50 px-2.5 py-0.5 text-xs font-black text-sky-700 border border-sky-200/60 mt-0.5">
                              ล็อก {stallNum}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Itemized Payment Breakdown Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {bd ? (
                          <div className="space-y-1 text-xs">
                            <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-black ${
                              bd.type === 'monthly' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {bd.type === 'monthly' ? 'เช่ารายเดือน' : 'เช่ารายวัน'}
                            </span>
                            <div className="text-xs font-semibold text-slate-600 max-w-xs truncate">
                              {bd.items.map(i => i.label).join(' + ')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">ชำระค่าเช่าแผง</span>
                        )}
                      </td>

                      {/* Destination Bank Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {txn.refund_bank_name || txn.destination_bank ? (
                          <div className="flex items-center gap-2.5">
                            <ThaiBankLogo
                              bankCode={getBankCodeFromName(txn.refund_bank_name || txn.destination_bank)}
                              size={34}
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-slate-900 text-xs">
                                  {txn.refund_bank_name || txn.destination_bank}
                                </span>
                                {txn.status === 'refunded' && (
                                  <span className="rounded bg-sky-100 text-sky-800 text-[9px] font-extrabold px-1.5 py-0.5">
                                    บัญชีรับเงินคืน
                                  </span>
                                )}
                              </div>
                              {txn.refund_account_number && (
                                <span className="font-mono text-xs font-extrabold text-blue-700 block tracking-tight">
                                  {txn.refund_account_number}
                                </span>
                              )}
                              {txn.refund_account_name && (
                                <span className="text-[11px] text-slate-500 font-semibold block truncate max-w-[140px]">
                                  {txn.refund_account_name}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">-</span>
                        )}
                      </td>

                      {/* Amount Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const displayAmount = Number(txn.amount || txn.booking?.total_amount || 0);
                          return (
                            <div>
                              <span className={`font-mono font-black text-base ${
                                txn.status === 'refunded' ? 'text-slate-800' : 'text-emerald-700'
                              }`}>
                                ฿{displayAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                              </span>
                              {txn.status === 'refunded' ? (
                                <span className="block text-[10px] font-extrabold text-sky-700">
                                  (ยอดโอนคืนผู้ค้า)
                                </span>
                              ) : (
                                <span className="block text-[10px] font-extrabold text-emerald-600">
                                  (ยอดชำระสำเร็จ)
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Status Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {txn.status === 'verified' || txn.status === 'success' ? (
                          <div className="flex flex-col items-start gap-0.5">
                            <span
                              onClick={() => txn.booking_id && navigate(`/verifications?booking_id=${txn.booking_id}`)}
                              title="คลิกเพื่อดูรายละเอียดใบจองนี้"
                              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 shadow-2xs"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              สำเร็จ
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 pl-2">เงินเข้าตลาดแล้ว</span>
                          </div>
                        ) : txn.status === 'refund_requested' ? (
                          <div className="flex flex-col items-start gap-0.5">
                            <span
                              onClick={() => txn.booking_id && navigate(`/verifications?booking_id=${txn.booking_id}`)}
                              title="คลิกเพื่อดูรายละเอียดใบจองนี้"
                              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-purple-50 border border-purple-200 px-3 py-1 text-xs font-bold text-purple-700 transition hover:bg-purple-100 shadow-2xs"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
                              ขอคืนเงิน
                            </span>
                            <span className="text-[10px] font-bold text-purple-600 pl-2">รอแอดมินโอนคืน</span>
                          </div>
                        ) : txn.status === 'refunded' ? (
                          <div className="flex flex-col items-start gap-0.5">
                            <span
                              onClick={() => txn.booking_id && navigate(`/verifications?booking_id=${txn.booking_id}`)}
                              title="คลิกเพื่อดูรายละเอียดใบจองนี้"
                              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-sky-50 border border-sky-200 px-3 py-1 text-xs font-bold text-sky-700 transition hover:bg-sky-100 shadow-2xs"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                              คืนเงินแล้ว
                            </span>
                            <span className="text-[10px] font-bold text-sky-600 pl-2">โอนคืนผู้ค้าแล้ว</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-start gap-0.5">
                            <span
                              onClick={() => txn.booking_id && navigate(`/verifications?booking_id=${txn.booking_id}`)}
                              title="คลิกเพื่อดูรายละเอียดใบจองนี้"
                              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-700 transition hover:bg-amber-100 shadow-2xs"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                              รอตรวจสอบ
                            </span>
                            <span className="text-[10px] font-bold text-amber-600 pl-2">รอตรวจสลิป</span>
                          </div>
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
                  className={`flex h-8 w-8 items-center justify-center rounded-xl border text-xs font-bold transition shadow-2xs ${activePage === pageNum
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
                      <h4 className="text-base font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <User className="h-5 w-5 text-sky-600" /> ข้อมูลผู้ชำระเงิน & ล็อก
                      </h4>

                      <div className="space-y-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4.5 text-sm font-semibold text-slate-800 shadow-2xs">
                        <div className="flex justify-between items-center border-b border-slate-200/60 pb-2.5">
                          <span className="text-sm font-bold text-slate-500">ผู้ค้า / ผู้เช่า:</span>
                          <span className="text-base font-black text-slate-900">{selectedPayment.booking?.user?.username || 'ไม่ระบุ'}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-200/60 pb-2.5">
                          <span className="text-sm font-bold text-slate-500">เบอร์โทรศัพท์:</span>
                          <span className="text-base font-black text-slate-900">{selectedPayment.booking?.user?.phone || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-200/60 pb-2.5">
                          <span className="text-sm font-bold text-slate-500">หมายเลขล็อก:</span>
                          <span className="text-base font-black text-sky-700 bg-sky-50 px-3 py-0.5 rounded-lg border border-sky-200">
                            ล็อก {selectedPayment.booking?.stall?.stall_number || '-'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-200/60 pb-2.5">
                          <span className="text-sm font-bold text-slate-500">ขนาดแผงค้า:</span>
                          <span className="text-base font-bold text-slate-800">{selectedPayment.booking?.stall?.size || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-200/60 pb-2.5">
                          <span className="text-sm font-bold text-slate-500">ยอดเงินที่ชำระ:</span>
                          <span className="font-mono font-black text-emerald-600 text-lg">
                            ฿{(selectedPayment.amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-200/60 pb-2.5">
                          <span className="text-sm font-bold text-slate-500">ช่องทาง/ธนาคาร:</span>
                          <span className="inline-flex items-center gap-1.5 text-sm font-black text-slate-800">
                            <Landmark className="h-4 w-4 text-blue-600" />
                            {selectedPayment.destination_bank || 'พร้อมเพย์ / บัญชีหลักตลาด'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-sm font-bold text-slate-500">สถานะปัจจุบัน:</span>
                          {selectedPayment.status === 'verified' || selectedPayment.status === 'success' ? (
                            <span className="rounded-full bg-emerald-100 border border-emerald-300 px-3.5 py-1 text-sm font-black text-emerald-800">อนุมัติสำเร็จ</span>
                          ) : selectedPayment.status === 'refund_requested' ? (
                            <span className="rounded-full bg-purple-100 border border-purple-300 px-3.5 py-1 text-sm font-black text-purple-800">ขอคืนเงิน</span>
                          ) : selectedPayment.status === 'refunded' ? (
                            <span className="rounded-full bg-sky-100 border border-sky-300 px-3.5 py-1 text-sm font-black text-sky-800">คืนเงินแล้ว</span>
                          ) : (
                            <span className="rounded-full bg-amber-100 border border-amber-300 px-3.5 py-1 text-sm font-black text-amber-800">รอตรวจสอบ</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Itemized Payment Breakdown Card */}
                    {(() => {
                      const bd = getPaymentBreakdown(selectedPayment);
                      if (!bd) return null;
                      return (
                        <div>
                          <h4 className="text-base font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Receipt className="h-5 w-5 text-sky-600" /> ชำระเงินค่าอะไรบ้าง (Payment Breakdown)
                          </h4>

                          <div className="space-y-4 rounded-2xl border border-sky-200/90 bg-gradient-to-br from-sky-50/90 to-blue-50/50 p-5 sm:p-6 text-sm font-semibold text-slate-800 shadow-sm">
                            <div className="flex items-center justify-between border-b border-sky-200/70 pb-3">
                              <span className="text-sm font-bold text-slate-600">รูปแบบการเช่า:</span>
                              <span className="rounded-lg bg-sky-600 px-3 py-1 text-xs font-black text-white shadow-2xs">
                                {bd.typeLabel}
                              </span>
                            </div>

                            {bd.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-sm font-bold text-slate-700 py-2 border-b border-sky-200/40">
                                <span className="text-slate-700 font-bold">{item.label}:</span>
                                <span className="font-mono font-black text-slate-900 text-base">
                                  ฿{item.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            ))}

                            <div className="flex justify-between items-center pt-3">
                              <span className="font-extrabold text-slate-900 text-base">ยอดเงินรวมที่ชำระ:</span>
                              <span className="font-mono font-black text-emerald-600 text-xl">
                                ฿{bd.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

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
                    {/* 1. Pending Status Panel (Read-only History View) */}
                    {(selectedPayment.status === 'pending' || selectedPayment.status === 'pending_review') && (
                      <div className="space-y-4 rounded-3xl border border-amber-200 bg-gradient-to-b from-amber-50/80 to-amber-100/30 p-5 sm:p-6 shadow-xs">
                        <div className="flex items-center justify-between border-b border-amber-200/60 pb-3.5">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white shadow-2xs">
                              <Clock className="h-4.5 w-4.5" />
                            </span>
                            <div>
                              <h4 className="text-sm font-black text-amber-950 uppercase tracking-wider">ข้อมูลการชำระเงิน (Pending Review)</h4>
                              <p className="text-xs font-medium text-amber-700">รายการชำระเงินนี้อยู่ระหว่างรอการตรวจสอบความถูกต้อง</p>
                            </div>
                          </div>
                        </div>

                        {/* Audit Details Card (Read Only) */}
                        <div className="space-y-4 bg-white p-5 rounded-2xl border border-amber-200/80 shadow-2xs text-sm">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <span className="text-slate-600 font-bold text-xs">ยอดเงินชำระที่ส่งมา:</span>
                            <span className="font-mono font-black text-amber-800 text-base">
                              ฿{(selectedPayment.amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                            </span>
                          </div>

                          <div className="rounded-xl bg-amber-50/80 p-3.5 border border-amber-200/60 text-xs text-amber-900 space-y-2 font-medium">
                            <p className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                              <Info className="h-4 w-4 text-amber-600" /> สถานะในระบบ:
                            </p>
                            <p className="text-xs font-semibold text-amber-800">
                              รายการนี้เป็นประวัติการแจ้งชำระเงิน รอการตรวจสอบอนุมัติในระบบ
                            </p>
                          </div>

                          {selectedPayment.booking_id && (
                            <div className="pt-1">
                              <button
                                onClick={() => {
                                  const bookingId = selectedPayment.booking_id;
                                  setSelectedPayment(null);
                                  navigate(`/verifications?booking_id=${bookingId}`);
                                }}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 py-2.5 px-4 text-xs font-bold text-white shadow-xs transition hover:bg-amber-700 cursor-pointer"
                              >
                                <ExternalLink className="h-4 w-4" />
                                ไปยังหน้าอนุมัติการจองแผงเพื่อตรวจสอบ
                              </button>
                            </div>
                          )}
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
                                {formatThaiDateTime(selectedPayment.payment_date)}
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
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition shadow-2xs cursor-pointer ${copiedAccountNumber
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
                                {formatThaiDateTime(selectedPayment.refunded_at)}
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
