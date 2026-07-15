import React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { getThaiMonthName } from '@/utils/dateUtils';
import type { SchoolClosure, Session } from '@/types';

interface HolidaysCalendarProps {
  currentViewDate: Date;
  monthIndex: number;
  setMonthIndex: React.Dispatch<React.SetStateAction<number>>;
  sessions: Session[];
  closures: SchoolClosure[];
  operatingDays: number[];
  selectionMode: 'single' | 'range' | 'multi';
  rangeStart: string;
  rangeEnd: string;
  multiDates: string[];
  handleDayClick: (dateStr: string, isCurrentlyOpen: boolean, existingClosure: SchoolClosure | undefined) => void;
  loading: boolean;
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
  loading
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
          <h3 className="font-bold text-icsn-navy flex items-center gap-1.5 text-base">
            <CalendarIcon className="w-5 h-5 text-icsn-teal" />
            <span>เลือกวันที่เพื่อตั้งค่า</span>
          </h3>

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
            const dayOfWeek = new Date(dayObj.dateStr).getDay();
            const isBaseOperatingDay = operatingDays.includes(dayOfWeek);

            // Determine if the day is fundamentally open (ignoring sessions)
            let isFundamentallyOpen = isBaseOperatingDay;
            if (closureForDate) {
              isFundamentallyOpen = !!closureForDate.is_force_open;
            }

            // Check if any active session is open for booking on this day
            const hasOpenSession = daySessions.some(s => s.is_active && (s.total_capacity - (s.booked_count || 0)) > 0);

            // It is "Bookable" (open) if it's fundamentally open AND (no sessions OR has open sessions)
            const isBookable = isFundamentallyOpen && (daySessions.length === 0 || hasOpenSession);

            // A date is "selected" visually if it falls within the override range or multi array
            const isSelected = (selectionMode === 'range' || selectionMode === 'single')
              ? !!(rangeStart && rangeEnd && dayObj.dateStr >= rangeStart && dayObj.dateStr <= rangeEnd)
              : multiDates.includes(dayObj.dateStr);

            const isFuture = new Date(dayObj.dateStr) >= new Date(new Date().setHours(0, 0, 0, 0));

            // Exact same styling logic from CalendarWidget.tsx
            let btnClass = "text-muted-foreground/70 bg-muted/50";
            let dotClass = "bg-transparent";

            if (isBookable) {
              if (isSelected) {
                btnClass = "bg-primary text-primary-foreground shadow-md font-black scale-[1.05]";
                dotClass = "bg-white";
              } else {
                btnClass = "bg-background text-foreground border border-border hover:border-primary/30 hover:bg-primary/5";
                dotClass = "bg-primary";
              }
            } else {
              if (isSelected) {
                btnClass = "bg-foreground text-background shadow-md font-black scale-[1.05]";
                dotClass = "bg-background";
              } else if (isFuture) {
                const isExplicitlyClosed = (closureForDate && !closureForDate.is_force_open) || (!isBaseOperatingDay && closureForDate && !closureForDate.is_force_open);
                const hasClosedSession = daySessions.some(s => !s.is_active && s.theme);

                if (isExplicitlyClosed || (isBaseOperatingDay && hasClosedSession)) {
                  btnClass = "bg-destructive/10 text-destructive border border-destructive/20 cursor-not-allowed";
                  dotClass = "bg-destructive";
                } else if (isBaseOperatingDay) {
                  btnClass = "bg-muted text-muted-foreground cursor-not-allowed";
                  dotClass = "bg-destructive";
                } else {
                  btnClass = "bg-muted text-muted-foreground/60 cursor-not-allowed opacity-60";
                  dotClass = "bg-transparent";
                }
              } else {
                btnClass = "bg-muted text-muted-foreground cursor-not-allowed opacity-60";
                dotClass = "bg-transparent";
              }
            }

            // Highlight selected days even if they are unbookable
            if (isSelected && !isBookable) {
              btnClass = "bg-foreground text-background shadow-md font-black scale-[1.05]";
              dotClass = "bg-background";
            }

            return (
              <button
                key={dayObj.dateStr}
                onClick={() => handleDayClick(dayObj.dateStr, isBookable, closureForDate)}
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
            ผ่านไปแล้ว / วันหยุด
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-primary rounded-full shadow-sm"></span>
            เปิดรับจอง
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-destructive rounded-full shadow-sm"></span>
            ปิดรับจอง
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
