import React from 'react';
import { Clock, CalendarX, X, RefreshCcw, Trash2 } from 'lucide-react';
import { AdminButton, AdminConfirmModal } from '../../admin-ui';
import { AdminService } from '@/lib/supabase';
import toast from 'react-hot-toast';
import type { SchoolClosure, Session } from '@/types';

interface ClosureAndSessionPanelsProps {
  selectionMode: 'single' | 'range' | 'multi';
  rangeStart: string;
  rangeEnd: string;
  multiDates: string[];
  sessions: Session[];
  closures: SchoolClosure[];
  fetchData: () => Promise<void>;
  handleDeleteClosure: (id: string) => void;
  deleteTargetId: string | null;
  setDeleteTargetId: (id: string | null) => void;
  confirmDeleteClosure: () => Promise<void>;
}

export function ClosureAndSessionPanels({
  selectionMode,
  rangeStart,
  rangeEnd,
  multiDates,
  sessions,
  closures,
  fetchData,
  handleDeleteClosure,
  deleteTargetId,
  setDeleteTargetId,
  confirmDeleteClosure
}: ClosureAndSessionPanelsProps) {
  function formatDisplayDateStr(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingClosures = closures
    .filter(c => c.end_date >= todayStr && !c.time_label)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

  return (
    <>
      {/* 3. Daily Command Center: Time Slots */}
      {((selectionMode === 'single' && rangeStart) ||
        (selectionMode === 'range' && rangeStart && rangeEnd && rangeStart === rangeEnd) ||
        (selectionMode === 'multi' && multiDates.length === 1)) && (() => {
          const targetDate = selectionMode === 'multi' ? multiDates[0] : rangeStart;
          return (
            <div className="bg-white border border-border rounded-2xl p-4 sm:p-5 shadow-sm animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-icsn-navy" />
                  <h4 className="font-bold text-icsn-navy text-sm">รอบเวลาเรียน (วันที่ {formatDisplayDateStr(targetDate)})</h4>
                </div>
              </div>

              {sessions.filter(s => s.session_date === targetDate).length === 0 ? (
                <div className="text-center py-6 bg-muted/50 rounded-xl border border-border/50">
                  <p className="text-sm text-muted-foreground mb-3">ยังไม่มีการสร้างรอบเวลาเรียนสำหรับวันนี้</p>
                  <AdminButton
                    variant="primary"
                    onClick={async () => {
                      try {
                        const { SupabaseSessionAdapter } = await import('@/lib/domain/adapters/SupabaseSessionAdapter');
                        const adapter = new SupabaseSessionAdapter();
                        await adapter.getOrCreateSessionsForDate(targetDate);
                        toast.success('สร้างรอบเวลาเรียนเรียบร้อย');
                        await fetchData();
                      } catch (err: any) {
                        toast.error(err.message || 'Error generating sessions');
                      }
                    }}
                  >
                    สร้างรอบเวลาจาก Template
                  </AdminButton>
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions
                    .filter(s => s.session_date === targetDate)
                    .sort((a, b) => (a.time_label ?? '').localeCompare(b.time_label ?? ''))
                    .map(session => (
                      <div key={session.id} className={`p-3 border rounded-xl flex items-center justify-between transition-colors ${session.is_active ? 'border-border bg-white' : 'border-error/20 bg-error/5'
                        }`}>
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-bold text-icsn-navy">
                            {session.time_label}
                          </div>
                          {!session.is_active && (
                            <span className="text-[10px] bg-error/10 text-error px-2 py-0.5 rounded-full font-bold">
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
                              className="w-12 text-sm font-bold text-center bg-transparent outline-none disabled:opacity-50"
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
            </div>
          );
        })()}

      {/* 4. Upcoming Closures List */}
      <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col h-[300px]">
        <div className="p-3 sm:p-4 border-b border-border bg-muted/50">
          <h4 className="font-bold text-icsn-navy text-sm flex items-center justify-between">
            รายการการตั้งค่าพิเศษที่กำลังจะมาถึง
            <span className="bg-icsn-navy text-white text-[10px] px-2 py-0.5 rounded-full">
              {upcomingClosures.length} รายการ
            </span>
          </h4>
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          {upcomingClosures.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/70 text-sm">
              <CalendarX className="w-8 h-8 mb-2 opacity-50" />
              ไม่มีรายการตั้งค่าพิเศษ
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingClosures.map(c => (
                <div key={c.id} className="p-3 border border-border/50 bg-muted/50/50 rounded-lg flex items-center justify-between hover:bg-muted/50 hover:border-border transition-colors group">
                  <div>
                    <p className={`font-bold text-sm ${c.is_force_open ? 'text-success' : 'text-error'}`}>
                      {c.is_force_open ? 'เปิดพิเศษ' : (c.reason || 'วันหยุด')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.start_date === c.end_date
                        ? formatDisplayDateStr(c.start_date)
                        : `${formatDisplayDateStr(c.start_date)} - ${formatDisplayDateStr(c.end_date)}`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteClosure(c.id)}
                    className="p-1.5 text-muted-foreground/70 hover:text-error hover:bg-error/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                    title="ลบรายการนี้"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AdminConfirmModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDeleteClosure}
        title="ยืนยันการลบการตั้งค่า"
        message="คุณต้องการยกเลิกการตั้งค่าวันหยุด/เปิดพิเศษนี้ใช่หรือไม่?"
        isDestructive={true}
      />
    </>
  );
}
