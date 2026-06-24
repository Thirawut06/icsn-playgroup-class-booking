"use client";

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppDB } from '@/lib/supabase';
import { ArrowLeft, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function LoginFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [tab, setTab] = useState<'login' | 'signup'>(
    searchParams.get('tab') === 'signup' ? 'signup' : 'login'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [parentName, setParentName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleTabSwitch = (newTab: 'login' | 'signup') => {
    if (tab !== newTab) {
      setPassword('');
      setErrorMessage('');
      setTab(newTab);
    }
  };

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      if (!email.trim() || !password.trim()) {
        throw new Error("กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน");
      }

      const parent = await AppDB.signIn(email.trim(), password);
      
      localStorage.setItem("icsn_parent_id", parent.id);
      localStorage.setItem("icsn_parent_name", parent.name);
      localStorage.setItem("icsn_parent_phone", parent.phone);

      const children = await AppDB.getChildren(parent.id);
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

  const submitSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const cleanPhone = phone.trim().replace(/\D/g, "");
      if (cleanPhone.length < 9 || cleanPhone.length > 10) {
        throw new Error("กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง (9-10 หลัก)");
      }
      if (password.length < 6) {
        throw new Error("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      }
      if (!parentName.trim()) {
        throw new Error("กรุณากรอกชื่อผู้ปกครอง");
      }

      const parent = await AppDB.signUp(email.trim(), password, parentName.trim(), cleanPhone);
      
      localStorage.setItem("icsn_parent_id", parent.id);
      localStorage.setItem("icsn_parent_name", parent.name);
      localStorage.setItem("icsn_parent_phone", parent.phone);
      
      router.push('/apply');
    } catch (error: any) {
      setErrorMessage(error.message || "เกิดข้อผิดพลาดในการสมัครสมาชิก");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen font-sarabun">
      <div className="max-w-[480px] mx-auto bg-white min-h-screen shadow-sm flex flex-col relative overflow-hidden pb-10">
        
        {/* Top banner */}
        <div 
          className="bg-[#211551] px-6 py-10 text-white text-center relative overflow-hidden bg-cover bg-center"
          style={{ backgroundImage: 'url("/playgroup-banner-icsn.png")' }}
        >
          <button onClick={() => router.push('/')} className="absolute top-4 left-4 text-white/80 hover:text-white transition-colors cursor-pointer z-20">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>
          <div className="inline-flex items-center justify-center w-28 h-auto mb-4 relative z-10">
            <img src="/white-main-logo-icsn.png" alt="ICSN Logo" className="w-full h-auto object-contain drop-shadow-sm" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight relative z-10 text-white drop-shadow-md">
            ICSN Panda Playgroup
          </h1>
        </div>

        {/* Form Container */}
        <div className="p-8 sm:p-10 flex-1">
          <div className="grid grid-cols-2 p-1.5 bg-gray-100 rounded-2xl mb-8">
            <button
              type="button"
              onClick={() => handleTabSwitch('login')}
              className={`py-2.5 text-[14px] font-bold rounded-xl transition-all cursor-pointer ${tab === 'login' ? 'bg-white text-[#00B0B9] shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Sign In (เข้าสู่ระบบ)
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('signup')}
              className={`py-2.5 text-[14px] font-bold rounded-xl transition-all cursor-pointer ${tab === 'signup' ? 'bg-white text-[#00B0B9] shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Sign Up (สมัครสมาชิก)
            </button>
          </div>

          {/* SIGN IN FORM */}
          {tab === 'login' && (
            <form onSubmit={submitLogin} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block mb-1.5">
                    <span className="text-[14px] font-bold text-gray-800">Email Address</span> 
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 z-10">
                      <Mail className="w-5 h-5" />
                    </div>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="parent@example.com"
                      className="pl-11 h-12 rounded-xl bg-gray-50/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1.5">
                    <span className="text-[14px] font-bold text-gray-800">Password</span> 
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 z-10">
                      <Lock className="w-5 h-5" />
                    </div>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="pl-11 h-12 rounded-xl bg-gray-50/50"
                    />
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-100 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{errorMessage}</p>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00B0B9] hover:bg-[#00969e] text-white py-3 px-4 rounded-full font-bold shadow-sm h-[52px] text-[16px]"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
                {loading ? 'กำลังตรวจสอบ...' : 'Sign In (เข้าสู่ระบบ)'}
              </Button>
            </form>
          )}

          {/* SIGN UP FORM */}
          {tab === 'signup' && (
            <form onSubmit={submitSignUp} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block mb-1.5">
                    <span className="text-[14px] font-bold text-gray-800">Parent Name</span> 
                  </label>
                  <Input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    required
                    placeholder="ชื่อผู้ปกครอง"
                    className="h-12 rounded-xl bg-gray-50/50"
                  />
                </div>
                <div>
                  <label className="block mb-1.5">
                    <span className="text-[14px] font-bold text-gray-800">Phone Number</span> 
                  </label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="0812345678"
                    className="h-12 rounded-xl bg-gray-50/50"
                  />
                </div>
                <div>
                  <label className="block mb-1.5">
                    <span className="text-[14px] font-bold text-gray-800">Email Address</span> 
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your.email@example.com"
                    className="h-12 rounded-xl bg-gray-50/50"
                  />
                </div>
                <div>
                  <label className="block mb-1.5">
                    <span className="text-[14px] font-bold text-gray-800">Password</span> 
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="ตั้งรหัสผ่าน 6 ตัวอักษรขึ้นไป"
                    className="h-12 rounded-xl bg-gray-50/50"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-100 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{errorMessage}</p>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#CC3366] hover:bg-[#b02b58] text-white py-3 px-4 rounded-full font-bold shadow-sm h-[52px] text-[16px]"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
                {loading ? 'กำลังลงทะเบียน...' : 'Sign Up (สมัครสมาชิก)'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#00B0B9]"/></div>}>
      <LoginFormContent />
    </Suspense>
  )
}
