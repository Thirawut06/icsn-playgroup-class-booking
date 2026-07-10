import React, { useState, useEffect } from 'react';
import { X, Loader2, Save, CalendarPlus, Coins, Plus, Minus, Ticket, Banknote, Gift, Baby } from 'lucide-react';
import toast from 'react-hot-toast';
import { BookingService } from '@/lib/supabase';
import { AdminBookingService } from '@/lib/services/admin-booking.service';
import { Session } from '@/types';
import { formatDateShort } from '@/lib/utils';

interface AdminManageCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: 'credits' | 'book';
  parentId: string;
  parentPhone: string;
  childrenList: any[];
  totalCredits: number;
  onSuccess: () => void;
}

export function AdminManageCreditsModal({
  isOpen,
  onClose,
  initialMode,
  parentId,
  parentPhone,
  childrenList,
  totalCredits,
  onSuccess
}: AdminManageCreditsModalProps) {
  const [isSaving, setIsSaving] = useState(false);

  // Tab 1: Adjust Credits
  const [creditAmount, setCreditAmount] = useState<number | string>(0);
  const [creditReason, setCreditReason] = useState('');

  // Tab 2: Book Class
  const [selectedChildId, setSelectedChildId] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [paymentType, setPaymentType] = useState<'deduct' | 'paid' | 'trial'>('deduct');
  const [availableSessions, setAvailableSessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset forms
      setCreditAmount(0);
      setCreditReason('');
      
      // Auto-select child if only 1 exists
      if (childrenList.length === 1) {
        setSelectedChildId(childrenList[0].id);
      } else {
        setSelectedChildId('');
      }
      
      setSelectedSessionId('');
      
      // Auto-select payment method based on credits
      if (totalCredits > 0) {
        setPaymentType('deduct');
      } else {
        setPaymentType('paid');
      }

      if (initialMode === 'book') {
        fetchUpcomingSessions();
      }
    }
  }, [isOpen, initialMode, childrenList, totalCredits]);

  const fetchUpcomingSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
      // Fetch sessions for the next 30 days
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      const endStr = endDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
      
      const sessions = await BookingService.getSessions(today, endStr);
      setAvailableSessions(sessions.filter(s => s.is_active));
    } catch (err: any) {
      toast.error('โหลดรอบเรียนไม่สำเร็จ');
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleAdjustCredits = async () => {
    const amount = typeof creditAmount === 'string' ? parseInt(creditAmount) : creditAmount;
    if (!amount || isNaN(amount) || amount === 0) {
      toast.error('กรุณาระบุจำนวนเครดิตให้ถูกต้อง (ห้ามเป็น 0)');
      return;
    }

    if (amount < 0 && Math.abs(amount) > totalCredits) {
      toast.error('ไม่สามารถลดเครดิตได้มากกว่าจำนวนเครดิตที่มีอยู่');
      return;
    }

    setIsSaving(true);
    try {
      // If reason is empty, provide a default generic reason
      const finalReason = creditReason.trim() || (amount > 0 ? 'Admin เพิ่มเครดิต (Manual)' : 'Admin ลดเครดิต (Manual)');
      await AdminBookingService.adjustCredits(parentId, amount, finalReason);
      toast.success('ปรับปรุงเครดิตเรียบร้อยแล้ว');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBookClass = async () => {
    if (!selectedChildId) {
      toast.error('กรุณาเลือกเด็ก');
      return;
    }
    if (!selectedSessionId) {
      toast.error('กรุณาเลือกรอบเรียน');
      return;
    }
    if (paymentType === 'deduct' && totalCredits <= 0) {
      toast.error('สิทธิ์คงเหลือไม่พอสำหรับหักเครดิต');
      return;
    }

    const child = childrenList.find(c => c.id === selectedChildId);
    if (!child) return;
    const childName = child.nickname || child.full_name;

    setIsSaving(true);
    try {
      await AdminBookingService.adminProcessWalkin({
        phone: parentPhone,
        childId: selectedChildId,
        childName,
        sessionId: selectedSessionId,
        paymentType
      });
      toast.success('จองคลาสเรียบร้อยแล้ว');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('จองไม่สำเร็จ: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => !isSaving && onClose()}></div>
      <div className="bg-white rounded-[2rem] w-[calc(100%-1rem)] max-w-xl mx-auto shadow-2xl relative z-10 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-white rounded-t-[2rem] shrink-0">
          <div className="flex items-center gap-3">
            {initialMode === 'credits' ? (
              <div className="w-10 h-10 rounded-full bg-icsn-teal/10 flex items-center justify-center text-icsn-teal">
                <Coins className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-icsn-navy/10 flex items-center justify-center text-icsn-navy">
                <CalendarPlus className="w-5 h-5" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {initialMode === 'credits' ? 'ปรับปรุงเครดิตผู้ใช้งาน' : 'ลงวันจองคลาส'}
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={isSaving}
            className="p-2 bg-muted hover:bg-muted/80 rounded-full transition-colors text-muted-foreground disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          
          {initialMode === 'credits' && (
            <div className="space-y-6">
              
              {/* Stepper */}
              <div>
                <label className="block text-base font-bold text-foreground mb-3 text-center">ปรับจำนวนเครดิต</label>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setCreditAmount(prev => (typeof prev === 'string' ? parseInt(prev) || 0 : prev) - 1)}
                    className="w-14 h-14 rounded-full bg-error/10 text-error hover:bg-error hover:text-white flex items-center justify-center transition-colors shrink-0"
                  >
                    <Minus className="w-8 h-8" />
                  </button>
                  
                  <div className="w-32 relative">
                    <input 
                      type="number" 
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                      className="w-full px-2 py-3 bg-white border-2 border-border rounded-xl focus:outline-none focus:border-icsn-teal transition-all text-3xl font-bold text-center"
                    />
                  </div>

                  <button
                    onClick={() => setCreditAmount(prev => (typeof prev === 'string' ? parseInt(prev) || 0 : prev) + 1)}
                    className="w-14 h-14 rounded-full bg-success/10 text-success hover:bg-success hover:text-white flex items-center justify-center transition-colors shrink-0"
                  >
                    <Plus className="w-8 h-8" />
                  </button>
                </div>
                <p className="text-center text-sm text-muted-foreground mt-3">
                  เลขบวก = เพิ่มเครดิต / เลขติดลบ = หักเครดิต
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-2">เหตุผล / หมายเหตุ (ไม่ระบุก็ได้)</label>
                <textarea 
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  className="w-full px-4 py-2 bg-muted/30 border-2 border-border rounded-xl focus:outline-none focus:border-icsn-teal transition-all text-sm resize-none h-20"
                  placeholder="เช่น ชดเชยคลาสที่ยกเลิก, หักเครดิตย้อนหลัง..."
                />
              </div>

              <button
                onClick={handleAdjustCredits}
                disabled={isSaving}
                className="w-full py-3 px-4 rounded-xl font-bold text-white bg-icsn-teal hover:bg-icsn-teal/90 shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 text-lg"
              >
                {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                ยืนยันการปรับปรุงเครดิต
              </button>
            </div>
          )}

          {initialMode === 'book' && (
            <div className="space-y-6">
              
              {/* Select Child */}
              <div>
                <label className="block text-base font-bold text-foreground mb-3 flex items-center gap-2">
                  <span className="bg-icsn-navy text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span> 
                  เลือกน้องที่ต้องการจองคลาส
                </label>
                <div className="flex flex-wrap gap-3">
                  {childrenList.map((c: any) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedChildId(c.id)}
                      className={`px-3 py-2 rounded-xl border-2 font-bold flex items-center gap-2 transition-all text-sm ${
                        selectedChildId === c.id 
                          ? 'border-icsn-teal bg-icsn-teal/10 text-icsn-teal shadow-sm' 
                          : 'border-border bg-white text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Baby className="w-4 h-4" />
                      {c.full_name} ({c.nickname})
                    </button>
                  ))}
                </div>
              </div>

              {/* Select Session */}
              <div>
                <label className="block text-base font-bold text-foreground mb-3 flex items-center gap-2">
                  <span className="bg-icsn-navy text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span> 
                  เลือกรอบเรียน
                </label>
                <select
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  disabled={isLoadingSessions}
                  className="w-full px-3 py-3 bg-white border-2 border-border rounded-xl focus:outline-none focus:border-icsn-teal transition-all text-sm font-medium appearance-none shadow-sm cursor-pointer"
                >
                  <option value="" disabled>-- กดเพื่อเลือกรอบเรียน --</option>
                  {availableSessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {formatDateShort(s.session_date)} ({s.time_label}) • ว่าง {(s.total_capacity || 0) - (s.booked_count || 0)} ที่
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Type */}
              <div>
                <label className="block text-base font-bold text-foreground mb-3 flex items-center gap-2">
                  <span className="bg-icsn-navy text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span> 
                  วิธีชำระเงิน / สิทธิ์ที่ใช้
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Deduct Option */}
                  <button
                    onClick={() => {
                      if (totalCredits > 0) setPaymentType('deduct');
                    }}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center text-center gap-2 ${
                      paymentType === 'deduct' 
                        ? 'border-icsn-teal bg-icsn-teal/10' 
                        : totalCredits <= 0 
                          ? 'border-border bg-muted/30 opacity-60 cursor-not-allowed' 
                          : 'border-border bg-white hover:border-icsn-teal/50'
                    }`}
                  >
                    <div className={`p-2 rounded-full ${paymentType === 'deduct' ? 'bg-icsn-teal text-white' : 'bg-muted text-muted-foreground'}`}>
                      <Ticket className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-foreground text-sm leading-tight">หักเครดิต</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {totalCredits > 0 ? `(มี ${totalCredits})` : '(หมด)'}
                      </div>
                    </div>
                  </button>

                  {/* Paid Option */}
                  <button
                    onClick={() => setPaymentType('paid')}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center text-center gap-2 ${
                      paymentType === 'paid' 
                        ? 'border-icsn-navy bg-icsn-navy/10' 
                        : 'border-border bg-white hover:border-icsn-navy/50'
                    }`}
                  >
                    <div className={`p-2 rounded-full ${paymentType === 'paid' ? 'bg-icsn-navy text-white' : 'bg-muted text-muted-foreground'}`}>
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-foreground text-sm leading-tight">จ่ายหน้างาน</div>
                      <div className="text-xs text-muted-foreground mt-1">(รายครั้ง)</div>
                    </div>
                  </button>

                  {/* Trial Option */}
                  <button
                    onClick={() => setPaymentType('trial')}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center text-center gap-2 ${
                      paymentType === 'trial' 
                        ? 'border-warning bg-warning/10' 
                        : 'border-border bg-white hover:border-warning/50'
                    }`}
                  >
                    <div className={`p-2 rounded-full ${paymentType === 'trial' ? 'bg-warning text-white' : 'bg-muted text-muted-foreground'}`}>
                      <Gift className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-foreground text-sm leading-tight">ทดลองฟรี</div>
                      <div className="text-xs text-muted-foreground mt-1">(ครั้งแรก)</div>
                    </div>
                  </button>
                </div>
              </div>

              <button
                onClick={handleBookClass}
                disabled={isSaving}
                className="w-full py-3 px-4 rounded-xl font-bold text-white bg-icsn-navy hover:bg-icsn-navy/90 shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 text-base mt-2"
              >
                {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <CalendarPlus className="w-6 h-6" />}
                ยืนยันการลงวันจอง
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
