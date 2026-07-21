import React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { AdminStepBadge } from '../../admin-ui';
import { getThaiMonthName } from '@/utils/dateUtils';
import type { SchoolClosure, Session } from '@/types';

interface HolidaysCalendarProps {
  currentViewDate: Date;
  monthIndex: number;
  setMonthIndex: React.Dispatch<React.SetStateAction<number>>;
  sessions: Session[];
  closures: SchoolClosure[];
  operatingDays: number[];
  selectionMode: 'range' | 'multi';
  rangeStart: string;
  rangeEnd: string;
  multiDates: string[];
  handleDayClick: (dateStr: string, isCurrentlyOpen: boolean, existingClosure: SchoolClosure | undefined) => void;
  loading: boolean;
  hoverDate: string | null;
  setHoverDate: (date: string | null) => void;
  isPickingRangeEnd: boolean;
}

export function HolidaysCalendar({
  currentViewDate,
  monthIndex,
  setMonthIndex,
  sessions,
  closures,
  operatingDays,
  selectionMode,
  rangeStart,
  rangeEnd,
  multiDates,
  handleDayClick,
  loading,
  hoverDate,
  setHoverDate,
  isPickingRangeEnd
}: HolidaysCalendarProps) {
  const monthName = getThaiMonthName(currentViewDate);
  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth();

  const getDaysInMonth = () => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const daysArray = [];

    for (let i = 0; i < firstDay; i++) {
      daysArray.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      daysArray.push({
        day: i,
        dateStr: `${d.getFullYear()}-${mm}-${dd}`,
      });
    }

    return daysArray;
  };

  const daysList = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  return (
    <div className="lg:col-span-7 lg:sticky lg:top-24 self-start relative">
      <div className="px-0 sm:px-4 py-4 space-y-4">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-3">
          <AdminStepBadge 
            step={1} 
            label={<span className="flex items-center gap-1.5"><CalendarIcon className="w-5 h-5 text-icsn-teal ml-0.5" />คลิกเลือกวันที่</span>} 
            className="text-base"
          />

          <div className="flex items-center gap-1">
            <button
              onClick={() => setMonthIndex((m: number) => m - 1)}
              className="p-2 hover:bg-muted/80 rounded-xl transition text-icsn-navy"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h4 className="text-sm font-bold text-icsn-navy bg-muted px-2.5 py-1.5 rounded-xl">
              {monthName}
            </h4>
            <button
              onClick={() => setMonthIndex((m: number) => m + 1)}
              className="p-2 hover:bg-muted/80 rounded-xl transition text-icsn-navy"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Thai Week Names */}
        <div className="grid grid-cols-7 text-center text-sm font-bold text-muted-foreground/70">
          {daysList.map((d, idx) => <div key={idx}>{d}</div>)}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5 text-center font-bold text-base">
          {getDaysInMonth().map((dayObj, i) => {
            if (!dayObj) return <div key={`empty-${i}`} className="py-2 text-transparent"></div>;

            // Sync with User View Logic
            const daySessions = sessions.filter(s => s.session_date === dayObj.dateStr);
            const closureForDate = closures.find(c => dayObj.dateStr >= c.start_date && dayObj.dateStr <= c.end_date && !c.time_label);
            // Timezone safe target date
            const targetDate = new Date(dayObj.dateStr + "T00:00:00Z");
            const dayOfWeek = targetDate.getUTCDay();
            const isBaseOperatingDay = operatingDays.includes(dayOfWeek);

            // Determine if the day is fundamentally open (ignoring sessions)
            let isFundamentallyOpen = isBaseOperatingDay;
            if (closureForDate) {
              isFundamentallyOpen = !!closureForDate.is_force_open;
            }

            // Check if any active session is open for booking on this day
            const hasAnySession = daySessions.length > 0;
            const hasOpenSession = daySessions.some(s => s.is_active && (s.total_capacity - (s.booked_count || 0)) > 0);

            // It is "Bookable" (open) if it's fundamentally open AND (no sessions OR has open sessions)
            const isBookable = isFundamentallyOpen && (!hasAnySession || hasOpenSession);

            // A date is "selected" visually if it falls within the override range or multi array
            const isSelected = (selectionMode === 'range')
              ? !!(rangeStart && rangeEnd && dayObj.dateStr >= rangeStart && dayObj.dateStr <= rangeEnd)
              : multiDates.includes(dayObj.dateStr);

            const minHoverDate = (rangeStart && hoverDate) ? (rangeStart < hoverDate ? rangeStart : hoverDate) : null;
            const maxHoverDate = (rangeStart && hoverDate) ? (rangeStart > hoverDate ? rangeStart : hoverDate) : null;
            const isInHoverRange = selectionMode === 'range' && isPickingRangeEnd && minHoverDate && maxHoverDate
              ? (dayObj.dateStr >= minHoverDate && dayObj.dateStr <= maxHoverDate)
              : false;

            let btnClass = "text-muted-foreground/70 bg-muted/50";
            let dotClass = "bg-transparent";

            const isForcedOpen = closureForDate && closureForDate.is_force_open;
            const isExplicitlyClosed = closureForDate && !closureForDate.is_force_open;
            const isFullyBooked = isFundamentallyOpen && hasAnySession && !hasOpenSession;

            if (isBookable) {
              if (isSelected) {
                btnClass = "bg-primary text-primary-foreground shadow-md font-black scale-[1.05]";
                dotClass = "bg-white";
              } else if (isInHoverRange) {
                btnClass = "bg-primary/20 text-primary border border-primary/40";
                dotClass = "bg-primary/50";
              } else if (isForcedOpen) {
                btnClass = "bg-success/10 text-success border border-success/30 hover:border-success/50 hover:bg-success/20";
                dotClass = "bg-success";
              } else {
                btnClass = "bg-background text-foreground border border-border hover:border-primary/30 hover:bg-primary/5";
                dotClass = "bg-primary";
              }
            } else {
              // Unbookable
              if (isSelected) {
                btnClass = "bg-foreground text-background shadow-md font-black scale-[1.05]";
                dotClass = "bg-background";
              } else if (isInHoverRange) {
                btnClass = "bg-foreground/20 text-foreground border border-foreground/40";
                dotClass = "bg-foreground/50";
              } else if (isExplicitlyClosed) {
                btnClass = "bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20";
                dotClass = "bg-destructive";
              } else if (isFullyBooked) {
                btnClass = "bg-destructive/5 text-destructive/80 border border-destructive/20";
                dotClass = "bg-destructive/50";
              } else {
                btnClass = "bg-muted text-muted-foreground/60 cursor-not-allowed opacity-60";
                dotClass = "bg-transparent";
              }
            }

            return (
              <button
                key={dayObj.dateStr}
                onMouseEnter={() => {
                  if (isPickingRangeEnd && selectionMode === 'range') {
                    setHoverDate(dayObj.dateStr);
                  }
                }}
                onClick={() => handleDayClick(dayObj.dateStr, isBookable, closureForDate)}
                disabled={loading}
                className={`py-3 rounded-xl transition-all flex flex-col items-center justify-center relative cursor-pointer active:scale-95 ${btnClass}`}
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
            ปิดปกติ
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-primary rounded-full shadow-sm"></span>
            เปิดรับจองปกติ
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-success rounded-full shadow-sm"></span>
            <span className="text-success font-bold">บังคับเปิดพิเศษ</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-destructive rounded-full shadow-sm"></span>
            <span className="text-destructive font-bold">ปิดรับจองพิเศษ</span>
          </span>
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-2xl z-20">
          <Loader2 className="w-8 h-8 animate-spin text-icsn-teal" />
        </div>
      )}
    </div>
  );
}
