"use client";

import React from 'react';
import { CalendarDays } from 'lucide-react';
import { AdminPanel, AdminPanelHeader } from '../admin-ui';
import { AdminWalkinModal } from '../walkin/AdminWalkinModal';
import { ESignModal } from '../checkin/ESignModal';
import { useDailyAttendance } from '@/hooks/useDailyAttendance';
import type { DailyAttendanceRow } from '@/types';

import { DailyOpsSelectors } from './daily-ops/DailyOpsSelectors';
import { DailyOpsSessionControls } from './daily-ops/DailyOpsSessionControls';
import { DailyOpsAttendanceTable } from './daily-ops/DailyOpsAttendanceTable';
import { DailyOpsToggleModals } from './daily-ops/DailyOpsToggleModals';

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
    capacityEdit,
    setCapacityEdit,
    trialCapacityEdit,
    setTrialCapacityEdit,
    savingCapacity,
    sessionIsActive,
    togglingSession,
    handleCancel,
    handleCheckin,
    handleSaveCapacity,
    handleCloseSession,
    handleOpenSession,
    refreshData,
  } = useDailyAttendance({ onRefresh });

  const [closeModalOpen, setCloseModalOpen] = React.useState(false);
  const [closeReason, setCloseReason] = React.useState('');
  const [openModalOpen, setOpenModalOpen] = React.useState(false);

  const handlePrevDay = () => {
    const d = new Date(`${dailyDate}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    setDailyDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(`${dailyDate}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    setDailyDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPanel className="no-print bg-muted/20">
        <AdminPanelHeader
          icon={CalendarDays}
          title="จัดการรอบรายวัน (Daily Operations)"
        />

        <div className="p-4 space-y-4">
          <DailyOpsSelectors
            dailyDate={dailyDate}
            setDailyDate={setDailyDate}
            handlePrevDay={handlePrevDay}
            handleNextDay={handleNextDay}
            sessions={sessions}
            selectedSessionId={selectedSessionId}
            setSelectedSessionId={setSelectedSessionId}
          />

          {/* Step 2: Session management */}
          {selectedSessionId && session && (
            <section className="bg-white border border-border rounded-xl shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300">
              <DailyOpsSessionControls
                session={session}
                attendance={attendance}
                capacityEdit={capacityEdit}
                setCapacityEdit={setCapacityEdit}
                trialCapacityEdit={trialCapacityEdit}
                setTrialCapacityEdit={setTrialCapacityEdit}
                savingCapacity={savingCapacity}
                handleSaveCapacity={handleSaveCapacity}
                sessionIsActive={sessionIsActive}
                togglingSession={togglingSession}
                setIsWalkinModalOpen={setIsWalkinModalOpen}
                setCloseModalOpen={setCloseModalOpen}
                setOpenModalOpen={setOpenModalOpen}
              />

              <DailyOpsAttendanceTable
                loading={loading}
                attendance={attendance}
                setEsignTarget={setEsignTarget}
                handleCancel={handleCancel}
              />
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

      {/* Modals for Toggle Session */}
      <DailyOpsToggleModals
        closeModalOpen={closeModalOpen}
        setCloseModalOpen={setCloseModalOpen}
        closeReason={closeReason}
        setCloseReason={setCloseReason}
        handleCloseSession={handleCloseSession}
        openModalOpen={openModalOpen}
        setOpenModalOpen={setOpenModalOpen}
        handleOpenSession={handleOpenSession}
        togglingSession={togglingSession}
      />
    </div>
  );
}
