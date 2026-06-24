import React, { useEffect, useMemo, useState } from 'react';
import { Info, Save, Trash2, UploadCloud } from 'lucide-react';

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
    return qrCodePreview.startsWith('http') ? qrCodePreview : `/storage/${qrCodePreview}`;
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

  useEffect(() => {
    void loadSettings();
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
      setQrCodePreview(payload.data?.qr_code_path ? `/storage/${payload.data.qr_code_path}` : null);
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
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
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
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
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
    </div>
  );
};

export default PaymentsPage;
