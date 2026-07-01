"use client";

import React from 'react';
import { CalendarDays, Printer, Users, XCircle, Power, Loader2, PenLine, CheckCircle2, Plus, Settings } from 'lucide-react';
import { COPY } from '@/config/copy';
import { AdminEmptyState, AdminFieldLabel, AdminPanel, AdminPanelHeader, AdminPrimaryButton, AdminDataTable } from '../admin-ui';
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
      <AdminPanel className="no-print bg-muted/20">
        <AdminPanelHeader 
          icon={CalendarDays} 
          title="จัดการรอบรายวัน (Daily Operations)" 
        />

        <div className="p-4 sm:p-6 space-y-6">
          
          {/* Step 1: Select Date & Time */}
          <section className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-icsn-navy/5 px-6 py-4 border-b border-border flex items-center gap-3">
              <div className="bg-icsn-navy/10 p-2 rounded-lg text-icsn-navy">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-icsn-navy text-lg">1. เลือกวันที่และรอบเวลา</h3>
                <p className="text-sm text-muted-foreground">เลือกวันที่เพื่อดูรอบเรียนที่มี และคลิกเลือกรอบที่ต้องการจัดการ</p>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">
                {/* Date */}
                <div className="md:col-span-5 lg:col-span-4">
                  <AdminFieldLabel>เลือกวันที่ (Date)</AdminFieldLabel>
                  <input
                    type="date"
                    value={dailyDate}
                    onChange={e => setDailyDate(e.target.value)}
                    className="block w-full px-4 mt-2 h-[48px] border border-border rounded-xl focus:border-icsn-teal focus:ring-2 focus:ring-icsn-teal/30 outline-none bg-white text-icsn-navy transition shadow-sm font-bold cursor-pointer"
                  />
                </div>
                
                {/* Sessions */}
                <div className="md:col-span-7 lg:col-span-8">
                  <AdminFieldLabel>เลือกรอบเวลา (Sessions)</AdminFieldLabel>
                  {sessions.length > 0 ? (
                    <div className="flex flex-wrap gap-3 mt-2">
                      {sessions.map(sess => (
                        <button
                          key={sess.id}
                          onClick={() => setSelectedSessionId(sess.id)}
                          className={`px-5 py-3 rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer border flex flex-col items-start gap-1 ${
                            selectedSessionId === sess.id
                              ? 'bg-icsn-teal text-white border-icsn-teal ring-2 ring-icsn-teal/20 scale-[1.02]'
                              : 'bg-white text-muted-foreground border-border hover:bg-muted hover:border-muted-foreground/30'
                          }`}
                        >
                          <span className="text-base">{sess.time_label}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            selectedSessionId === sess.id ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                          }`}>
                            จองแล้ว {sess.booked_count || 0}/{sess.total_capacity}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm mt-2 p-4 bg-muted/50 rounded-xl border border-border border-dashed font-medium">
                      ไม่มีรอบเรียนในวันนี้ หรือวันนี้เป็นวันหยุด
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Prompt to select session if none is selected */}
          {!selectedSessionId && sessions.length > 0 && (
            <div className="text-center py-10 bg-white/50 border-2 border-dashed border-border rounded-2xl">
              <p className="font-bold text-lg text-muted-foreground animate-pulse">👆 กรุณาเลือกรอบเวลาด้านบนเพื่อดูข้อมูลรายชื่อนักเรียน</p>
            </div>
          )}

          {/* Step 2: Manage Selected Session */}
          {selectedSessionId && session && (
            <section className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm animate-in fade-in zoom-in-95 duration-300">
              
              {/* Session Header */}
              <div className="bg-icsn-teal/5 px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-icsn-teal/10 p-2 rounded-lg text-icsn-teal">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-icsn-navy text-lg">2. ข้อมูลและการจัดการ (รอบ {session.time_label})</h3>
                    <p className="text-sm text-muted-foreground">ผู้จองปัจจุบัน <strong className="text-icsn-teal">{session.booked_count}</strong> จากทั้งหมด {session.total_capacity} คน</p>
                  </div>
                </div>
                
                <AdminPrimaryButton onClick={() => setIsWalkinModalOpen(true)}>
                  <Plus className="w-5 h-5 mr-1.5" /> เพิ่มนักเรียน (Walk-in)
                </AdminPrimaryButton>
              </div>

              {/* Session Controls */}
              <div className="p-6 bg-muted/10 border-b border-border flex flex-wrap gap-6 items-end">
                {/* Capacity Control */}
                <div>
                  <AdminFieldLabel>ความจุ (ที่นั่ง)</AdminFieldLabel>
                  <div className="flex mt-2 border border-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-icsn-teal/30 focus-within:border-icsn-teal transition bg-white h-[48px] shadow-sm">
                    <input
                      type="number"
                      min={1}
                      value={capacityEdit}
                      onChange={e => setCapacityEdit(e.target.value)}
                      className="w-20 px-3 text-center font-bold text-lg outline-none text-icsn-navy border-none bg-transparent"
                      title="จำนวนที่นั่งสูงสุด"
                    />
                    <button 
                      onClick={handleSaveCapacity} 
                      disabled={savingCapacity}
                      className="px-5 bg-muted hover:bg-muted/80 text-foreground font-bold border-l border-border transition disabled:opacity-50 cursor-pointer text-sm"
                    >
                      บันทึก
                    </button>
                  </div>
                </div>

                {/* Session Status Control */}
                <div>
                  <AdminFieldLabel>สถานะรับจอง (ออนไลน์)</AdminFieldLabel>
                  <button
                    onClick={handleToggleSession}
                    disabled={togglingSession}
                    className={`flex items-center justify-center gap-2 mt-2 px-6 h-[48px] rounded-xl font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 border ${
                      sessionIsActive 
                        ? 'bg-error/10 text-error hover:bg-error/20 border-error/30' 
                        : 'bg-success text-white hover:bg-success/90 border-transparent'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                    {sessionIsActive ? 'สั่งปิดรับจองชั่วคราว' : 'เปิดรับจองตามปกติ'}
                  </button>
                </div>

                {/* Print Action */}
                <div>
                  <AdminFieldLabel>ระบบเอกสาร</AdminFieldLabel>
                  <button 
                    onClick={() => window.print()} 
                    className="flex items-center justify-center gap-2 mt-2 px-6 h-[48px] bg-white border border-border hover:bg-muted text-icsn-navy rounded-xl font-bold transition shadow-sm cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-icsn-teal" /> พิมพ์รายชื่อ
                  </button>
                </div>
              </div>

              {/* Warning if closed */}
              {!sessionIsActive && (
                <div className="bg-error/10 border-b border-error/20 text-error px-6 py-3 font-bold flex items-center gap-3">
                  <span className="flex items-center justify-center w-6 h-6 bg-error/20 text-error rounded-full shrink-0">!</span>
                  คลาสรอบนี้ถูกปิดรับจองทางออนไลน์ชั่วคราวแล้ว (แต่แอดมินยังสามารถเพิ่ม Walk-in ได้)
                </div>
              )}

              {/* Attendance Table */}
              <div className="p-6">
                <h3 className="font-bold text-icsn-navy mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-icsn-teal" /> 
                  รายชื่อนักเรียน
                </h3>

                {loading ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="w-8 h-8 animate-spin text-icsn-teal/50" />
                  </div>
                ) : attendance.length === 0 ? (
                  <AdminEmptyState message={COPY.EMPTY_STATES.NO_STUDENTS} />
                ) : (
                  <AdminDataTable
                    headers={[
                      { label: 'ชื่อเล่น (Nickname)' },
                      { label: 'อายุ (Age)' },
                      { label: 'แพ้อาหาร (Allergies)' },
                      { label: 'ผู้ปกครอง (Parent)' },
                      { label: 'เช็คอิน', align: 'center' },
                      { label: 'จัดการ', align: 'right' },
                    ]}
                  >
                    {attendance.map(row => (
                      <tr key={row.id} className={`transition ${row.checkin_at ? 'bg-success/5' : 'hover:bg-muted/30'}`}>
                        <td className="px-6 py-4 font-bold text-icsn-navy">{row.nickname}</td>
                        <td className="px-6 py-4 text-muted-foreground">{formatAgeDisplay(row.age)}</td>
                        <td className="px-6 py-4">
                          {row.food_allergy ? <span className="text-error font-bold bg-error/10 px-3 py-1 rounded-lg text-xs uppercase">{row.food_allergy}</span> : <span className="text-muted-foreground/50">-</span>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-icsn-navy">{row.parent_name}</div>
                          <div className="text-xs text-muted-foreground">{row.parent_phone}</div>
                        </td>

                        {/* Check-in Status + E-Sign Button */}
                        <td className="px-6 py-4 text-center">
                          {row.checkin_at ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-success/15 text-success border border-success/20">
                              <CheckCircle2 className="w-4 h-4" />
                              เช็คอินแล้ว
                            </span>
                          ) : (
                            <button
                              id={`esign-btn-${row.id}`}
                              onClick={() => setEsignTarget(row)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-icsn-teal/10 text-icsn-teal hover:bg-icsn-teal hover:text-white border border-icsn-teal/30 transition cursor-pointer"
                              title="ลงชื่อเช็คอิน"
                            >
                              <PenLine className="w-4 h-4" />
                              เช็คอิน
                            </button>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end">
                            <button 
                              onClick={() => handleCancel(row.id)} 
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-200"
                              title="ยกเลิกจอง"
                            >
                              <XCircle className="w-4 h-4" /> ยกเลิกจอง
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </AdminDataTable>
                )}
              </div>
            </section>
          )}

          <AdminWalkinModal 
            isOpen={isWalkinModalOpen}
            sessionId={selectedSessionId}
            onClose={() => setIsWalkinModalOpen(false)}
            onSuccess={() => {
              onRefresh?.();
              refreshData?.();
            }}
          />
        </div>
      </AdminPanel>

      {/* E-Sign Modal */}
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
