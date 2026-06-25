"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppDB } from '@/lib/supabase';
import { LogOut, CalendarHeart, Ticket, Calendar as CalendarIcon, ChevronLeft, ChevronRight, ReceiptText, Hand, CheckCircle2, AlertCircle, Info, Loader2, Wallet, User, UploadCloud, X, Plus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
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

  // Modals / Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [showTopUpModal, setShowTopUpModal] = useState(false);

  // Top Up Form
  const [packageType, setPackageType] = useState('');
  const [paymentSlipData, setPaymentSlipData] = useState('');

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
  
  const getThaiMonthName = (date: Date) => {
    const thaiMonths = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    return `${thaiMonths[date.getMonth()]} ${date.getFullYear() + 543}`;
  };

  const monthName = getThaiMonthName(currentViewDate);

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

  const handleDateSelect = async (dayObj: any) => {
    setBookingSuccess(false);
    setBookingError('');
    setSelectedDate(dayObj.dateStr);
    setSelectedSession(dayObj.session || null);
    
    if (dayObj.session) {
      try {
        const count = await AppDB.getBookedCountForSession(dayObj.session.id);
        setBookedCount(count);
      } catch (e) {
        setBookedCount(0);
      }
    } else {
      setBookedCount(0);
    }
  };

  const handleBookClass = async () => {
    if (!selectedDate || !selectedChildId || packages.length === 0) {
      setBookingError("กรุณาเลือกน้อง และตรวจสอบเครดิตคงเหลือ");
      return;
    }
    const pkgToUse = packages[0];
    setIsSubmitting(true);
    setBookingError('');
    try {
      let finalSessionId = selectedSession?.id;
      if (!finalSessionId) {
         // Create session on the fly if it doesn't exist
         const newSess = await AppDB.getOrCreateSession(selectedDate);
         finalSessionId = newSess.id;
      }
      
      const hasDuplicate = await AppDB.hasDuplicateBooking(selectedChildId, finalSessionId);
      if (hasDuplicate) {
        throw new Error("คุณได้จองสิทธิ์ให้น้องในรอบเวลานี้ไปแล้ว");
      }
      
      await AppDB.bookClass(parentId, selectedChildId, finalSessionId, pkgToUse.id);
      setBookingSuccess(true);
      loadData(parentId);
      setTimeout(() => {
        setSelectedDate(null);
        setBookingSuccess(false);
      }, 3000);
    } catch (e: any) {
      setBookingError("ไม่สามารถจองได้: " + e.message);
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
      setPaymentSlipData('');
      setPackageType('');
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

  // Logic checks
  const checkIsBookableDate = (dateStr: string) => {
    const targetDate = new Date(dateStr);
    targetDate.setHours(0,0,0,0);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (targetDate < today) return false;
    if (targetDate.getTime() === today.getTime() && new Date().getHours() >= 7) return false;
    
    // Only Weekdays
    const dayOfWeek = targetDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return false;
    
    return true;
  };

  const capacity = selectedSession ? selectedSession.total_capacity : 15;
  const isSameDayPast7AM = selectedDate ? (new Date(selectedDate).toDateString() === new Date().toDateString() && new Date().getHours() >= 7) : false;
  const selectedDateAvailable = selectedDate ? (capacity - bookedCount > 0 && !isSameDayPast7AM) : false;
  const selectedSessionStatus = selectedDateAvailable ? 'เปิดรับจอง' : 'เต็มแล้ว / ปิดรับจอง';
  
  const selectedChildObj = children.find(c => c.id === selectedChildId);
  
  let selectedThaiMonthMin = '';
  let selectedDayNum = '';
  let selectedThaiFullDate = '';
  
  if (selectedDate) {
    const d = new Date(selectedDate);
    const thaiMonthsMin = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    selectedThaiMonthMin = thaiMonthsMin[d.getMonth()];
    selectedDayNum = String(d.getDate());
    selectedThaiFullDate = d.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  return (
    <div className="bg-white flex flex-col min-h-screen pb-16">
      <div className="max-w-[480px] mx-auto w-full bg-white min-h-screen shadow-[0_0_20px_rgba(0,0,0,0.05)] flex flex-col relative overflow-hidden">
        
        {/* Sticky Top Header */}
        <header className="bg-white/90 backdrop-blur-md shadow-xs sticky top-0 z-50">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-10 h-auto">
                <Image src="/main-logo-icsn.png" alt="ICSN Logo" width={48} height={48} className="w-full h-auto object-contain" priority />
              </div>
              <div>
                <h1 className="font-bold text-[#211551] text-[14px] leading-none">
                  ICSN Panda Playgroup
                </h1>
                <p className="text-[10px] text-[#00B0B9] font-extrabold tracking-wider mt-0.5">
                  PLAY & LEARN
                </p>
              </div>
            </div>

            {/* Header actions / Navigation */}
            <div className="flex items-center gap-2">
              <Link href="/my-bookings" className="inline-flex items-center justify-center w-10 h-10 bg-gray-50 text-gray-600 hover:text-[#00B0B9] hover:bg-[#00B0B9]/10 rounded-[14px] transition active:scale-95">
                <CalendarHeart className="w-5 h-5" />
              </Link>
              <button onClick={handleLogout} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 rounded-[14px] hover:bg-red-50 transition active:scale-95" title="Log out">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Container */}
        <main className="flex-1 px-4 py-5 space-y-5">
          
          {/* Top Section: Profile & Quick Actions */}
          <div className="bg-white rounded-[20px] p-4 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#00B0B9]/10 flex items-center justify-center overflow-hidden border border-[#00B0B9]/20 shrink-0">
                {/* Simulated Parent Avatar using Dicebear */}
                <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${parentName || 'Parent'}&backgroundColor=e2e8f0`} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-[#211551] leading-tight">
                  {parentName || 'คุณพ่อ/คุณแม่'}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[12px] text-gray-500 font-medium">สิทธิ์เรียน:</span>
                  <span className="text-[15px] font-black text-[#00B0B9]">{creditsRemaining}</span>
                  <span className="text-[11px] text-gray-500 font-medium">ครั้ง</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setShowTopUpModal(true)} 
              className="bg-[#211551] text-white hover:bg-[#2d1d6e] font-bold px-4 py-2.5 rounded-[14px] text-[12px] flex items-center gap-1.5 shadow-md transition active:scale-95 shrink-0"
            >
              <Wallet className="w-4 h-4" /> Top Up
            </button>
          </div>

          {/* Step 1: Select Child */}
          <div className="bg-white rounded-[20px] border border-gray-100 p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[#211551] flex items-center gap-1.5 text-[15px]">
                <User className="w-5 h-5 text-[#00B0B9]" />
                <span>1. เลือกรายชื่อนักเรียน</span>
              </h3>
              <Link href="/apply?addChild=true" className="text-[12px] font-bold text-[#00B0B9] flex items-center gap-1 bg-[#00B0B9]/10 px-3 py-2 rounded-xl hover:bg-[#00B0B9]/20 transition active:scale-95 border border-[#00B0B9]/10">
                <Plus className="w-3.5 h-3.5" /> เพิ่มชื่อน้อง
              </Link>
            </div>
            
            <div className="relative">
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="w-full text-[15px] px-4 py-3.5 border border-gray-200 rounded-[14px] focus:outline-none focus:ring-2 focus:ring-[#00B0B9] focus:border-transparent bg-gray-50 hover:bg-gray-100 transition text-[#211551] font-bold appearance-none cursor-pointer"
              >
                {children.length === 0 && <option value="">-- ยังไม่มีรายชื่อนักเรียน --</option>}
                {children.map(child => (
                  <option key={child.id} value={child.id}>
                    {child.nickname} ({child.full_name})
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400">
                 <ChevronRight className="w-4 h-4 rotate-90" />
              </div>
            </div>
          </div>

          {/* Step 2: Calendar Column */}
          <div className="bg-white rounded-[20px] border border-gray-100 p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-[#211551] flex items-center gap-1.5 text-[15px]">
                <CalendarIcon className="w-5 h-5 text-[#00B0B9]" />
                <span>2. เลือกวันที่เรียน</span>
              </h3>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMonthIndex(0)}
                  className="p-2 hover:bg-gray-50 rounded-xl transition text-[#211551] disabled:opacity-30 disabled:hover:bg-transparent"
                  disabled={monthIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h4 className="text-[13px] font-bold text-[#211551] bg-gray-50 px-2.5 py-1.5 rounded-xl">
                  {monthName}
                </h4>
                <button
                  onClick={() => setMonthIndex(1)}
                  className="p-2 hover:bg-gray-50 rounded-xl transition text-[#211551] disabled:opacity-30 disabled:hover:bg-transparent"
                  disabled={monthIndex === 1}
                  title="ดูรอบเรียนล่วงหน้า 2 เดือน"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Thai Week Names */}
            <div className="grid grid-cols-7 text-center text-[12px] font-bold text-gray-400">
              <div>อา</div><div>จ</div><div>อ</div><div>พ</div><div>พฤ</div><div>ศ</div><div>ส</div>
            </div>

            {/* Calendar Grid dates */}
            <div className="grid grid-cols-7 gap-1.5 text-center font-bold text-[15px]">
              {getDaysInMonth().map((dayObj, i) => {
                if (!dayObj) return <div key={`empty-${i}`} className="py-2 text-transparent"></div>;
                
                const isBookable = checkIsBookableDate(dayObj.dateStr);
                const isSelected = selectedDate === dayObj.dateStr;
                
                let btnClass = "text-gray-300 bg-gray-50/50";
                
                if (isBookable) {
                   // Bookable Future Weekday
                   if (isSelected) {
                     btnClass = "bg-[#00B0B9] text-white shadow-md font-black scale-[1.05]";
                   } else {
                     btnClass = "text-[#211551] bg-white border border-gray-100 hover:border-[#00B0B9]/30 hover:bg-[#00B0B9]/5";
                   }
                } else {
                   // Past day, Weekend, or full
                   // Give a slight visual indicator if it's a future day but not bookable (like weekend)
                   const isFuture = new Date(dayObj.dateStr) >= new Date(new Date().setHours(0,0,0,0));
                   if (isFuture) {
                     btnClass = "text-gray-400 bg-gray-50/30 cursor-not-allowed";
                   } else {
                     btnClass = "text-gray-300 bg-gray-50/50 cursor-not-allowed";
                   }
                }

                return (
                  <button
                    key={dayObj.dateStr}
                    onClick={() => handleDateSelect(dayObj)}
                    disabled={!isBookable}
                    className={`py-3 rounded-[14px] transition-all flex flex-col items-center justify-center relative ${isBookable ? 'cursor-pointer active:scale-95' : 'cursor-not-allowed'} ${btnClass}`}
                  >
                    <span>{dayObj.day}</span>
                    {/* Mini slot indicator */}
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-1 ${isBookable ? 'bg-[#00B0B9]' : (new Date(dayObj.dateStr) >= new Date(new Date().setHours(0,0,0,0)) ? 'bg-rose-400' : 'bg-transparent')}`}
                    ></span>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-gray-50 flex flex-wrap justify-center gap-4 text-[11px] text-gray-500 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-gray-100 border border-gray-200 rounded-full"></span>
                ผ่านไปแล้ว / วันหยุด
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-[#00B0B9] rounded-full shadow-sm"></span>
                เปิดให้จอง
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-rose-400 rounded-full shadow-sm"></span>
                เต็มแล้ว / ปิดจอง
              </span>
            </div>
            
            {/* Warning Rule Note */}
            <div className="bg-amber-50 border border-amber-200 text-amber-700 p-3 rounded-2xl flex items-start gap-2 mt-4">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
              <p className="text-[11px] font-bold leading-relaxed">
                ระบบจะปิดรับจองและ<span className="text-red-500">ไม่อนุญาตให้ยกเลิกสิทธิ์</span> ในวันที่มีการเรียนการสอนเวลา 07:00 น. เป็นต้นไป
              </p>
            </div>
          </div>

          {/* Action & Confirm Column */}
          <div className="pb-10">
            <div className="bg-white rounded-[20px] border border-gray-100 p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-5">
              <h3 className="font-bold text-[#211551] border-b border-gray-100 pb-3 flex items-center gap-1.5 text-[15px]">
                <ReceiptText className="w-5 h-5 text-[#00B0B9]" />
                <span>3. สรุปการจองสิทธิ์</span>
              </h3>

              {!selectedDate ? (
                <div className="text-center py-8 text-gray-400 space-y-2">
                  <div className="inline-flex p-4 bg-gray-50 text-[#00B0B9]/40 rounded-full mb-1">
                    <Hand className="w-8 h-8" />
                  </div>
                  <p className="text-[13px] font-bold text-gray-500">กรุณาแตะเลือกวันที่ในปฏิทิน</p>
                  <p className="text-[11px]">* ระบบแสดงรอบเรียนล่วงหน้า 2 เดือน</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 1. Date Card summary */}
                  <div className="bg-[#00B0B9]/5 border border-[#00B0B9]/20 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#00B0B9] text-white rounded-[14px] flex flex-col items-center justify-center shrink-0 shadow-sm">
                      <span className="text-[10px] font-bold leading-none">{selectedThaiMonthMin}</span>
                      <span className="text-xl font-black leading-none mt-0.5">{selectedDayNum}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-[#211551] text-[14px]">
                        เวลา 09:30 - 11:30 น.
                      </h4>
                      <p className="text-[12px] text-[#00B0B9] font-bold mt-0.5">
                        {selectedThaiFullDate}
                      </p>
                    </div>
                  </div>

                  {/* Selected Child Details */}
                  {selectedChildObj && (
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <span className="text-[13px] font-bold text-[#211551]/70">ชื่อนักเรียน:</span>
                      <span className="text-[15px] font-black text-[#211551]">
                        {selectedChildObj.nickname}
                      </span>
                    </div>
                  )}

                  {/* Simple Status */}
                  <div className="flex items-center justify-between bg-[#211551]/5 p-4 rounded-2xl border border-[#211551]/10">
                    <span className="text-[13px] font-bold text-[#211551]/70">สถานะคลาสเรียน:</span>
                    <span className={`text-[15px] font-black inline-flex items-center gap-1.5 ${selectedDateAvailable ? 'text-[#00B0B9]' : 'text-rose-500'}`}>
                      <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${selectedDateAvailable ? 'bg-[#00B0B9]' : 'bg-rose-500'}`}></span>
                      <span>{selectedSessionStatus}</span>
                    </span>
                  </div>

                  {/* Confirmation Status Messages */}
                  {bookingError && (
                    <div className="bg-rose-50 text-rose-700 border border-rose-100 p-4 rounded-2xl text-[13px] flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <span className="font-bold">{bookingError}</span>
                    </div>
                  )}

                  {bookingSuccess && (
                    <div className="bg-[#00B0B9]/10 text-[#00B0B9] border border-[#00B0B9]/20 p-4 rounded-2xl text-[13px] flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-[#00B0B9] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold">สำรองที่เรียนสำเร็จแล้ว!</h4>
                        <p className="text-[#00B0B9]/80 mt-1 font-medium">
                          ระบบได้ลดสิทธิ์ 1 ครั้งและลงคิวเรียนในระบบเรียบร้อย
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="pt-2">
                    <button
                      onClick={handleBookClass}
                      disabled={isSubmitting || bookingSuccess || !selectedDateAvailable || creditsRemaining <= 0 || !selectedChildId}
                      className="w-full bg-[#00B0B9] hover:bg-[#00969e] text-white py-4 rounded-[14px] font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-[15px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none hover:-translate-y-0.5 active:translate-y-0"
                    >
                      {!isSubmitting ? (
                        <span>ยืนยันการจองสิทธิ์ (หัก 1 Credit)</span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Loader2 className="animate-spin h-5 w-5 text-white" />
                          กำลังทำรายการ...
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Top Up Modal */}
        {showTopUpModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#211551]/40 backdrop-blur-sm">
            <div className="bg-white w-full max-w-[420px] rounded-[32px] p-8 relative shadow-2xl">
              <button 
                onClick={() => setShowTopUpModal(false)} 
                className="absolute top-5 right-5 p-2 bg-gray-50 text-gray-400 hover:text-[#211551] hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="mb-6 text-center">
                <div className="w-16 h-16 bg-[#00B0B9]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-8 h-8 text-[#00B0B9]" />
                </div>
                <h2 className="text-2xl font-black text-[#211551]">Top Up Credits</h2>
                <p className="text-[13px] text-gray-500 mt-2 font-medium">เพิ่มสิทธิ์เพื่อจองคลาสเรียนเพลย์กรุ๊ป</p>
              </div>

              <form onSubmit={submitTopUp} className="space-y-5">
                <div>
                  <label className="block text-[14px] font-bold text-[#211551] mb-2">Select Package</label>
                  <div className="relative">
                    <select 
                      value={packageType} 
                      onChange={e => setPackageType(e.target.value)} 
                      className="w-full p-4 text-[15px] font-bold border border-gray-200 rounded-2xl bg-gray-50 focus:ring-2 focus:ring-[#00B0B9] focus:outline-none appearance-none cursor-pointer text-[#211551]" 
                      required
                    >
                      <option value="">-- เลือกแพ็กเกจ --</option>
                      {paymentPackages.map(p => (
                        <option key={p.id} value={p.name}>{p.name} - {p.price} บาท ({p.credits} Credits)</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400">
                      <ChevronRight className="w-4 h-4 rotate-90" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-center p-8 border-2 border-dashed border-[#00B0B9]/30 bg-[#00B0B9]/5 rounded-2xl cursor-pointer hover:bg-[#00B0B9]/10 transition">
                    <UploadCloud className="w-10 h-10 text-[#00B0B9] mx-auto mb-3" />
                    <span className="text-[15px] font-bold text-[#00B0B9] block">อัปโหลดสลิปโอนเงิน</span>
                    <span className="text-[12px] text-gray-500 font-medium mt-1.5 block">รองรับไฟล์รูปภาพ JPG, PNG</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFile} required />
                  </label>
                  {paymentSlipData && (
                    <div className="mt-4 p-2 border border-gray-100 rounded-2xl relative shadow-sm bg-white">
                       <img src={paymentSlipData} alt="Slip" className="h-48 w-full rounded-xl object-contain bg-gray-50" />
                       <button type="button" onClick={() => setPaymentSlipData('')} className="absolute top-4 right-4 bg-rose-500 text-white p-1.5 rounded-full shadow-md hover:bg-rose-600 transition hover:scale-110">
                         <X className="w-4 h-4" />
                       </button>
                    </div>
                  )}
                </div>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full bg-[#211551] text-white py-4 rounded-2xl font-bold text-[16px] flex justify-center shadow-lg hover:bg-[#2d1d6e] transition-all disabled:opacity-50 mt-4 hover:-translate-y-0.5 active:translate-y-0"
                >
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirm Payment'}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
