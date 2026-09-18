import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User as UserIcon, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotNotice, setShowForgotNotice] = useState(false);

  // Target to redirect after login (default /dashboard)
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim()) {
      setErrorMessage('กรุณากรอก USERNAME หรือ อีเมล');
      return;
    }

    if (!password) {
      setErrorMessage('กรุณากรอก PASSWORD');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(username, password, true);
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setErrorMessage(result.error || 'USERNAME หรือ PASSWORD ไม่ถูกต้อง');
      }
    } catch {
      setErrorMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = () => {
    setUsername('Admin@gmail.com');
    setPassword('12345Test!');
    setErrorMessage('');
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 overflow-hidden bg-[#1e53db] select-none">
      {/* Background Decorative Wavy Arcs / Circles matching the reference image */}
      <div className="absolute -bottom-36 -left-36 h-[520px] w-[520px] rounded-full border border-blue-400/20 pointer-events-none" />
      <div className="absolute -bottom-52 -left-52 h-[680px] w-[680px] rounded-full border border-blue-400/15 pointer-events-none" />
      <div className="absolute -bottom-72 -left-72 h-[860px] w-[860px] rounded-full border border-blue-400/10 pointer-events-none" />
      <div className="absolute -top-40 -right-40 h-[480px] w-[480px] rounded-full bg-blue-400/15 blur-3xl pointer-events-none" />

      {/* Main Login Container */}
      <div className="relative z-10 w-full max-w-[340px] sm:max-w-[370px] flex flex-col items-center">
        {/* App Logo (Marketplace) */}
        <div
          className="mb-8 cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95 flex items-center justify-center"
          onClick={handleQuickFill}
          title="คลิกที่โลโก้เพื่อกรอกรหัส Admin อัตโนมัติ"
        >
          <img
            src="/logo.png"
            alt="Marketplace Logo"
            className="h-24 w-auto max-w-[170px] object-contain brightness-0 invert drop-shadow-sm select-none"
          />
        </div>

        {/* Error Notification Alert */}
        {errorMessage && (
          <div className="w-full mb-4 flex items-center gap-2 rounded-lg bg-rose-600/90 text-white px-3.5 py-2.5 text-xs font-semibold shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-white" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          {/* USERNAME Field */}
          <div className="relative flex items-center rounded-lg border border-blue-300/50 bg-blue-600/20 transition-all focus-within:border-white focus-within:bg-blue-600/40">
            <div className="pl-3.5 pr-2 pointer-events-none text-white/90">
              <UserIcon className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="USERNAME"
              autoComplete="username"
              required
              className="w-full bg-transparent py-2.5 pr-3 text-xs sm:text-sm font-semibold text-white uppercase tracking-wider placeholder:text-blue-200/70 placeholder:font-medium placeholder:tracking-wider outline-none"
              style={{ color: '#ffffff' }}
            />
          </div>

          {/* PASSWORD Field */}
          <div className="relative flex items-center rounded-lg border border-blue-300/50 bg-blue-600/20 transition-all focus-within:border-white focus-within:bg-blue-600/40">
            <div className="pl-3.5 pr-2 pointer-events-none text-white/90">
              <Lock className="h-4 w-4" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="PASSWORD"
              autoComplete="current-password"
              required
              className="w-full bg-transparent py-2.5 pr-3 text-xs sm:text-sm font-semibold text-white tracking-wider placeholder:text-blue-200/70 placeholder:font-medium placeholder:tracking-wider outline-none font-mono"
              style={{ color: '#ffffff' }}
            />
          </div>

          {/* LOGIN Button (White button with blue text) */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-white py-2.5 px-4 text-center text-xs sm:text-sm font-black uppercase tracking-widest text-[#1e53db] shadow-md transition-all duration-200 hover:bg-slate-50 hover:shadow-lg active:scale-[0.99] disabled:opacity-80 cursor-pointer"
            >
              {isLoading ? 'LOGGING IN...' : 'LOGIN'}
            </button>
          </div>
        </form>

        {/* Forgot password? link */}
        <button
          type="button"
          onClick={() => setShowForgotNotice(!showForgotNotice)}
          className="mt-4 text-xs font-medium text-white/85 hover:text-white transition-colors cursor-pointer"
        >
          Forgot password?
        </button>

        {/* Forgot password hint notice modal / popup */}
        {showForgotNotice && (
          <div className="mt-3 w-full rounded-lg bg-white/10 backdrop-blur-md border border-white/20 p-3 text-center text-xs text-white animate-in fade-in slide-in-from-top-1">
            <p className="font-semibold">ข้อมูลผู้ดูแลระบบตั้งต้น:</p>
            <p className="mt-1 font-mono text-[11px] text-blue-100">
              User: <span className="font-bold text-white">Admin@gmail.com</span> | Pass: <span className="font-bold text-white">12345Test!</span>
            </p>
            <button
              type="button"
              onClick={handleQuickFill}
              className="mt-2 text-[11px] font-bold text-blue-200 underline hover:text-white cursor-pointer"
            >
              คลิกเพื่อใส่ข้อมูลให้อัตโนมัติ
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
