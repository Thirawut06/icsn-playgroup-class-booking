import React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import type { Session, Booking } from '@/types';
import { getThaiMonthName, checkIsBookableDate } from '@/utils/dateUtils';

export interface DayObj {
  day: number;
  dateStr: string;
  sessions: Session[];
}

interface CalendarWidgetProps {
  monthIndex: number;
  onMonthChange: (index: number) => void;
  sessions: Session[];
  myBookings: Booking[];
  selectedDate: string | null;
  selectedChildId: string;
  onDateSelect: (dayObj: DayObj) => void;
}

export function CalendarWidget({
  monthIndex,
  onMonthChange,
  sessions,
  myBookings,
  selectedDate,
  selectedChildId,
  onDateSelect,
}: CalendarWidgetProps) {
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
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-icsn-card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h3 className="font-bold text-icsn-navy flex items-center gap-1.5 text-base">
          <CalendarIcon className="w-5 h-5 text-icsn-teal" />
          <span>2. เลือกวันที่เรียน</span>
        </h3>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onMonthChange(0)}
            className="p-2 hover:bg-gray-50 rounded-xl transition text-icsn-navy disabled:opacity-30 disabled:hover:bg-transparent"
            disabled={monthIndex === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h4 className="text-sm font-bold text-icsn-navy bg-gray-50 px-2.5 py-1.5 rounded-xl">
            {monthName}
          </h4>
          <button
            onClick={() => onMonthChange(1)}
            className="p-2 hover:bg-gray-50 rounded-xl transition text-icsn-navy disabled:opacity-30 disabled:hover:bg-transparent"
            disabled={monthIndex === 1}
            title="ดูรอบเรียนล่วงหน้า 2 เดือน"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Thai Week Names */}
      <div className="grid grid-cols-7 text-center text-sm font-bold text-gray-400">
        <div>อา</div><div>จ</div><div>อ</div><div>พ</div><div>พฤ</div><div>ศ</div><div>ส</div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5 text-center font-bold text-base">
        {getDaysInMonth().map((dayObj, i) => {
          if (!dayObj) return <div key={`empty-${i}`} className="py-2 text-transparent"></div>;

          const isBookable = checkIsBookableDate(dayObj.dateStr);
          const isSelected = selectedDate === dayObj.dateStr;
          const isBooked = myBookings.some(b => b.session_date === dayObj.dateStr && b.child_id === selectedChildId);

          let btnClass = "text-gray-300 bg-gray-50/50";
          let dotClass = "bg-transparent";

          if (isBookable) {
            if (isSelected) {
              btnClass = "bg-icsn-teal text-white shadow-md font-black scale-[1.05]";
              dotClass = "bg-white";
            } else if (isBooked) {
              btnClass = "text-icsn-teal bg-icsn-teal/10 border border-icsn-teal/30 font-black";
              dotClass = "bg-icsn-teal";
            } else {
              btnClass = "text-icsn-navy bg-white border border-gray-100 hover:border-icsn-teal/30 hover:bg-icsn-teal/5";
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
              btnClass = "text-gray-400 bg-gray-50/30 cursor-not-allowed";
              dotClass = "bg-rose-400";
            } else {
              btnClass = "text-gray-300 bg-gray-50/50 cursor-not-allowed";
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
      <div className="pt-3 border-t border-gray-50 flex flex-wrap justify-center gap-4 text-xs text-gray-500 font-medium">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-gray-100 border border-gray-200 rounded-full"></span>
          ผ่านไปแล้ว / วันหยุด
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-icsn-teal rounded-full shadow-sm"></span>
          เปิดให้จอง
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-rose-400 rounded-full shadow-sm"></span>
          เต็มแล้ว / ปิดจอง
        </span>
      </div>
      
      {/* Warning Rule Note */}
      <div className="bg-amber-50 border border-amber-200 text-amber-700 p-3 rounded-2xl flex items-start gap-2 mt-4">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
        <p className="text-xs font-bold leading-relaxed">
          ระบบจะปิดรับจองและ<span className="text-red-500">ไม่อนุญาตให้ยกเลิกสิทธิ์</span> ในวันที่มีการเรียนการสอนเวลา 07:00 น. เป็นต้นไป
        </p>
      </div>
    </div>
  );
}

