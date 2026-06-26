import React, { useState } from 'react';
import { Mail, Lock, User, Phone, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AppDB } from '@/lib/supabase';

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [parentName, setParentName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
      localStorage.setItem("icsn_parent_email", email.trim());

      router.push('/apply');
    } catch (error: any) {
      setErrorMessage(error.message || "เกิดข้อผิดพลาดในการสมัครสมาชิก");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submitSignUp} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block mb-1.5">
            <span className="text-[14px] font-bold text-gray-800">Email Address</span>
            <span className="text-[12px] text-gray-500 font-normal ml-1">อีเมลผู้ปกครอง</span>
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
              placeholder="your.email@example.com"
              className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00B0B9] text-gray-800 bg-gray-50/50 transition-colors h-12 text-[14px]"
            />
          </div>
        </div>

        <div>
          <label className="block mb-1.5">
            <span className="text-[14px] font-bold text-gray-800">Password</span>
            <span className="text-[12px] text-gray-500 font-normal ml-1">รหัสผ่านตั้งใหม่</span>
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
              minLength={6}
              placeholder="อย่างน้อย 6 ตัวอักษร"
              className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00B0B9] text-gray-800 bg-gray-50/50 transition-colors h-12 text-[14px]"
            />
          </div>
        </div>

        <div>
          <label className="block mb-1.5">
            <span className="text-[14px] font-bold text-gray-800">Parent's Full Name</span>
            <span className="text-[12px] text-gray-500 font-normal ml-1">ชื่อ-นามสกุล</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 z-10">
              <User className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              required
              placeholder="เช่น คุณแม่ พิมพ์ชนก"
              className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00B0B9] text-gray-800 bg-gray-50/50 transition-colors h-12 text-[14px]"
            />
          </div>
        </div>

        <div>
          <label className="block mb-1.5">
            <span className="text-[14px] font-bold text-gray-800">Phone Number</span>
            <span className="text-[12px] text-gray-500 font-normal ml-1">เบอร์โทรศัพท์</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 z-10">
              <Phone className="w-5 h-5" />
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="e.g., 0812345678"
              className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00B0B9] text-gray-800 bg-gray-50/50 transition-colors h-12 text-[14px]"
            />
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-100 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">{errorMessage}</p>
            <p className="text-[11px] text-red-600 mt-1">
              กรุณากรอกข้อมูลให้ครบถ้วน รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร
            </p>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-4 bg-[#00B0B9] hover:bg-[#00969e] text-white py-3 px-4 rounded-full font-bold shadow-sm transition-all flex items-center justify-center cursor-pointer h-[52px] text-[16px] shrink-0 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-100"
      >
        {!loading ? (
          <div className="flex items-center gap-2 justify-center w-full">
            <span>Sign Up (ลงทะเบียนใหม่)</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Loader2 className="animate-spin h-5 w-5 text-white" />
            <span>กำลังสร้างบัญชีผู้ใช้งาน...</span>
          </div>
        )}
      </button>
    </form>
  );
}
