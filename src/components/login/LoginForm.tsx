import React, { useState } from 'react';
import { Mail, Lock, User, Phone, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ParentService, supabase } from '@/lib/supabase';
import { STORAGE_KEYS } from '@/config/constants';
import { COPY } from '@/config/copy';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCompletingProfile, setIsCompletingProfile] = useState(false);
  const [completeName, setCompleteName] = useState('');
  const [completePhone, setCompletePhone] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      if (isCompletingProfile) {
        const cleanPhone = completePhone.trim().replace(/\D/g, "");
        if (cleanPhone.length < 9 || cleanPhone.length > 10) {
          throw new Error("กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง (9-10 หลัก)");
        }
        if (!completeName.trim()) {
          throw new Error("กรุณากรอกชื่อผู้ปกครอง");
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("ไม่พบข้อมูลผู้ใช้");

        const parent = await ParentService.completeProfile(user.id, completeName.trim(), cleanPhone);
        localStorage.setItem(STORAGE_KEYS.PARENT_ID, parent.id);
        localStorage.setItem(STORAGE_KEYS.PARENT_NAME, parent.name);
        localStorage.setItem(STORAGE_KEYS.PARENT_PHONE, parent.phone);
        localStorage.setItem(STORAGE_KEYS.PARENT_EMAIL, email.trim());
        
        router.push('/apply');
        return;
      }

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
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'PROFILE_MISSING') {
        setIsCompletingProfile(true);
        setErrorMessage('');
      } else {
        const msg = error instanceof Error && error.message ? error.message : "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";
        setErrorMessage(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submitLogin} className="space-y-6">
      <div className="space-y-4">
        {isCompletingProfile ? (
          <>
            <div className="bg-warning/10 p-4 rounded-xl border border-warning/30 mb-6">
              <p className="text-warning text-sm font-medium text-center">
                พบบัญชีของคุณแล้ว แต่ข้อมูลยังไม่สมบูรณ์<br/>
                กรุณากรอกชื่อและเบอร์โทรศัพท์เพื่อดำเนินการต่อ
              </p>
            </div>
            <div>
              <label className="block mb-1.5">
                <span className="text-base font-bold text-foreground">Parent&apos;s Full Name</span>
                <span className="text-sm text-muted-foreground font-normal ml-1">{COPY.AUTH.NAME_LABEL}</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground/70 z-10">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={completeName}
                  onChange={(e) => setCompleteName(e.target.value)}
                  required
                  placeholder="ชื่อ-นามสกุล ผู้ปกครอง"
                  className="block w-full pl-11 pr-4 py-3 border border-border rounded-xl focus:outline-none focus:border-icsn-teal text-foreground bg-muted/50 transition-colors h-12 text-base"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1.5">
                <span className="text-base font-bold text-foreground">Phone Number</span>
                <span className="text-sm text-muted-foreground font-normal ml-1">{COPY.AUTH.PHONE_LABEL}</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground/70 z-10">
                  <Phone className="w-5 h-5" />
                </div>
                <input
                  type="tel"
                  value={completePhone}
                  onChange={(e) => setCompletePhone(e.target.value)}
                  required
                  placeholder="08XXXXXXXX"
                  className="block w-full pl-11 pr-4 py-3 border border-border rounded-xl focus:outline-none focus:border-icsn-teal text-foreground bg-muted/50 transition-colors h-12 text-base"
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block mb-1.5">
                <span className="text-base font-bold text-foreground">Email Address</span>
                <span className="text-sm text-muted-foreground font-normal ml-1">{COPY.AUTH.EMAIL_LABEL}</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground/70 z-10">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="parent@example.com"
                  className="block w-full pl-11 pr-4 py-3 border border-border rounded-xl focus:outline-none focus:border-icsn-teal text-foreground bg-muted/50 transition-colors h-12 text-base"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1.5">
                <span className="text-base font-bold text-foreground">Password</span>
                <span className="text-sm text-muted-foreground font-normal ml-1">{COPY.AUTH.PASSWORD_LABEL}</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground/70 z-10">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="block w-full pl-11 pr-4 py-3 border border-border rounded-xl focus:outline-none focus:border-icsn-teal text-foreground bg-muted/50 transition-colors h-12 text-base"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {errorMessage && (
        <div className="bg-error/10 text-error p-4 rounded-xl text-sm border border-error/20 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">{errorMessage}</p>
            {!isCompletingProfile && (
              <p className="text-xs text-error mt-1">
                ไม่สามารถเข้าสู่ระบบได้ กรุณาตรวจสอบข้อมูลหรือสมัครสมาชิกใหม่
              </p>
            )}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-icsn-navy hover:bg-icsn-navy/90 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-sm disabled:opacity-50 flex justify-center items-center h-12 text-base"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          isCompletingProfile ? "บันทึกข้อมูล (Save)" : "เข้าสู่ระบบ (Sign In)"
        )}
      </button>
    </form>
  );
}

