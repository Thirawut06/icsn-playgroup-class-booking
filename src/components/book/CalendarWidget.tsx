import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
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
  selectedDate: string | null;
  onDateSelect: (dayObj: DayObj) => void;
}

export function CalendarWidget({
  monthIndex,
  onMonthChange,
  selectedDate,
  onDateSelect,
}: CalendarWidgetProps) {
  const { 
    sessions, 
    myBookings, 
    blockoutDates, 
    settings, 
    selectedChildId 
  } = useBookingContext();
  const cutoffHour = settings?.cutoff_hour ?? 7;

  const [loadingDate, setLoadingDate] = useState<string | null>(null);
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
    <div className="bg-white rounded-2xl border border-border p-4 shadow-icsn-card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
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

          const isBookable = checkIsBookableDate(dayObj.dateStr, blockoutDates || [], cutoffHour);
          const isSelected = selectedDate === dayObj.dateStr;
          const isBooked = myBookings.some(b => b.session_date === dayObj.dateStr && b.child_id === selectedChildId);

          let btnClass = "text-muted-foreground/70 bg-muted/50";
          let dotClass = "bg-transparent";

          if (isBookable) {
            if (isSelected) {
              btnClass = "bg-icsn-teal text-white shadow-md font-black scale-[1.05]";
              dotClass = "bg-white";
            } else if (isBooked) {
              btnClass = "text-icsn-teal bg-icsn-teal/10 border border-icsn-teal/30 font-black";
              dotClass = "bg-icsn-teal";
            } else {
              btnClass = "text-icsn-navy bg-white border border-border hover:border-icsn-teal/30 hover:bg-icsn-teal/5";
              dotClass = "bg-icsn-teal";
            }
          } else {
            const isFuture = new Date(dayObj.dateStr) >= new Date(new Date().setHours(0, 0, 0, 0));
            if (isBooked) {
              if (isSelected) {
                btnClass = "bg-icsn-navy text-white shadow-md font-black scale-[1.05]";
                dotClass = "bg-white";
              } else {
                btnClass = "text-icsn-navy bg-icsn-navy/5 border border-icsn-navy/20 font-black";
                dotClass = "bg-icsn-navy";
              }
            } else if (isFuture) {
              btnClass = "text-muted-foreground/70 bg-muted/30 cursor-not-allowed";
              dotClass = "bg-error";
            } else {
              btnClass = "text-muted-foreground/70 bg-muted/50 cursor-not-allowed";
            }
          }

          return (
            <button
              key={dayObj.dateStr}
              onClick={() => onDateSelect(dayObj)}
              disabled={!isBookable || isBooked}
              className={`py-3 rounded-xl transition-all flex flex-col items-center justify-center relative ${(!isBookable || isBooked) ? 'cursor-not-allowed' : 'cursor-pointer active:scale-95'} ${btnClass}`}
            >
              <span>{dayObj.day}</span>
              <span className={`w-1.5 h-1.5 rounded-full mt-1 ${dotClass}`}></span>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="pt-3 border-t border-border flex flex-wrap justify-center gap-4 text-xs text-muted-foreground font-medium">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-muted border border-border rounded-full"></span>
          ผ่านไปแล้ว / วันหยุด
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-icsn-teal rounded-full shadow-sm"></span>
          เปิดให้จอง
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-error rounded-full shadow-sm"></span>
          เต็มแล้ว / ปิดจอง
        </span>
      </div>
    </div>
  );
}
