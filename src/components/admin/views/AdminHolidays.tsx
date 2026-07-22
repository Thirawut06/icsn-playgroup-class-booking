"use client";

import React from 'react';
import { CalendarCog, AlertTriangle, Loader2 } from 'lucide-react';
import { AdminPanel, AdminPanelHeader } from '../admin-ui';
import { useAdminHolidays } from './holidays/useAdminHolidays';
import { HolidaysCalendar } from './holidays/HolidaysCalendar';
import { WeeklyConfigPanel } from './holidays/WeeklyConfigPanel';
import { OverrideConfigPanel } from './holidays/OverrideConfigPanel';
import { ClosureAndSessionPanels } from './holidays/ClosureAndSessionPanels';

export function AdminHolidays() {
  const hook = useAdminHolidays();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPanel className="no-print">
        <AdminPanelHeader
          icon={CalendarCog}
          title="จัดการวันเปิด-ปิด (Calendar & Holidays)"
        />

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Calendar */}
            <HolidaysCalendar
              currentViewDate={hook.currentViewDate}
              monthIndex={hook.monthIndex}
              setMonthIndex={hook.setMonthIndex}
              sessions={hook.sessions}
              closures={hook.closures}
              operatingDays={hook.operatingDays}
              selectionMode={hook.selectionMode}
              rangeStart={hook.rangeStart}
              rangeEnd={hook.rangeEnd}
              multiDates={hook.multiDates}
              handleDayClick={hook.handleDayClick}
              loading={hook.loading}
              hoverDate={hook.hoverDate}
              setHoverDate={hook.setHoverDate}
              isPickingRangeEnd={hook.isPickingRangeEnd}
            />

            {/* Right Column: Unified Config Panel */}
            <div className="lg:col-span-5 space-y-4">
              <WeeklyConfigPanel
                tempOperatingDays={hook.tempOperatingDays}
                operatingDays={hook.operatingDays}
                savingSettings={hook.savingSettings}
                handleSaveSettings={hook.handleSaveSettings}
                toggleTempDay={hook.toggleTempDay}
              />

              <OverrideConfigPanel
                selectionMode={hook.selectionMode}
                setSelectionMode={hook.setSelectionMode}
                multiDates={hook.multiDates}
                setMultiDates={hook.setMultiDates}
                rangeStart={hook.rangeStart}
                setRangeStart={hook.setRangeStart}
                rangeEnd={hook.rangeEnd}
                setRangeEnd={hook.setRangeEnd}
                setIsPickingRangeEnd={hook.setIsPickingRangeEnd}
                isPickingRangeEnd={hook.isPickingRangeEnd}
                overrideStatus={hook.overrideStatus}
                setOverrideStatus={hook.setOverrideStatus}
                overrideReason={hook.overrideReason}
                setOverrideReason={hook.setOverrideReason}
                handleSaveOverride={hook.handleSaveOverride}
                savingOverride={hook.savingOverride}
              />

              <ClosureAndSessionPanels
                selectionMode={hook.selectionMode}
                rangeStart={hook.rangeStart}
                rangeEnd={hook.rangeEnd}
                multiDates={hook.multiDates}
                sessions={hook.sessions}
                closures={hook.closures}
                fetchData={hook.fetchData}
                handleDeleteClosure={hook.handleDeleteClosure}
              />
            </div>
          </div>
        </div>
      </AdminPanel>
    </div>
  );
}
