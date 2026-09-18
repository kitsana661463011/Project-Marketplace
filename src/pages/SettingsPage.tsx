import React, { useState, useRef } from 'react';
import {
  User as UserIcon,
  Mail,
  Lock,
  Camera,
  CheckCircle2,
  AlertCircle,
  Save,
  KeyRound,
  Eye,
  EyeOff,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../context';
import { formatImageUrl } from '../utils/imageUtils';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile } = useAuth();

  // Active section tab
  const [activeTab, setActiveTab] = useState<'profile' | 'email' | 'password'>('profile');

  // Profile Form States
  const [name, setName] = useState(user?.name || 'Admin');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);
  const [, setAvatarFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Email Form States
  const [newEmail, setNewEmail] = useState('');
  const [emailConfirmPassword, setEmailConfirmPassword] = useState('');
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.avatar !== undefined) setAvatarPreview(user.avatar);
  }, [user]);

  // Handle image upload selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setProfileMsg({ type: 'error', text: 'ขนาดไฟล์ภาพต้องไม่เกิน 5 MB' });
      return;
    }

    setAvatarFile(file);
    setAvatarError(false);

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 1. Save Profile (Name & Avatar)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    if (!name.trim()) {
      setProfileMsg({ type: 'error', text: 'กรุณากรอกชื่อผู้ดูแลระบบ' });
      return;
    }

    setIsSavingProfile(true);

    try {
      const result = await updateProfile({
        name: name.trim(),
        avatar: avatarPreview || undefined,
      });

      if (result.success) {
        setProfileMsg({ type: 'success', text: 'บันทึกข้อมูลส่วนตัวและรูปโปรไฟล์เรียบร้อยแล้ว!' });
        setTimeout(() => setProfileMsg(null), 4000);
      } else {
        setProfileMsg({ type: 'error', text: result.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
      }
    } catch {
      setProfileMsg({ type: 'error', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อระบบ' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // 2. Save Email
  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMsg(null);

    const cleanEmail = newEmail.trim();
    if (!cleanEmail) {
      setEmailMsg({ type: 'error', text: 'กรุณากรอกอีเมลใหม่' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setEmailMsg({ type: 'error', text: 'รูปแบบอีเมลไม่ถูกต้อง' });
      return;
    }

    if (cleanEmail.toLowerCase() === user?.email?.toLowerCase()) {
      setEmailMsg({ type: 'error', text: 'อีเมลใหม่ตรงกับอีเมลปัจจุบันอยู่แล้ว' });
      return;
    }

    setIsSavingEmail(true);

    try {
      const result = await updateProfile({
        email: cleanEmail,
        currentPassword: emailConfirmPassword,
      });

      if (result.success) {
        setEmailMsg({ type: 'success', text: `เปลี่ยนอีเมลเป็น ${cleanEmail} สำเร็จเรียบร้อยแล้ว!` });
        setNewEmail('');
        setEmailConfirmPassword('');
        setTimeout(() => setEmailMsg(null), 4000);
      } else {
        setEmailMsg({ type: 'error', text: result.error || 'ไม่สามารถเปลี่ยนอีเมลได้' });
      }
    } catch {
      setEmailMsg({ type: 'error', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อระบบ' });
    } finally {
      setIsSavingEmail(false);
    }
  };

  // 3. Save Password
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!newPassword) {
      setPasswordMsg({ type: 'error', text: 'กรุณากรอกรหัสผ่านใหม่' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน' });
      return;
    }

    setIsSavingPassword(true);

    try {
      const result = await updateProfile({
        currentPassword: currentPassword,
        newPassword: newPassword,
      });

      if (result.success) {
        setPasswordMsg({ type: 'success', text: 'เปลี่ยนรหัสผ่านใหม่สำเร็จเรียบร้อยแล้ว!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordMsg(null), 4000);
      } else {
        setPasswordMsg({ type: 'error', text: result.error || 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
      }
    } catch {
      setPasswordMsg({ type: 'error', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อระบบ' });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleResetToDefaultLogo = () => {
    setAvatarPreview('/logo.png');
    setAvatarError(false);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setAvatarFile(null);
    setAvatarError(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-200">
              <UserIcon className="h-5 w-5" />
            </span>
            ตั้งค่าระบบและบัญชีผู้ดูแล
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            จัดการข้อมูลส่วนตัว รูปโปรไฟล์ อีเมล และรหัสผ่านความปลอดภัยของผู้ดูแลระบบ
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'profile'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
            }`}
        >
          <Camera className="h-4 w-4" />
          <span>รูปโปรไฟล์และข้อมูลทั่วไป</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('email')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'email'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
            }`}
        >
          <Mail className="h-4 w-4" />
          <span>เปลี่ยนอีเมล</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('password')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'password'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
            }`}
        >
          <Lock className="h-4 w-4" />
          <span>เปลี่ยนรหัสผ่าน</span>
        </button>
      </div>

      {/* ─── TAB 1: Profile & Avatar ─── */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
              รูปภาพประจำตัวผู้ดูแลระบบ (Admin Avatar)
            </h2>

            {/* Alert Message */}
            {profileMsg && (
              <div
                className={`flex items-center gap-2 rounded-2xl p-4 text-sm font-bold ${profileMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
              >
                {profileMsg.type === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                )}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Avatar Preview */}
              <div className="relative group">
                <div className="h-28 w-28 rounded-full border-4 border-white shadow-xl ring-2 ring-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center">
                  {avatarPreview && !avatarError ? (
                    <img
                      src={formatImageUrl(avatarPreview)}
                      alt="Avatar Preview"
                      onError={() => setAvatarError(true)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-3xl">
                      {name ? name.charAt(0).toUpperCase() : 'A'}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-1 right-1 h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition cursor-pointer border-2 border-white"
                  title="เปลี่ยนรูปภาพ"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              {/* Upload Controls */}
              <div className="flex-1 space-y-2.5 text-center sm:text-left">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                />

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <ImageIcon className="h-4 w-4" />
                    <span>เลือกรูปภาพจากเครื่อง</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetToDefaultLogo}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 text-xs font-bold transition cursor-pointer"
                    title="ใช้โลโก้ของแอปเป็นรูปโปรไฟล์"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                    <span>ใช้โลโก้แอป (logo.png)</span>
                  </button>

                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-2 text-xs font-bold transition cursor-pointer"
                    >
                      ลบรูปภาพ
                    </button>
                  )}
                </div>

                <p className="text-xs font-medium text-slate-500">
                  รองรับไฟล์ภาพ JPG, PNG, WebP ขนาดไม่เกิน 5 MB รูปภาพจะแสดงผลที่แถบเมนูด้านข้างและมุมขวาบน
                </p>
              </div>
            </div>

            {/* Admin Name Field */}
            <div className="pt-4 border-t border-slate-100 space-y-1.5 max-w-md">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                ชื่อแสดงในระบบ (Display Name)
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 pointer-events-none text-slate-400">
                  <UserIcon className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Admin"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-sm font-black transition shadow-md active:scale-98 disabled:opacity-70 cursor-pointer"
            >
              {isSavingProfile ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>บันทึกรูปโปรไฟล์และชื่อ</span>
            </button>
          </div>
        </form>
      )}

      {/* ─── TAB 2: Change Email ─── */}
      {activeTab === 'email' && (
        <form onSubmit={handleSaveEmail} className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6 max-w-2xl">
            <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
              เปลี่ยนอีเมลผู้ดูแลระบบ (Change Admin Email)
            </h2>

            {/* Alert Message */}
            {emailMsg && (
              <div
                className={`flex items-center gap-2 rounded-2xl p-4 text-sm font-bold ${emailMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
              >
                {emailMsg.type === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                )}
                <span>{emailMsg.text}</span>
              </div>
            )}

            {/* Current Email Display */}
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                อีเมลปัจจุบัน (Current Email)
              </label>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-100 border border-slate-200 text-sm font-bold text-slate-900 font-mono">
                <Mail className="h-4 w-4 text-blue-600" />
                <span>{user?.email || 'Admin@gmail.com'}</span>
              </div>
            </div>

            {/* New Email Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                อีเมลใหม่ (New Email Address)
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="เช่น newadmin@gmail.com"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Current Password Verification */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                รหัสผ่านปัจจุบัน (สำหรับยืนยันความปลอดภัย)
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  value={emailConfirmPassword}
                  onChange={(e) => setEmailConfirmPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านปัจจุบันของคุณ"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end max-w-2xl">
            <button
              type="submit"
              disabled={isSavingEmail}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-sm font-black transition shadow-md active:scale-98 disabled:opacity-70 cursor-pointer"
            >
              {isSavingEmail ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>บันทึกอีเมลใหม่</span>
            </button>
          </div>
        </form>
      )}

      {/* ─── TAB 3: Change Password ─── */}
      {activeTab === 'password' && (
        <form onSubmit={handleSavePassword} className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6 max-w-2xl">
            <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
              เปลี่ยนรหัสผ่านผู้ดูแลระบบ (Change Password)
            </h2>

            {/* Alert Message */}
            {passwordMsg && (
              <div
                className={`flex items-center gap-2 rounded-2xl p-4 text-sm font-bold ${passwordMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
              >
                {passwordMsg.type === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                )}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            {/* Current Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                รหัสผ่านปัจจุบัน (Current Password)
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 pointer-events-none text-slate-400">
                  <KeyRound className="h-4 w-4" />
                </div>
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="12345Test!"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                รหัสผ่านใหม่ (New Password)
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="ความยาวอย่างน้อย 6 ตัวอักษร"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                ยืนยันรหัสผ่านใหม่อีกครั้ง (Confirm New Password)
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="พิมพ์รหัสผ่านใหม่อีกครั้ง"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end max-w-2xl">
            <button
              type="submit"
              disabled={isSavingPassword}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-sm font-black transition shadow-md active:scale-98 disabled:opacity-70 cursor-pointer"
            >
              {isSavingPassword ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>เปลี่ยนรหัสผ่านใหม่</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SettingsPage;
