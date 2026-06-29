import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ParentService } from '@/lib/supabase';
import { STORAGE_KEYS } from '@/config/constants';
import { COPY } from '@/config/copy';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      if (!email.trim() || !password.trim()) {
        throw new Error("กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน");
      }

      const parent = await ParentService.signIn(email.trim(), password);

      localStorage.setItem(STORAGE_KEYS.PARENT_ID, parent.id);
      localStorage.setItem(STORAGE_KEYS.PARENT_NAME, parent.name);
      localStorage.setItem(STORAGE_KEYS.PARENT_PHONE, parent.phone);
      localStorage.setItem(STORAGE_KEYS.PARENT_EMAIL, email.trim());

      const children = await ParentService.getChildren(parent.id);
      if (children && children.length > 0) {
        router.push('/book');
      } else {
        router.push('/apply');
      }
    } catch (error: any) {
      let msg = error.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submitLogin} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block mb-1.5">
            <span className="text-base font-bold text-gray-800">Email Address</span>
            <span className="text-sm text-gray-500 font-normal ml-1">{COPY.AUTH.EMAIL_LABEL}</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 z-10">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="parent@example.com"
              className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-icsn-teal text-gray-800 bg-gray-50/50 transition-colors h-12 text-base"
            />
          </div>
        </div>

        <div>
          <label className="block mb-1.5">
            <span className="text-base font-bold text-gray-800">Password</span>
            <span className="text-sm text-gray-500 font-normal ml-1">{COPY.AUTH.PASSWORD_LABEL}</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 z-10">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-icsn-teal text-gray-800 bg-gray-50/50 transition-colors h-12 text-base"
            />
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-100 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">{errorMessage}</p>
            <p className="text-xs text-red-600 mt-1">
              ไม่สามารถเข้าสู่ระบบได้ กรุณาตรวจสอบข้อมูลหรือสมัครสมาชิกใหม่
            </p>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-4 bg-icsn-teal hover:bg-icsn-teal/90 text-white py-3 px-4 rounded-full font-bold shadow-sm transition-all flex items-center justify-center cursor-pointer h-[52px] text-lg shrink-0 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-100"
      >
        {!loading ? (
          <div className="flex items-center gap-2 justify-center w-full">
            <span>{COPY.AUTH.SIGN_IN_BTN}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Loader2 className="animate-spin h-5 w-5 text-white" />
            <span>{COPY.AUTH.SIGNING_IN}</span>
          </div>
        )}
      </button>
    </form>
  );
}

