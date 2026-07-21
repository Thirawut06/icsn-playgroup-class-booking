import React from 'react';
import { Settings, Plus, Power } from 'lucide-react';
import { AdminButton } from '../../admin-ui';
import type { Session, DailyAttendanceRow } from '@/types';

interface DailyOpsSessionControlsProps {
  session: Session;
  attendance: DailyAttendanceRow[];
  capacityEdit: string;
  setCapacityEdit: (val: string) => void;
  trialCapacityEdit: string;
  setTrialCapacityEdit: (val: string) => void;
  savingCapacity: boolean;
  handleSaveCapacity: () => void;
  sessionIsActive: boolean;
  togglingSession: boolean;
  setIsWalkinModalOpen: (open: boolean) => void;
  setCloseModalOpen: (open: boolean) => void;
  setOpenModalOpen: (open: boolean) => void;
}

export function DailyOpsSessionControls({
  session,
  attendance,
  capacityEdit,
  setCapacityEdit,
  trialCapacityEdit,
  setTrialCapacityEdit,
  savingCapacity,
  handleSaveCapacity,
  sessionIsActive,
  togglingSession,
  setIsWalkinModalOpen,
  setCloseModalOpen,
  setOpenModalOpen
}: DailyOpsSessionControlsProps) {
  return (
    <>
      {/* Session header — compact single bar */}
      <div className="px-4 py-3 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-icsn-teal/5">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-icsn-teal" />
          <span className="font-bold text-icsn-navy text-lg">
            รอบ {session.time_label}
          </span>
          <span className="text-base text-muted-foreground">
            · จอง <strong className="text-icsn-teal">{session.booked_count}</strong>/{session.total_capacity} คน
            <span className="ml-2 px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-sm font-bold border border-purple-200">
              Trial ว่าง {Math.max(0, (session.trial_capacity ?? 0) - attendance.filter(r => r.is_trial).length)}/{session.trial_capacity ?? 0}
            </span>
          </span>
        </div>

        <AdminButton variant="primary" icon={Plus} onClick={() => setIsWalkinModalOpen(true)}>
          เพิ่ม Walk-in
        </AdminButton>
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
              className="w-16 px-2 text-center font-bold text-base outline-none text-icsn-navy bg-transparent border-r border-border"
              title="จำนวนที่นั่งรวมสูงสุด"
            />
            <div className="flex items-center bg-purple-50 px-2 border-r border-border" title="โควต้า Trial">
               <span className="text-sm font-bold text-purple-700 mr-1">Trial:</span>
               <input
                 type="number"
                 min={0}
                 value={trialCapacityEdit}
                 onChange={e => setTrialCapacityEdit(e.target.value)}
                 className="w-12 text-center font-bold text-base outline-none text-purple-700 bg-transparent"
               />
            </div>
            <button
              type="button"
              onClick={handleSaveCapacity}
              disabled={savingCapacity}
              className="px-4 bg-muted hover:bg-muted/80 text-foreground font-bold transition disabled:opacity-50 text-sm"
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
          onClick={() => {
            if (sessionIsActive) {
              setCloseModalOpen(true);
            } else {
              setOpenModalOpen(true);
            }
          }}
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


      </div>

      {/* Closed warning */}
      {!sessionIsActive && (
        <div className="bg-error/10 border-b border-error/20 text-error px-4 py-2 text-sm font-bold flex items-center gap-2">
          <span className="w-5 h-5 bg-error/20 rounded-full flex items-center justify-center shrink-0 text-xs">!</span>
          <span className="text-sm">คลาสนี้ถูกปิดรับจองทางออนไลน์ชั่วคราว (แอดมินยังเพิ่ม Walk-in ได้)</span>
        </div>
      )}
    </>
  );
}
