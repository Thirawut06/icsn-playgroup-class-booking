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
        throw new Error("เธเธฃเธธเธ“เธฒเธเธฃเธญเธเน€เธเธญเธฃเนเนเธ—เธฃเธจเธฑเธเธ—เนเธ—เธตเนเธ–เธนเธเธ•เนเธญเธ (9-10 เธซเธฅเธฑเธ)");
      }
      if (password.length < 6) {
        throw new Error("เธฃเธซเธฑเธชเธเนเธฒเธเธ•เนเธญเธเธกเธตเธเธงเธฒเธกเธขเธฒเธงเธญเธขเนเธฒเธเธเนเธญเธข 6 เธ•เธฑเธงเธญเธฑเธเธฉเธฃ");
      }
      if (!parentName.trim()) {
        throw new Error("เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธเธทเนเธญเธเธนเนเธเธเธเธฃเธญเธ");
      }

      const parent = await AppDB.signUp(email.trim(), password, parentName.trim(), cleanPhone);

      localStorage.setItem("icsn_parent_id", parent.id);
      localStorage.setItem("icsn_parent_name", parent.name);
      localStorage.setItem("icsn_parent_phone", parent.phone);
      localStorage.setItem("icsn_parent_email", email.trim());

      router.push('/apply');
    } catch (error: any) {
      setErrorMessage(error.message || "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”เนเธเธเธฒเธฃเธชเธกเธฑเธเธฃเธชเธกเธฒเธเธดเธ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submitSignUp} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block mb-1.5">
            <span className="text-base font-bold text-gray-800">Email Address</span>
            <span className="text-sm text-gray-500 font-normal ml-1">เธญเธตเน€เธกเธฅ</span>
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
              className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00B0B9] text-gray-800 bg-gray-50/50 transition-colors h-12 text-base"
            />
          </div>
        </div>

        <div>
          <label className="block mb-1.5">
            <span className="text-base font-bold text-gray-800">Password</span>
            <span className="text-sm text-gray-500 font-normal ml-1">เธฃเธซเธฑเธชเธเนเธฒเธ</span>
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
              placeholder="เธญเธขเนเธฒเธเธเนเธญเธข 6 เธ•เธฑเธงเธญเธฑเธเธฉเธฃ"
              className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00B0B9] text-gray-800 bg-gray-50/50 transition-colors h-12 text-base"
            />
          </div>
        </div>

        <div>
          <label className="block mb-1.5">
            <span className="text-base font-bold text-gray-800">Parent's Full Name</span>
            <span className="text-sm text-gray-500 font-normal ml-1">เธเธทเนเธญ-เธเธฒเธกเธชเธเธธเธฅ</span>
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
              placeholder="เน€เธเนเธ เธเธธเธ“เนเธกเน เธเธดเธกเธเนเธเธเธ"
              className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00B0B9] text-gray-800 bg-gray-50/50 transition-colors h-12 text-base"
            />
          </div>
        </div>

        <div>
          <label className="block mb-1.5">
            <span className="text-base font-bold text-gray-800">Phone Number</span>
            <span className="text-sm text-gray-500 font-normal ml-1">เน€เธเธญเธฃเนเนเธ—เธฃเธจเธฑเธเธ—เน</span>
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
              className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00B0B9] text-gray-800 bg-gray-50/50 transition-colors h-12 text-base"
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
              เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธเนเธญเธกเธนเธฅเนเธซเนเธเธฃเธเธ–เนเธงเธ เธฃเธซเธฑเธชเธเนเธฒเธเธ•เนเธญเธเธขเธฒเธงเธญเธขเนเธฒเธเธเนเธญเธข 6 เธ•เธฑเธงเธญเธฑเธเธฉเธฃ
            </p>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-4 bg-[#00B0B9] hover:bg-[#00969e] text-white py-3 px-4 rounded-full font-bold shadow-sm transition-all flex items-center justify-center cursor-pointer h-[52px] text-lg shrink-0 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-100"
      >
        {!loading ? (
          <div className="flex items-center gap-2 justify-center w-full">
            <span>Sign Up (เธฅเธเธ—เธฐเน€เธเธตเธขเธเนเธซเธกเน)</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Loader2 className="animate-spin h-5 w-5 text-white" />
            <span>เธเธณเธฅเธฑเธเธชเธฃเนเธฒเธเธเธฑเธเธเธตเธเธนเนเนเธเนเธเธฒเธ...</span>
          </div>
        )}
      </button>
    </form>
  );
}

