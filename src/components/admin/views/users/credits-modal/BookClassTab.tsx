import React from 'react';
import { Baby, CalendarPlus, Loader2, Ticket, Banknote, Gift } from 'lucide-react';
import { formatDateShort } from '@/lib/utils';
import type { Session } from '@/types';

interface BookClassTabProps {
  childrenList: any[];
  selectedChildId: string;
  setSelectedChildId: (val: string) => void;
  availableSessions: Session[];
  isLoadingSessions: boolean;
  selectedSessionId: string;
  setSelectedSessionId: (val: string) => void;
  totalCredits: number;
  paymentType: 'deduct' | 'paid' | 'trial';
  setPaymentType: (val: 'deduct' | 'paid' | 'trial') => void;
  isSaving: boolean;
  handleBookClass: () => void;
}

export function BookClassTab({
  childrenList,
  selectedChildId,
  setSelectedChildId,
  availableSessions,
  isLoadingSessions,
  selectedSessionId,
  setSelectedSessionId,
  totalCredits,
  paymentType,
  setPaymentType,
  isSaving,
  handleBookClass
}: BookClassTabProps) {
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
  const upcomingSessions = availableSessions.filter(s => s.session_date >= todayStr);
  const pastSessions = availableSessions.filter(s => s.session_date < todayStr).reverse();

  return (
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
          
          {upcomingSessions.length > 0 && (
            <optgroup label="รอบเรียนที่กำลังจะมาถึง / วันนี้">
              {upcomingSessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {formatDateShort(s.session_date)} ({s.time_label}) • ว่าง {(s.total_capacity || 0) - (s.booked_count || 0)} ที่
                </option>
              ))}
            </optgroup>
          )}
          
          {pastSessions.length > 0 && (
            <optgroup label="รอบเรียนย้อนหลัง">
              {pastSessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {formatDateShort(s.session_date)} ({s.time_label}) • ย้อนหลัง
                </option>
              ))}
            </optgroup>
          )}
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
  );
}
