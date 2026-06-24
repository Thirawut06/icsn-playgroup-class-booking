"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Lock, LogOut, CheckCircle, XCircle, Users, Check, X } from 'lucide-react';

export default function Admin() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState('daily');
  const [dailyDate, setDailyDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dailyAttendance, setDailyAttendance] = useState<any[]>([]);
  const [slipsPending, setSlipsPending] = useState<any[]>([]);

  useEffect(() => {
    if (sessionStorage.getItem('icsn_admin_verified') === 'true') {
      setIsAuthorized(true);
      loadData();
    }
  }, []);

  const verifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase.functions.invoke('admin-actions', {
        body: { action: 'verify-password', password }
      });
      if (error) throw error;
      if (data?.success) {
        setIsAuthorized(true);
        sessionStorage.setItem('icsn_admin_verified', 'true');
        sessionStorage.setItem('icsn_admin_pwd', password);
        loadData();
      } else {
        throw new Error(data?.error || 'รหัสผ่านไม่ถูกต้อง');
      }
    } catch (err: any) {
      setError(err.message || 'รหัสผ่านไม่ถูกต้อง');
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    fetchDailyAttendance();
    fetchPendingSlips();
  };

  const fetchDailyAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          child:children(*),
          parent:parents(*)
        `)
        .eq('session_date', dailyDate)
        .eq('status', 'confirmed');
      if (error) throw error;
      setDailyAttendance(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPendingSlips = async () => {
    try {
      const { data, error } = await supabase
        .from('slip_uploads')
        .select(`
          *,
          parent:parents(*)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSlipsPending(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchDailyAttendance();
    }
  }, [dailyDate, isAuthorized]);

  const approveSlip = async (id: string, parentId: string) => {
    const pwd = sessionStorage.getItem('icsn_admin_pwd');
    const credits = parseInt(prompt("ระบุจำนวนเครดิตที่จะเพิ่มให้ผู้ปกครอง (เช่น 4, 10, 20):", "4") || "0", 10);
    if (!credits) return;
    
    try {
      await supabase.functions.invoke('admin-actions', {
        body: { action: 'approve-slip', password: pwd, slipId: id, parentId, creditsToAdd: credits }
      });
      fetchPendingSlips();
      alert("อนุมัติสำเร็จ");
    } catch (err) {
      alert("Error: " + err);
    }
  };

  const rejectSlip = async (id: string) => {
    const pwd = sessionStorage.getItem('icsn_admin_pwd');
    if (!confirm("แน่ใจหรือไม่ว่าต้องการปฏิเสธสลิปนี้?")) return;
    try {
      await supabase.functions.invoke('admin-actions', {
        body: { action: 'reject-slip', password: pwd, slipId: id }
      });
      fetchPendingSlips();
    } catch (err) {
      alert("Error: " + err);
    }
  };

  const logout = () => {
    sessionStorage.removeItem('icsn_admin_verified');
    sessionStorage.removeItem('icsn_admin_pwd');
    setIsAuthorized(false);
  };

  if (!isAuthorized) {
    return (
      <div className="fixed inset-0 bg-[#211551] flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl relative border border-gray-100">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-[#211551] mb-1">Class Admin Panel</h2>
            <p className="text-[11px] text-gray-500 mt-2">กรุณากรอกรหัสผ่านเพื่อปลดล็อกแผงผู้ดูแลระบบ</p>
          </div>
          <form onSubmit={verifyPassword} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="รหัสผ่านผู้ดูแลระบบ" className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:border-[#00B0B9] focus:outline-none" />
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-[#00B0B9] text-white py-3 rounded-xl font-bold hover:bg-[#00969e]">
              {loading ? 'กำลังตรวจสอบ...' : 'Unlock Admin Panel'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sarabun">
      <header className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-gray-800 text-lg">Admin Dashboard</h1>
          </div>
          <button onClick={logout} className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 transition px-3 py-1.5 rounded-lg border">
            <LogOut className="w-4 h-4" /> <span>Lock</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-2 mb-6 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
          <button onClick={() => setActiveTab('daily')} className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${activeTab === 'daily' ? 'bg-[#211551] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Users className="w-4 h-4" /> ใบเช็คชื่อ
          </button>
          <button onClick={() => setActiveTab('slips')} className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${activeTab === 'slips' ? 'bg-[#CC3366] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            <CheckCircle className="w-4 h-4" /> สลิปที่รอตรวจ {slipsPending.length > 0 && <span className="bg-red-500 text-white text-[10px] px-2 rounded-full">{slipsPending.length}</span>}
          </button>
        </div>

        {activeTab === 'daily' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-lg">รายชื่อเด็กเข้าเรียน</h2>
              <input type="date" value={dailyDate} onChange={e => setDailyDate(e.target.value)} className="border p-2 rounded-lg text-sm" />
            </div>
            
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="p-3">ลำดับ</th>
                  <th className="p-3">ชื่อเล่น</th>
                  <th className="p-3">ชื่อจริง</th>
                  <th className="p-3">ผู้ปกครอง</th>
                  <th className="p-3">เบอร์โทร</th>
                  <th className="p-3 text-center">เข้าเรียน</th>
                </tr>
              </thead>
              <tbody>
                {dailyAttendance.length === 0 ? (
                  <tr><td colSpan={6} className="text-center p-6 text-gray-500">ไม่มีรายชื่อจองในวันนี้</td></tr>
                ) : (
                  dailyAttendance.map((bk, i) => (
                    <tr key={bk.id} className="border-t">
                      <td className="p-3">{i + 1}</td>
                      <td className="p-3 font-bold">{bk.child?.nickname}</td>
                      <td className="p-3">{bk.child?.full_name}</td>
                      <td className="p-3">{bk.parent?.name}</td>
                      <td className="p-3">{bk.parent?.phone}</td>
                      <td className="p-3 text-center">
                        <div className="w-6 h-6 border rounded border-gray-300 mx-auto"></div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'slips' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="font-bold text-lg mb-6">ตรวจสอบสลิปโอนเงิน</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {slipsPending.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500">ไม่มีสลิปรอตรวจสอบ</div>
              ) : (
                slipsPending.map(slip => (
                  <div key={slip.id} className="border rounded-2xl overflow-hidden shadow-sm flex flex-col">
                    <div className="bg-gray-100 p-2 text-center h-48 flex items-center justify-center">
                      <a href={slip.file_url} target="_blank" rel="noreferrer">
                        <img src={slip.file_url} alt="slip" className="max-h-full object-contain cursor-pointer hover:opacity-90" />
                      </a>
                    </div>
                    <div className="p-4 flex-1">
                      <p className="text-xs text-gray-500">ผู้ปกครอง:</p>
                      <h3 className="font-bold">{slip.parent?.name}</h3>
                      <p className="text-sm">{slip.parent?.phone}</p>
                      <p className="text-xs text-gray-400 mt-2">เวลาส่ง: {new Date(slip.created_at).toLocaleString('th-TH')}</p>
                    </div>
                    <div className="flex border-t divide-x">
                      <button onClick={() => approveSlip(slip.id, slip.parent_id)} className="flex-1 py-3 text-green-600 hover:bg-green-50 font-bold flex justify-center items-center gap-1">
                        <Check className="w-4 h-4" /> อนุมัติ + เติมเครดิต
                      </button>
                      <button onClick={() => rejectSlip(slip.id)} className="px-4 py-3 text-red-500 hover:bg-red-50">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}





