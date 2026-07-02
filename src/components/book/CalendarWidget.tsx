import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Session } from '@/types';
import { useBookingContext } from './BookingContext';
import { getThaiMonthName, checkIsBookableDate } from '@/utils/dateUtils';
import { COPY } from '@/config/copy';

export interface DayObj {
  day: number;
  dateStr: string;
  sessions: Session[];
}

interface CalendarWidgetProps {
  monthIndex: number;
  onMonthChange: (index: number) => void;
  selectedDates: string[];
  onDateSelect: (dayObj: DayObj) => void;
}

export function CalendarWidget({
  monthIndex,
  onMonthChange,
  selectedDates,
  onDateSelect,
}: CalendarWidgetProps) {
  const { 
    sessions, 
    myBookings, 
    closures, 
    settings, 
    selectedChildId 
  } = useBookingContext();
  const cutoffHour = settings?.cutoff_hour ?? 7;

  const currentViewDate = new Date();
  currentViewDate.setMonth(currentViewDate.getMonth() + monthIndex);
  const monthName = getThaiMonthName(currentViewDate);

  const getDaysInMonth = (): (DayObj | null)[] => {
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const days: (DayObj | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const sessionsForDate = sessions.filter(s => s.session_date === dateStr);
      days.push({ day: i, dateStr, sessions: sessionsForDate });
    }
    return days;
  };

  return (
    <div className="px-4 py-4 border-b border-border/40 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-icsn-navy flex items-center gap-1.5 text-base">
          <CalendarIcon className="w-5 h-5 text-icsn-teal" />
          <span>{COPY.BOOKING_FLOW.STEP_2}</span>
        </h3>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onMonthChange(0)}
            className="p-2 hover:bg-muted/80 rounded-xl transition text-icsn-navy disabled:opacity-30 disabled:hover:bg-transparent"
            disabled={monthIndex === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h4 className="text-sm font-bold text-icsn-navy bg-muted px-2.5 py-1.5 rounded-xl">
            {monthName}
          </h4>
          <button
            onClick={() => onMonthChange(1)}
            className="p-2 hover:bg-muted/80 rounded-xl transition text-icsn-navy disabled:opacity-30 disabled:hover:bg-transparent"
            disabled={monthIndex === 1}
            title="ดูรอบเรียนล่วงหน้า 2 เดือน"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Thai Week Names */}
      <div className="grid grid-cols-7 text-center text-sm font-bold text-muted-foreground/70">
        <div>อา</div><div>จ</div><div>อ</div><div>พ</div><div>พฤ</div><div>ศ</div><div>ส</div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5 text-center font-bold text-base">
        {getDaysInMonth().map((dayObj, i) => {
          if (!dayObj) return <div key={`empty-${i}`} className="py-2 text-transparent"></div>;

          // Check if any active session is open for booking on this day
          const hasOpenSession = dayObj.sessions.some(s => s.is_active && (s.total_capacity - (s.booked_count || 0)) > 0);
          
          // Check if day is fundamentally bookable based on date/cutoff/closures/operatingDays
          const operatingDays = settings?.operating_days || [0, 1, 2, 3, 4, 5, 6];
          const isDateBookable = checkIsBookableDate(dayObj.dateStr, closures, operatingDays, cutoffHour);
          
          // True if bookable AND has at least one open session
          const isBookable = isDateBookable && (dayObj.sessions.length === 0 || hasOpenSession);

          const isSelected = selectedDates.includes(dayObj.dateStr);
          const isBooked = myBookings.some(b => b.session_date === dayObj.dateStr && b.child_id === selectedChildId);

          let btnClass = "text-muted-foreground/70 bg-muted/50";
          let dotClass = "bg-transparent";

          if (isBookable) {
            if (isSelected) {
              btnClass = "bg-primary text-primary-foreground shadow-md font-black scale-[1.05]";
              dotClass = "bg-white";
            } else if (isBooked) {
              btnClass = "bg-primary/10 text-primary border border-primary/30 font-black";
              dotClass = "bg-primary";
            } else {
              btnClass = "bg-background text-foreground border border-border hover:border-primary/30 hover:bg-primary/5";
              dotClass = "bg-primary";
            }
          } else {
            const isFuture = new Date(dayObj.dateStr) >= new Date(new Date().setHours(0, 0, 0, 0));
            if (isBooked) {
              if (isSelected) {
                btnClass = "bg-foreground text-background shadow-md font-black scale-[1.05]";
                dotClass = "bg-background";
              } else {
                btnClass = "bg-foreground/5 text-foreground border border-foreground/20 font-black";
                dotClass = "bg-foreground";
              }
            } else if (isFuture) {
              const isBaseOperatingDay = operatingDays.includes(new Date(dayObj.dateStr).getDay());
              const closureForDate = closures.find(c => dayObj.dateStr >= c.start_date && dayObj.dateStr <= c.end_date && !c.time_label);
              const isExplicitlyClosed = (closureForDate && !closureForDate.is_force_open) || (!isBaseOperatingDay && closureForDate && !closureForDate.is_force_open);
              const hasClosedSession = dayObj.sessions.some(s => !s.is_active && s.theme);

              if (isExplicitlyClosed || (isBaseOperatingDay && hasClosedSession)) {
                // Explicitly closed by admin
                btnClass = "bg-destructive/10 text-destructive border border-destructive/20 cursor-not-allowed";
                dotClass = "bg-destructive";
              } else if (isBaseOperatingDay) {
                // Operating day but fully booked
                btnClass = "bg-muted text-muted-foreground cursor-not-allowed";
                dotClass = "bg-destructive";
              } else {
                // Normal weekend / non-operating day
                btnClass = "bg-muted text-muted-foreground/60 cursor-not-allowed opacity-60";
                dotClass = "bg-transparent";
              }
            } else {
              btnClass = "bg-muted text-muted-foreground cursor-not-allowed opacity-60";
              dotClass = "bg-transparent";
            }
          }

          // If it's already booked, clicking does nothing
          // If it's selected, clicking removes it (even if it's currently marked as not bookable now for some reason)
          const canClick = isSelected || (isBookable && !isBooked);

          return (
            <button
              key={dayObj.dateStr}
              onClick={() => canClick && onDateSelect(dayObj)}
              disabled={!canClick}
              className={`py-3 rounded-xl transition-all flex flex-col items-center justify-center relative ${!canClick ? 'cursor-not-allowed' : 'cursor-pointer active:scale-95'} ${btnClass}`}
            >
              <span>{dayObj.day}</span>
              <span className={`w-1.5 h-1.5 rounded-full mt-1 ${dotClass}`}></span>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="pt-2 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground font-medium">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-muted border border-border rounded-full"></span>
          ผ่านไปแล้ว / วันหยุด
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-primary rounded-full shadow-sm"></span>
          เปิดให้จอง
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-destructive rounded-full shadow-sm"></span>
          เต็มแล้ว / ปิดจอง
        </span>
      </div>
    </div>
  );
}
