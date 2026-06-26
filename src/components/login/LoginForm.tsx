import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AppDB } from '@/lib/supabase';

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
        throw new Error("เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธญเธตเน€เธกเธฅเนเธฅเธฐเธฃเธซเธฑเธชเธเนเธฒเธเนเธซเนเธเธฃเธเธ–เนเธงเธ");
      }

      const parent = await AppDB.signIn(email.trim(), password);

      localStorage.setItem("icsn_parent_id", parent.id);
      localStorage.setItem("icsn_parent_name", parent.name);
      localStorage.setItem("icsn_parent_phone", parent.phone);
      localStorage.setItem("icsn_parent_email", email.trim());

      const children = await AppDB.getChildren(parent.id);
      if (children && children.length > 0) {
        router.push('/book');
      } else {
        router.push('/apply');
      }
    } catch (error: any) {
      let msg = error.message || "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”เนเธเธเธฒเธฃเน€เธเนเธฒเธชเธนเนเธฃเธฐเธเธ";
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
              placeholder="parent@example.com"
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
              placeholder="โ€ขโ€ขโ€ขโ€ขโ€ขโ€ขโ€ขโ€ข"
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
              เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เน€เธเนเธฒเธชเธนเนเธฃเธฐเธเธเนเธ”เน เธเธฃเธธเธ“เธฒเธ•เธฃเธงเธเธชเธญเธเธเนเธญเธกเธนเธฅเธซเธฃเธทเธญเธชเธกเธฑเธเธฃเธชเธกเธฒเธเธดเธเนเธซเธกเน
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
            <span>Sign In (เน€เธเนเธฒเธชเธนเนเธฃเธฐเธเธ)</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Loader2 className="animate-spin h-5 w-5 text-white" />
            <span>เธเธณเธฅเธฑเธเธ•เธฃเธงเธเธชเธญเธเธเนเธญเธกเธนเธฅ...</span>
          </div>
        )}
      </button>
    </form>
  );
}

