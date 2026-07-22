import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Session } from '@/types';
import { useBookingContext } from './BookingContext';
import { getThaiMonthName, checkIsBookableDate, findClosureForDate } from '@/utils/dateUtils';
import { useDictionary } from '@/lib/i18n/dictionary-context';

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
  const { dict, lang } = useDictionary();
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
  
  // Format month name based on locale
  let monthName = '';
  if (lang === 'th') {
    monthName = getThaiMonthName(currentViewDate);
  } else {
    monthName = currentViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

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
          <span>{dict.book.step2}</span>
        </h3>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onMonthChange(monthIndex - 1)}
            className="p-2 hover:bg-muted/80 rounded-xl transition text-icsn-navy disabled:opacity-30 disabled:hover:bg-transparent"
            disabled={monthIndex <= 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h4 className="text-sm font-bold text-icsn-navy bg-muted px-2.5 py-1.5 rounded-xl">
            {monthName}
          </h4>
          <button
            onClick={() => onMonthChange(monthIndex + 1)}
            className="p-2 hover:bg-muted/80 rounded-xl transition text-icsn-navy disabled:opacity-30 disabled:hover:bg-transparent"
            disabled={(() => {
              // Only allow advancing if the 1st of the next month is within 60 days from today
              const today = new Date();
              const maxDate = new Date(today);
              maxDate.setDate(maxDate.getDate() + 60);
              
              const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + monthIndex + 1, 1);
              return nextMonthDate > maxDate;
            })()}
            title={dict.book.nextMonthTitle}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Week Names */}
      <div className="grid grid-cols-7 text-center text-sm font-bold text-muted-foreground/70">
        {dict.book.weekDays.map(d => <div key={d}>{d}</div>)}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5 text-center font-bold text-base">
        {getDaysInMonth().map((dayObj, i) => {
          if (!dayObj) return <div key={`empty-${i}`} className="py-2 text-transparent"></div>;

          // Check if any active session is open for booking on this day
          const hasOpenSession = dayObj.sessions.some(s => s.is_active && (s.total_capacity - (s.booked_count || 0)) > 0);
          
          // Check if day is fundamentally bookable based on date/cutoff/closures/operatingDays
          const operatingDays = settings?.operating_days || [];
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
            // Unbookable state
            const targetDate = new Date(dayObj.dateStr + "T00:00:00Z");
            const dayOfWeek = targetDate.getUTCDay();
            const isBaseOperatingDay = operatingDays.includes(dayOfWeek);
            const closureForDate = findClosureForDate(closures, dayObj.dateStr);
            
            const isExplicitlyClosed = closureForDate && !closureForDate.is_force_open && isBaseOperatingDay;
            const hasAnySession = dayObj.sessions.length > 0;
            const isFullyBooked = isDateBookable && hasAnySession && !hasOpenSession;

            if (isBooked) {
              if (isSelected) {
                btnClass = "bg-foreground text-background shadow-md font-black scale-[1.05]";
                dotClass = "bg-background";
              } else {
                btnClass = "bg-foreground/5 text-foreground border border-foreground/20 font-black";
                dotClass = "bg-foreground";
              }
            } else if (isExplicitlyClosed || isFullyBooked) {
              // Explicitly closed by admin OR Operating day but fully booked
              btnClass = "bg-destructive/10 text-destructive border border-destructive/20 cursor-not-allowed";
              dotClass = "bg-destructive";
            } else {
              // Normal weekend / non-operating day / Past / >60 days / Past Cutoff
              btnClass = "bg-muted text-muted-foreground/60 cursor-not-allowed opacity-60";
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
          {dict.book.calendarLegendPast}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-primary rounded-full shadow-sm"></span>
          {dict.book.calendarLegendOpen}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-destructive rounded-full shadow-sm"></span>
          {dict.book.calendarLegendFull}
        </span>
      </div>
    </div>
  );
}
