"use client";

import React from 'react';
import { CalendarDays, Printer, Users, XCircle, Power, Loader2, PenLine, CheckCircle2 } from 'lucide-react';
import { COPY } from '@/config/copy';
import { AdminEmptyState, AdminFieldLabel, AdminPanel, AdminPanelHeader } from '../admin-ui';
import { AdminWalkinModal } from '../walkin/AdminWalkinModal';
import { ESignModal } from '../checkin/ESignModal';
import { formatAgeDisplay } from '../admin-utils';
import { useDailyAttendance } from '@/hooks/useDailyAttendance';
import type { DailyAttendanceRow } from '@/types';

export function AdminDailyOps({ onRefresh }: { onRefresh?: () => void }) {
  const [isWalkinModalOpen, setIsWalkinModalOpen] = React.useState(false);
  const [esignTarget, setEsignTarget] = React.useState<DailyAttendanceRow | null>(null);

  const {
    dailyDate,
    setDailyDate,
    sessions,
    selectedSessionId,
    setSelectedSessionId,
    attendance,
    session,
    loading,
    walkinPhone,
    setWalkinPhone,
    walkinName,
    setWalkinName,
    walkinFree,
    setWalkinFree,
    walkinLoading,
    capacityEdit,
    setCapacityEdit,
    savingCapacity,
    sessionIsActive,
    togglingSession,
    handleWalkin,
    handleCancel,
    handleCheckin,
    handleSaveCapacity,
    handleToggleSession,
    refreshData,
  } = useDailyAttendance({ onRefresh });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPanel className="no-print">
        <AdminPanelHeader icon={CalendarDays} title="จัดการรอบรายวัน (Daily Operations)" />

        <div className="p-6 space-y-6">
          {/* Controls */}
          <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-end border-b border-border pb-6">
            
            {/* Date Selection */}
            <div className="w-full lg:w-64 space-y-4">
              <div>
                <AdminFieldLabel>เลือกวันที่</AdminFieldLabel>
                <input
                  type="date"
                  value={dailyDate}
                  onChange={e => setDailyDate(e.target.value)}
                  className="block w-full px-4 h-[48px] border border-border rounded-xl focus:border-icsn-teal focus:ring-1 focus:ring-icsn-teal outline-none bg-white text-foreground transition shadow-sm font-semibold cursor-pointer"
                />
              </div>
              
              {/* Session Tabs */}
              {sessions.length > 0 && (
                <div>
                  <AdminFieldLabel>เลือกรอบเวลา</AdminFieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {sessions.map(sess => (
                      <button
                        key={sess.id}
                        onClick={() => setSelectedSessionId(sess.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer ${
                          selectedSessionId === sess.id
                            ? 'bg-icsn-teal text-white'
                            : 'bg-white text-muted-foreground border border-border hover:bg-muted'
                        }`}
                      >
                        {sess.time_label}
                        <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-white/20">
                          {sess.booked_count || 0}/{sess.total_capacity}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-end gap-4 w-full lg:w-auto mt-4 lg:mt-0">
              
              {/* Capacity Control */}
              <div>
                <AdminFieldLabel>ความจุ (ที่นั่ง)</AdminFieldLabel>
                <div className="flex border border-border rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-icsn-teal focus-within:border-icsn-teal transition bg-white h-[48px] shadow-sm">
                  <input
                    type="number"
                    min={1}
                    value={capacityEdit}
                    onChange={e => setCapacityEdit(e.target.value)}
                    className="w-16 px-2 text-center font-bold outline-none text-foreground border-none bg-transparent"
                    title="จำนวนที่นั่งสูงสุด"
                  />
                  <button 
                    onClick={handleSaveCapacity} 
                    disabled={savingCapacity}
                    className="px-4 bg-muted hover:bg-muted/80 text-foreground font-bold border-l border-border transition disabled:opacity-50 cursor-pointer text-sm"
                  >
                    บันทึก
                  </button>
                </div>
              </div>

              {/* Session Control */}
              <div>
                <AdminFieldLabel>สถานะรับจอง</AdminFieldLabel>
                <button
                  onClick={handleToggleSession}
                  disabled={togglingSession}
                  className={`flex items-center justify-center gap-2 px-5 h-[48px] rounded-xl font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 border ${
                    sessionIsActive 
                      ? 'bg-error/10 text-error hover:bg-error/10 border-error/30' 
                      : 'bg-success text-white hover:bg-success border-transparent'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  {sessionIsActive ? 'ปิดรับจอง' : 'เปิดรับจอง'}
                </button>
              </div>

              {/* Print Action */}
              <div>
                <AdminFieldLabel>ระบบเอกสาร</AdminFieldLabel>
                <button 
                  onClick={() => window.print()} 
                  className="flex items-center justify-center gap-2 px-5 h-[48px] bg-white border border-border hover:bg-muted/80 text-foreground rounded-xl font-bold transition shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-icsn-teal" /> พิมพ์
                </button>
              </div>
            </div>
          </div>

          {!sessionIsActive && (
            <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-xl font-bold flex items-center gap-3">
              <span className="flex items-center justify-center w-6 h-6 bg-error/20 text-error rounded-full shrink-0">!</span>
              คลาสวันนี้ถูกปิดรับจองชั่วคราว
            </div>
          )}

          {/* Add Walk-in Button */}
          <div className="flex justify-between items-center bg-muted p-4 rounded-2xl border border-border">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-icsn-teal" /> รับ Walk-in หน้างาน
            </h3>
            <button 
              onClick={() => setIsWalkinModalOpen(true)}
              className="px-6 py-2 bg-icsn-navy hover:bg-icsn-navy/90 text-white rounded-xl font-bold shadow-sm transition cursor-pointer"
            >
              + เพิ่มนักเรียน (Walk-in)
            </button>
          </div>

          <AdminWalkinModal 
            isOpen={isWalkinModalOpen}
            sessionId={selectedSessionId}
            onClose={() => setIsWalkinModalOpen(false)}
            onSuccess={() => {
              onRefresh?.();
              refreshData?.();
            }}
          />

          {/* Attendance Table */}
          {loading ? (
            <div className="flex justify-center items-center h-32"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground/70" /></div>
          ) : attendance.length === 0 ? (
            <AdminEmptyState message={COPY.EMPTY_STATES.NO_STUDENTS} />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
              <table className="w-full text-left text-sm bg-white">
                <thead>
                  <tr className="bg-muted border-b border-border text-muted-foreground font-bold">
                    <th className="px-4 py-3">ชื่อเล่น (Nickname)</th>
                    <th className="px-4 py-3">อายุ (Age)</th>
                    <th className="px-4 py-3">แพ้อาหาร (Allergies)</th>
                    <th className="px-4 py-3">ผู้ปกครอง (Parent)</th>
                    <th className="px-4 py-3 text-center">เช็คอิน</th>
                    <th className="px-4 py-3 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attendance.map(row => (
                    <tr key={row.id} className={`transition ${row.checkin_at ? 'bg-success/5' : 'hover:bg-muted/80/50'}`}>
                      <td className="px-4 py-3 font-bold text-foreground">{row.nickname}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatAgeDisplay(row.age)}</td>
                      <td className="px-4 py-3">
                        {row.food_allergy ? <span className="text-error font-bold bg-error/10 px-2 py-1 rounded-md text-xs uppercase">{row.food_allergy}</span> : <span className="text-muted-foreground/70">-</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-foreground">{row.parent_name}</div>
                        <div className="text-xs text-muted-foreground">{row.parent_phone}</div>
                      </td>

                      {/* Check-in Status + E-Sign Button */}
                      <td className="px-4 py-3 text-center">
                        {row.checkin_at ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-success/15 text-success">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            เช็คอินแล้ว
                          </span>
                        ) : (
                          <button
                            id={`esign-btn-${row.id}`}
                            onClick={() => setEsignTarget(row)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-icsn-teal/10 text-icsn-teal hover:bg-icsn-teal hover:text-white border border-icsn-teal/30 transition cursor-pointer"
                            title="ลงชื่อเช็คอิน"
                          >
                            <PenLine className="w-3.5 h-3.5" />
                            เช็คอิน
                          </button>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleCancel(row.id)} className="p-2 text-error hover:bg-error/10 rounded-xl transition cursor-pointer" title="ยกเลิกจอง">
                          <XCircle className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AdminPanel>

      {/* E-Sign Modal – rendered outside AdminPanel so it's full-screen */}
      {esignTarget && session && (
        <ESignModal
          isOpen={!!esignTarget}
          booking={esignTarget}
          session={session}
          sessionDate={dailyDate}
          onClose={() => setEsignTarget(null)}
          onCheckin={async (bookingId, blob) => {
            await handleCheckin(bookingId, blob);
            setEsignTarget(null);
          }}
        />
      )}
    </div>
  );
}
