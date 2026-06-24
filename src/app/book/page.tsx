"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppDB } from '@/lib/supabase';
import { LogOut, Calendar, Plus, Wallet, ChevronLeft, ChevronRight, User, Loader2, CheckCircle2, AlertCircle, X, UploadCloud } from 'lucide-react';
import type { Child, Package, Session, PackageOption } from '@/types';

export default function Book() {
  const router = useRouter();
  const [parentId, setParentId] = useState('');
  const [parentName, setParentName] = useState('');
  const [creditsRemaining, setCreditsRemaining] = useState(0);
  const [children, setChildren] = useState<Child[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [paymentPackages, setPaymentPackages] = useState<PackageOption[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [monthIndex, setMonthIndex] = useState(0); // 0 = current, 1 = next
  
  // Selection
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [bookedCount, setBookedCount] = useState(0);

  // Modals
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  
  // Top Up Form
  const [packageType, setPackageType] = useState('');
  const [paymentSlipData, setPaymentSlipData] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const pId = localStorage.getItem('icsn_parent_id');
    if (!pId) {
      router.push('/login');
      return;
    }
    setParentId(pId);
    loadData(pId);
  }, [router]);

  const loadData = async (pId: string) => {
    setLoading(true);
    try {
      const parent = await AppDB.getParentDetails(pId);
      if (parent) {
        setParentName(parent.name);
        setChildren(parent.children || []);
        if (parent.children?.length > 0) {
          setSelectedChildId(parent.children[0].id);
        }
      }

      const pkgs = await AppDB.getPackages(pId);
      setPackages(pkgs);
      const totalCredits = pkgs.reduce((sum, pkg) => sum + pkg.credits_remaining, 0);
      setCreditsRemaining(totalCredits);

      const pkgOptions = await AppDB.getPackageOptions();
      setPaymentPackages(pkgOptions);

      // Load sessions for current month and next month
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0).toISOString().split('T')[0];
      const loadedSessions = await AppDB.getSessions(startDate, endDate);
      setSessions(loadedSessions);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const currentViewDate = new Date();
  currentViewDate.setMonth(currentViewDate.getMonth() + monthIndex);
  const monthName = currentViewDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });

  // Generate calendar grid
  const getDaysInMonth = () => {
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const session = sessions.find(s => s.session_date === dateStr);
      days.push({ day: i, dateStr, session });
    }
    return days;
  };

  const handleDateSelect = async (sessionObj: any) => {
    if (!sessionObj?.session) return;
    setSelectedDate(sessionObj.dateStr);
    setSelectedSession(sessionObj.session);
    
    // Fetch current booked count for real capacity
    try {
      const count = await AppDB.getBookedCountForSession(sessionObj.session.id);
      setBookedCount(count);
    } catch (e) {
      setBookedCount(0);
    }
  };

  const handleBookClass = async () => {
    if (!selectedSession || !selectedChildId || packages.length === 0) {
      alert("กรุณาเลือกน้อง และตรวจสอบเครดิตคงเหลือ");
      return;
    }
    const pkgToUse = packages[0]; // simplistic strategy
    setIsSubmitting(true);
    try {
      await AppDB.bookClass(parentId, selectedChildId, selectedSession.id, pkgToUse.id);
      alert("จองคลาสสำเร็จ!");
      setSelectedDate(null);
      loadData(parentId);
    } catch (e: any) {
      alert("ไม่สามารถจองได้: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageType || !paymentSlipData) return;
    setIsSubmitting(true);
    try {
      await AppDB.submitTopUp(parentId, packageType, paymentSlipData);
      alert("ส่งสลิปสำเร็จ รอเจ้าหน้าที่ตรวจสอบ");
      setShowTopUpModal(false);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => setPaymentSlipData(evt.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen">
      <div className="max-w-[480px] mx-auto bg-white min-h-screen shadow-sm flex flex-col relative pb-20">
        
        {/* Header */}
        <div className="bg-[#211551] text-white px-6 pt-10 pb-6 rounded-b-[30px] relative overflow-hidden" style={{ backgroundImage: 'url("/playgroup-banner-icsn.png")', backgroundSize: 'cover' }}>
          <div className="absolute inset-0 bg-[#211551]/80"></div>
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-[13px] text-white/80 font-medium mb-1">Welcome back,</p>
              <h1 className="text-xl font-bold">{parentName}</h1>
            </div>
            <button onClick={handleLogout} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
              <LogOut className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="relative z-10 mt-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-white/70 uppercase tracking-wider font-bold mb-0.5">Available Credits</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-[#00B0B9] drop-shadow-sm">{creditsRemaining}</span>
                <span className="text-sm font-medium text-white/90">ครั้ง</span>
              </div>
            </div>
            <button onClick={() => setShowTopUpModal(true)} className="bg-white text-[#211551] hover:bg-gray-50 font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-1.5 shadow-sm">
              <Wallet className="w-4 h-4" /> Top Up
            </button>
          </div>
        </div>

        {/* Children Selector */}
        <div className="px-6 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-[#211551]">Select Child <span className="text-xs font-normal text-gray-500">(เลือกน้อง)</span></h2>
            <button onClick={() => router.push('/apply')} className="text-[#00B0B9] text-xs font-bold flex items-center gap-1 bg-[#00B0B9]/10 px-2 py-1 rounded-lg">
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
            {children.map(child => (
              <button 
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-colors ${selectedChildId === child.id ? 'border-[#00B0B9] bg-[#00B0B9]/5 text-[#211551]' : 'border-gray-100 bg-white text-gray-500'}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${selectedChildId === child.id ? 'bg-[#00B0B9] text-white' : 'bg-gray-100'}`}>
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-sm">{child.nickname}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Calendar */}
        <div className="px-6 mt-6 flex-1">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-6">
            <div className="flex items-center justify-between p-4 border-b border-gray-50">
              <button onClick={() => setMonthIndex(0)} className={`p-1.5 rounded-lg ${monthIndex === 0 ? 'text-gray-300' : 'text-[#211551] hover:bg-gray-50'}`} disabled={monthIndex === 0}>
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="font-bold text-[#211551] text-[15px]">{monthName}</h3>
              <button onClick={() => setMonthIndex(1)} className={`p-1.5 rounded-lg ${monthIndex === 1 ? 'text-gray-300' : 'text-[#211551] hover:bg-gray-50'}`} disabled={monthIndex === 1}>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase">{d}</div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth().map((dayObj, i) => {
                  if (!dayObj) return <div key={`empty-${i}`} className="h-10"></div>;
                  
                  const isAvailable = !!dayObj.session;
                  const isSelected = selectedDate === dayObj.dateStr;
                  const isPast = new Date(dayObj.dateStr) < new Date(new Date().setHours(0,0,0,0));
                  
                  let bgClass = "bg-white border border-gray-100 text-gray-400";
                  if (isAvailable && !isPast) bgClass = "bg-[#00B0B9]/10 text-[#211551] font-bold border border-transparent";
                  if (isSelected) bgClass = "bg-[#00B0B9] text-white font-bold border border-[#00B0B9] shadow-md";

                  return (
                    <button
                      key={dayObj.dateStr}
                      disabled={!isAvailable || isPast}
                      onClick={() => handleDateSelect(dayObj)}
                      className={`h-10 w-full rounded-xl flex items-center justify-center text-sm transition-all ${bgClass}`}
                    >
                      {dayObj.day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected Session Info */}
          {selectedSession && (
            <div className="bg-white border-2 border-[#00B0B9] rounded-2xl p-5 mb-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-[#211551] text-lg">{new Date(selectedSession.session_date).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long'})}</h3>
                  <p className="text-sm text-gray-500">เวลา 09:30 - 11:30</p>
                </div>
                <div className="bg-[#00B0B9]/10 text-[#00B0B9] px-3 py-1 rounded-lg text-sm font-bold border border-[#00B0B9]/20">
                  {selectedSession.total_capacity - bookedCount} ว่าง
                </div>
              </div>
              <button
                onClick={handleBookClass}
                disabled={isSubmitting || creditsRemaining < 1 || (selectedSession.total_capacity - bookedCount <= 0)}
                className="w-full bg-[#00B0B9] text-white font-bold py-3.5 rounded-xl disabled:bg-gray-300 transition-colors flex justify-center items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Confirm Booking (1 Credit)</span>}
              </button>
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white border-t border-gray-100 flex justify-around p-3 z-50 pb-safe">
          <button onClick={() => router.push('/book')} className="flex flex-col items-center gap-1 text-[#00B0B9]">
            <Calendar className="w-6 h-6" />
            <span className="text-[10px] font-bold">Book Class</span>
          </button>
          <button onClick={() => router.push('/my-bookings')} className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#211551] transition-colors">
            <CheckCircle2 className="w-6 h-6" />
            <span className="text-[10px] font-bold">My Bookings</span>
          </button>
        </div>

        {/* Top Up Modal */}
        {showTopUpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm max-w-[480px] mx-auto">
            <div className="bg-white w-full rounded-2xl p-6 relative">
              <button onClick={() => setShowTopUpModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-[#211551] mb-4">Top Up Credits</h2>
              <form onSubmit={submitTopUp} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Select Package</label>
                  <select value={packageType} onChange={e => setPackageType(e.target.value)} className="w-full p-3 border rounded-xl" required>
                    <option value="">-- เลือกแพ็กเกจ --</option>
                    {paymentPackages.map(p => (
                      <option key={p.id} value={p.name}>{p.name} - {p.price} บาท</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-center p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-100">
                    <UploadCloud className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm font-bold text-gray-700">อัปโหลดสลิปโอนเงิน</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFile} required />
                  </label>
                  {paymentSlipData && <img src={paymentSlipData} alt="Slip" className="h-32 mt-2 rounded-lg mx-auto object-cover" />}
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full bg-[#00B0B9] text-white py-3 rounded-xl font-bold flex justify-center">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Payment'}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}





