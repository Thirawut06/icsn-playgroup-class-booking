import React, { useState } from 'react';
import { Clock, X, RefreshCcw, Plus } from 'lucide-react';
import { AdminButton, AdminTimeRangePicker } from '../../admin-ui';
import { AdminService } from '@/lib/supabase';
import toast from 'react-hot-toast';
import type { Session, SessionTemplate } from '@/types';

interface DailySessionManagerProps {
  targetDate: string;
  sessions: Session[];
  templates: SessionTemplate[];
  isGenerating: boolean;
  fetchData: () => Promise<void>;
}

export function DailySessionManager({
  targetDate,
  sessions,
  templates,
  isGenerating,
  fetchData
}: DailySessionManagerProps) {
  const [newTimeLabel, setNewTimeLabel] = useState('09.00 - 12.00');
  const [newCapacity, setNewCapacity] = useState('');
  const [isAddingSession, setIsAddingSession] = useState(false);

  function formatDisplayDateStr(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  }

  const handleAddCustomSession = async () => {
    if (!newTimeLabel || !newCapacity) return;
    setIsAddingSession(true);
    try {
      await AdminService.createCustomSession(targetDate, newTimeLabel, parseInt(newCapacity));
      toast.success('เพิ่มรอบเวลาเฉพาะกิจสำเร็จ');
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || 'ไม่สามารถเพิ่มรอบเวลาได้');
    } finally {
      setIsAddingSession(false);
    }
  };

  const targetSessions = sessions
    .filter(s => s.session_date === targetDate)
    .sort((a, b) => (a.time_label ?? '').localeCompare(b.time_label ?? ''));

  return (
    <div className="bg-white border border-border rounded-2xl p-4 sm:p-5 shadow-sm animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-icsn-navy" />
          <h4 className="font-bold text-icsn-navy text-base sm:text-lg">รอบเวลาเรียน (วันที่ {formatDisplayDateStr(targetDate)})</h4>
        </div>
      </div>

      {targetSessions.length === 0 ? (
        <div className="text-center py-6 bg-muted/50 rounded-xl border border-border/50">
          <p className="text-sm text-muted-foreground">
            {isGenerating ? 'กำลังโหลดรอบเวลาเรียน...' : 'ไม่มีรอบเวลาเรียนในวันนี้ (อาจเป็นวันหยุด)'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {targetSessions.map(session => (
            <div key={session.id} className={`p-3 border rounded-xl flex items-center justify-between transition-colors ${session.is_active ? 'border-border bg-white' : 'border-error/20 bg-error/5'
              }`}>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-bold text-icsn-navy">
                    {session.time_label}
                  </div>
                  {templates.some(t => t.time_label === session.time_label) ? (
                    <span className="text-[10px] bg-icsn-teal/10 text-icsn-teal px-2 py-0.5 rounded-full font-bold">
                      ค่าเริ่มต้น
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full font-bold">
                      เฉพาะกิจ
                    </span>
                  )}
                </div>
                {!session.is_active && (
                  <span className="text-[10px] bg-error/10 text-error px-2 py-0.5 rounded-full font-bold w-fit">
                    ปิดรับจอง
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-lg px-2 py-1">
                  <span className="text-xs text-muted-foreground">รับ:</span>
                  <input
                    type="number"
                    defaultValue={session.total_capacity}
                    onBlur={async (e) => {
                      const newCap = parseInt(e.target.value);
                      if (newCap && newCap !== session.total_capacity) {
                        try {
                          await AdminService.updateSessionCapacity(session.id, newCap);
                          toast.success('อัปเดตจำนวนรับเรียบร้อย');
                          fetchData();
                        } catch (err: any) {
                          toast.error(err.message);
                          e.target.value = session.total_capacity.toString();
                        }
                      }
                    }}
                    disabled={!session.is_active}
                    className="w-16 sm:w-20 text-sm font-bold text-center bg-transparent outline-none disabled:opacity-50 border-b border-dashed border-border/50 focus:border-icsn-teal transition-colors"
                  />
                  <span className="text-xs text-muted-foreground">คน</span>
                </div>

                <button
                  onClick={async () => {
                    try {
                      await AdminService.toggleSessionActive(session.id, !session.is_active);
                      toast.success(session.is_active ? 'ปิดรับจองรอบเวลานี้แล้ว' : 'เปิดรับจองรอบเวลานี้แล้ว');
                      fetchData();
                    } catch (err: any) {
                      toast.error(err.message);
                    }
                  }}
                  className={`p-1.5 rounded-md transition-colors ${session.is_active
                      ? 'text-muted-foreground/70 hover:text-error hover:bg-error/10'
                      : 'text-error hover:text-success hover:bg-success/10'
                    }`}
                  title={session.is_active ? "คลิกเพื่อปิดรับจอง" : "คลิกเพื่อเปิดรับจอง"}
                >
                  {session.is_active ? <X className="w-4 h-4" /> : <RefreshCcw className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Custom Time Slot Form */}
      <div className="mt-6 pt-5 border-t border-border/50">
        <p className="text-base font-bold text-icsn-navy mb-3">เพิ่มรอบเฉพาะกิจ</p>
        <div className="flex flex-col gap-4 p-4 bg-muted/20 rounded-xl border border-border/50">
          
          {/* Time Picker */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">ช่วงเวลา</label>
            <AdminTimeRangePicker value={newTimeLabel} onChange={setNewTimeLabel} />
          </div>
          
          {/* Capacity */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">จำนวนรับ (คน)</label>
            <input 
              type="number" 
              value={newCapacity} 
              onChange={(e) => setNewCapacity(e.target.value)}
              placeholder="ตัวอย่าง: 15"
              className="w-full text-base font-bold bg-white border border-border/80 rounded-lg px-3 py-2 outline-none focus:border-icsn-teal focus:ring-1 focus:ring-icsn-teal placeholder:text-muted-foreground/40 placeholder:font-normal transition-all"
            />
          </div>
          
          {/* Submit Button */}
          <AdminButton 
            variant="primary" 
            onClick={handleAddCustomSession} 
            disabled={isAddingSession || !newTimeLabel || !newCapacity}
            isLoading={isAddingSession}
            className="w-full justify-center mt-1 py-2.5 text-sm"
            icon={Plus}
          >
            เพิ่มรอบเวลานี้
          </AdminButton>
          
        </div>
      </div>
    </div>
  );
}
