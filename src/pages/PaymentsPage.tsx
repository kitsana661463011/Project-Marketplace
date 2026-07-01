import React, { useEffect, useMemo, useState } from 'react';
import { Info, Save, Trash2, UploadCloud, Eye, CheckCircle2, Clock, XCircle } from 'lucide-react';

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
      qrCodePreview.startsWith('data:') ||
      qrCodePreview.startsWith('/storage/')
    ) {
      return qrCodePreview;
    }
    return `/api/images/${qrCodePreview}`;
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
      setQrCodePreview(settings?.qr_code_path ? `/storage/${settings.qr_code_path}` : null);
    } catch {
      setErrorMessage('ไม่สามารถดึงข้อมูลบัญชีรับชำระเงินได้ในขณะนี้');
    } finally {
      setIsLoading(false);
    }
  };

  const [payments, setPayments] = useState<any[]>([]);
  const [selectedSlip, setSelectedSlip] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">การชำระเงิน</h1>
        <p className="mt-2 text-sm text-slate-600">ตั้งค่าระบบรับชำระเงินและ QR Code สำหรับลูกค้า</p>
      </div>

      {(successMessage || errorMessage) && (
        <div className={`mb-6 rounded-xl border px-4 py-3 text-sm ${errorMessage ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {errorMessage || successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">QR Code ปัจจุบัน</h2>
                <span className="mt-2 inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  กำลังใช้งาน
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <div className="mx-auto flex max-w-[260px] flex-col items-center rounded-2xl border border-slate-300 bg-white p-5 shadow-inner">
                {isLoading ? (
                  <p className="text-sm text-slate-500">กำลังโหลดข้อมูล...</p>
                ) : qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="QR Code payment settings" className="h-56 w-56 rounded-xl object-contain" />
                ) : (
                  <div className="flex h-56 w-56 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-500">
                    ยังไม่มี QR Code
                  </div>
                )}
                <p className="mt-4 text-center text-sm font-semibold text-slate-800">{formData.accountName || 'ยังไม่มีชื่อบัญชี'}</p>
                <p className="mt-1 text-center text-xs text-slate-500">{formData.accountNumber || 'ยังไม่มีเลขบัญชี'}</p>
              </div>
            </div>

            <button
              onClick={handleRemoveQrCode}
              disabled={isSaving}
              className="mt-6 inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 size={16} />
              {isSaving ? 'กำลังลบ...' : 'ลบ QR Code'}
            </button>
          </div>

          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                <Info size={18} />
              </div>
              <p className="text-sm leading-6 text-sky-800">
                คำแนะนำการใช้งาน: QR Code ที่คุณอัปโหลดจะถูกแสดงให้ลูกค้าเห็นในขั้นตอนการชำระเงิน
                เพื่อช่วยให้ผู้ซื้อชำระเงินได้สะดวกและรวดเร็วยิ่งขึ้น
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">อัปโหลด QR Code ใหม่</h2>
              <p className="mt-1 text-sm text-slate-500">เลือกไฟล์รูปภาพเพื่ออัปโหลดเป็น QR Code ใหม่</p>
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-sky-300 bg-sky-50/70 px-6 py-10 text-center transition hover:border-sky-400 hover:bg-sky-50">
              <UploadCloud className="mb-3 h-10 w-10 text-sky-600" />
              <p className="text-sm font-medium text-slate-800">ลากไฟล์มาวางที่นี่ หรือ คลิกเพื่อเลือกไฟล์</p>
              <p className="mt-2 text-sm text-slate-500">รองรับไฟล์ประเภท PNG, JPG (สูงสุด 5MB)</p>
              <input type="file" accept="image/png,image/jpeg" className="sr-only" onChange={handleFileChange} />
            </label>

            {selectedFileName ? (
              <p className="mt-3 text-sm text-slate-600">
                ไฟล์ที่เลือก: <span className="font-medium text-slate-900">{selectedFileName}</span>
              </p>
            ) : (
              <p className="mt-3 text-sm text-slate-500">ยังไม่มีไฟล์ที่เลือก</p>
            )}

            <div className="mt-6 rounded-2xl border border-slate-200 p-5">
              <h3 className="text-base font-semibold text-slate-900">ข้อมูลบัญชีผู้รับเงิน</h3>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">ชื่อบัญชี</label>
                  <input
                    type="text"
                    value={formData.accountName}
                    onChange={(event) => handleInputChange('accountName', event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">เลขบัญชี / PromptPay</label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(event) => handleInputChange('accountNumber', event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleSaveClick}
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={16} />
                {isSaving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      </div>

      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-slate-900">ยืนยันการบันทึกข้อมูล?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              คุณต้องการบันทึกการเปลี่ยนแปลงข้อมูลบัญชีและ QR Code นี้ใช่หรือไม่?
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-55"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmSave}
                disabled={isSaving}
                className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? 'กำลังบันทึก...' : 'ยืนยัน'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Table */}
      <div className="mt-8 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-800">ประวัติการชำระเงินล่าสุด</h2>
          <p className="mt-1 text-sm text-slate-500">ตรวจสอบและจัดการรายการชำระเงินที่เข้ามาในระบบ</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-sm font-semibold text-slate-600">
                <th className="px-6 py-4">วันที่/เวลา</th>
                <th className="px-6 py-4">ผู้ค้า / แผงค้า</th>
                <th className="px-6 py-4">จำนวนเงิน</th>
                <th className="px-6 py-4">ช่องทาง</th>
                <th className="px-6 py-4">สถานะ</th>
                <th className="px-6 py-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    ไม่พบประวัติการชำระเงินในระบบ
                  </td>
                </tr>
              ) : (
                payments.map((txn) => {
                  const paymentDateStr = txn.payment_date 
                    ? new Date(txn.payment_date).toLocaleString('th-TH', { 
                        year: 'numeric', month: '2-digit', day: '2-digit', 
                        hour: '2-digit', minute: '2-digit' 
                      })
                    : '-';
                  const tenantName = txn.booking?.user?.username || 'ไม่ระบุ';
                  const stallNum = txn.booking?.stall?.stall_number || '-';
                  return (
                    <tr key={txn.payment_id} className="transition-colors hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-medium">
                        {paymentDateStr}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-800 font-bold">
                        {tenantName} - ล็อก {stallNum}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-800 font-mono font-bold">
                        ฿{(txn.amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        {txn.payment_slip ? 'โอนเงิน (แนบสลิป)' : 'เงินสด'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {txn.status === 'verified' || txn.status === 'success' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                            <CheckCircle2 size={14} /> สำเร็จ
                          </span>
                        ) : txn.status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700">
                            <XCircle size={14} /> ปฏิเสธ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                            <Clock size={14} /> รอตรวจสอบ
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button 
                          onClick={() => {
                            if (txn.payment_slip) {
                              const slipPath = txn.payment_slip.startsWith('http') || txn.payment_slip.startsWith('/storage') || txn.payment_slip.startsWith('data:') 
                                ? txn.payment_slip 
                                : `/storage/${txn.payment_slip}`;
                              setSelectedSlip(slipPath);
                            } else {
                              alert('ไม่มีรูปภาพสลิปแนบมากับรายการนี้');
                            }
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sky-500 transition-colors hover:bg-sky-55 hover:text-sky-700"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" onClick={() => setSelectedSlip(null)}>
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">หลักฐานการชำระเงิน (Slip)</h3>
              <button 
                onClick={() => setSelectedSlip(null)} 
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <span className="text-2xl font-normal">&times;</span>
              </button>
            </div>
            <div className="mt-4 flex justify-center bg-slate-50 p-4 rounded-xl border border-slate-200">
              <img src={selectedSlip} alt="Payment Slip" className="max-h-[60vh] max-w-full rounded-lg object-contain shadow-sm" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
