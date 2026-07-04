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
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPanel className="no-print bg-muted/20">
        <AdminPanelHeader
          icon={CalendarDays}
          title="จัดการรอบรายวัน (Daily Operations)"
        />

        <div className="p-4 space-y-4">

          {/* Step 1: Date + Sessions — single compact row */}
          <section className="bg-white border border-border rounded-xl shadow-sm p-4">
            <div className="flex flex-col md:flex-row md:items-end gap-4">

              {/* Date picker */}
              <div className="shrink-0">
                <AdminFieldLabel>วันที่</AdminFieldLabel>
                <input
                  type="date"
                  value={dailyDate}
                  onChange={e => setDailyDate(e.target.value)}
                  className="mt-1.5 block px-3 h-[44px] border border-border rounded-lg focus:border-icsn-teal focus:ring-2 focus:ring-icsn-teal/30 outline-none bg-white text-icsn-navy transition shadow-sm font-bold cursor-pointer text-base"
                />
              </div>

              {/* Session chips */}
              <div className="flex-1">
                <AdminFieldLabel>รอบเวลา</AdminFieldLabel>
                {sessions.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {sessions.map(sess => (
                      <button
                        key={sess.id}
                        type="button"
                        onClick={() => setSelectedSessionId(sess.id)}
                        className={`px-5 h-[44px] rounded-lg text-base font-bold transition-all border flex items-center gap-2 cursor-pointer ${
                          selectedSessionId === sess.id
                            ? 'bg-icsn-teal text-white border-icsn-teal ring-2 ring-icsn-teal/20'
                            : 'bg-white text-muted-foreground border-border hover:bg-muted hover:border-muted-foreground/30'
                        }`}
                      >
                        {sess.time_label}
                        <span className={`text-sm px-2 py-0.5 rounded-full ${
                          selectedSessionId === sess.id ? 'bg-white/25 text-white' : 'bg-muted text-muted-foreground'
                        }`}>
                          {sess.booked_count || 0}/{sess.total_capacity}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-1.5 text-muted-foreground text-base p-3 bg-muted/50 rounded-lg border border-dashed border-border">
                    ไม่มีรอบเรียนในวันนี้ หรือวันนี้เป็นวันหยุด
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Prompt if no session selected */}
          {!selectedSessionId && sessions.length > 0 && (
            <div className="text-center py-8 bg-white/50 border-2 border-dashed border-border rounded-xl">
              <p className="font-bold text-muted-foreground text-base animate-pulse">👆 กรุณาเลือกรอบเวลาด้านบน</p>
            </div>
          )}

          {/* Step 2: Session management */}
          {selectedSessionId && session && (
            <section className="bg-white border border-border rounded-xl shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300">

              {/* Session header — compact single bar */}
              <div className="px-4 py-3 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-icsn-teal/5">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-icsn-teal" />
                  <span className="font-bold text-icsn-navy text-lg">
                    รอบ {session.time_label}
                  </span>
                  <span className="text-base text-muted-foreground">
                    · จอง <strong className="text-icsn-teal">{session.booked_count}</strong>/{session.total_capacity} คน
                  </span>
                </div>

                <AdminPrimaryButton onClick={() => setIsWalkinModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" /> เพิ่ม Walk-in
                </AdminPrimaryButton>
              </div>

              {/* Controls — inline toolbar */}
              <div className="px-4 py-3 bg-muted/10 border-b border-border flex flex-wrap items-center gap-3">
                {/* Capacity */}
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-muted-foreground">ที่นั่ง:</span>
                  <div className="flex border border-border rounded-lg overflow-hidden h-[42px] bg-white shadow-sm">
                    <input
                      type="number"
                      min={1}
                      value={capacityEdit}
                      onChange={e => setCapacityEdit(e.target.value)}
                      className="w-16 px-2 text-center font-bold text-base outline-none text-icsn-navy bg-transparent"
                      title="จำนวนที่นั่งสูงสุด"
                    />
                    <button
                      type="button"
                      onClick={handleSaveCapacity}
                      disabled={savingCapacity}
                      className="px-4 bg-muted hover:bg-muted/80 text-foreground font-bold border-l border-border transition disabled:opacity-50 text-sm"
                    >
                      บันทึก
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-6 w-px bg-border" />

                {/* Toggle session */}
                <button
                  type="button"
                  onClick={handleToggleSession}
                  disabled={togglingSession}
                  className={`flex items-center gap-1.5 px-5 h-[42px] rounded-lg font-bold text-sm transition-all border cursor-pointer disabled:opacity-50 ${
                    sessionIsActive
                      ? 'bg-error/10 text-error hover:bg-error/20 border-error/30'
                      : 'bg-success text-white hover:bg-success/90 border-transparent'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  {sessionIsActive ? 'ปิดรับจองชั่วคราว' : 'เปิดรับจอง'}
                </button>

                {/* Divider */}
                <div className="h-6 w-px bg-border" />

                {/* Print */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-5 h-[42px] bg-white border border-border hover:bg-muted text-icsn-navy rounded-lg font-bold text-sm transition shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5 text-icsn-teal" /> พิมพ์รายชื่อ
                </button>
              </div>

              {/* Closed warning */}
              {!sessionIsActive && (
                <div className="bg-error/10 border-b border-error/20 text-error px-4 py-2 text-sm font-bold flex items-center gap-2">
                  <span className="w-5 h-5 bg-error/20 rounded-full flex items-center justify-center shrink-0 text-xs">!</span>
                  <span className="text-sm">คลาสนี้ถูกปิดรับจองทางออนไลน์ชั่วคราว (แอดมินยังเพิ่ม Walk-in ได้)</span>
                </div>
              )}

              {/* Attendance table */}
              <div className="p-4">
                <h3 className="font-bold text-icsn-navy mb-3 flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-icsn-teal" />
                  รายชื่อนักเรียน
                </h3>

                {loading ? (
                  <div className="flex justify-center items-center h-24">
                    <Loader2 className="w-6 h-6 animate-spin text-icsn-teal/50" />
                  </div>
                ) : attendance.length === 0 ? (
                  <AdminEmptyState message={COPY.EMPTY_STATES.NO_STUDENTS} />
                ) : (
                  <AdminDataTable
                    headers={[
                      { label: 'ชื่อเล่น' },
                      { label: 'อายุ' },
                      { label: 'แพ้อาหาร' },
                      { label: 'ผู้ปกครอง' },
                      { label: 'เช็คอิน', align: 'center' },
                      { label: 'จัดการ', align: 'right' },
                    ]}
                  >
                    {attendance.map(row => (
                      <tr key={row.id} className={`transition ${row.checkin_at ? 'bg-success/5' : 'hover:bg-muted/30'}`}>
                        <td className="px-4 py-3 font-bold text-icsn-navy text-base">{row.nickname}</td>
                        <td className="px-4 py-3 text-muted-foreground text-base">{formatAgeDisplay(row.age)}</td>
                        <td className="px-4 py-3 text-base">
                          {row.food_allergy
                            ? <span className="text-error font-bold bg-error/10 px-2 py-0.5 rounded text-sm uppercase">{row.food_allergy}</span>
                            : <span className="text-muted-foreground/50">-</span>
                          }
                        </td>
                        <td className="px-4 py-3 text-base">
                          <div className="font-semibold text-icsn-navy">{row.parent_name}</div>
                          <div className="text-sm text-muted-foreground">{row.parent_phone}</div>
                        </td>

                        {/* Check-in */}
                        <td className="px-4 py-3 text-center">
                          {row.checkin_at ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-success/15 text-success border border-success/20">
                              <CheckCircle2 className="w-4 h-4" /> เช็คอินแล้ว
                            </span>
                          ) : (
                            <button
                              id={`esign-btn-${row.id}`}
                              type="button"
                              onClick={() => setEsignTarget(row)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-icsn-teal/10 text-icsn-teal hover:bg-icsn-teal hover:text-white border border-icsn-teal/30 transition cursor-pointer"
                            >
                              <PenLine className="w-4 h-4" /> เช็คอิน
                            </button>
                          )}
                        </td>

                        {/* Cancel */}
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleCancel(row.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded text-sm font-bold text-error hover:bg-error/10 border border-transparent hover:border-error/30 transition-colors"
                            title="ยกเลิกจอง"
                          >
                            <XCircle className="w-4 h-4" /> ยกเลิก
                          </button>
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
